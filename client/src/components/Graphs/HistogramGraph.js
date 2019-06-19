import "components/Graphs/HistogramGraph.css";

import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";
import Popover from "@material-ui/core/Popover";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Plot from "react-plotly.js";
import * as utils from "utils/utils";
import ReactResizeDetector from "react-resize-detector";
import GraphWrapper, { useBoxSelection } from "components/Graphs/GraphWrapper";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useCurrentSelection, useSavedSelections, usePinnedFeatures } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UiHooks";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_SELECTION_COLOR = "#FF0000";

function generatePlotData(features) {
    let data = [];

    for (let i = 0; i < features.length; i++) {
        data[i] = {
            x: features[i].data,
            xaxis: "x",
            yaxis: "y",
            type: "histogram"
        };
    }
    return data;
}

function generateLayouts(features) {
    let layouts = [];

    for (let index = 0; index < features.length; index++) {
        let layout = {
            dragmode: "select",
            selectdirection: "h",
            margin: { l: 50, r: 5, t: 20, b: 20 }, // Axis tick labels are drawn in the margin space
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            yaxis: {
                title: features[index][0],
                fixedrange: true
            },
            shapes: []
        };

        layouts.push(layout);
    }

    return layouts;
}

function HistogramGraph(props) {
    const features = props.data.toJS();
    
    const chartRefs = useRef(null);
    chartRefs.current = features;

    let data = generatePlotData(features);

    let layouts = generateLayouts(features);

    return (
        <GraphWrapper
            resizeHandler={_ => chartRefs.current.forEach((chartRef) => chartRef.current.resizeHandler())}
        >
            <ul className="histogram-graph-container">
                {data.map((dataElement, index) => (
                    <HistogramSubGraph
                        key={index}
                        data={data[index]}
                        chart={chartRefs.current[index]}
                        layout={layouts[index]}
                        setCurrentSelection={props.setCurrentSelection}
                        currentSelection={props.currentSelection}
                        savedSelections={props.savedSelections}
                    />
                ))}
            </ul>
        </GraphWrapper>
    );
}

function HistogramSubGraph(props) {
    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
    const [chartState, setChartState] = useState({
        data: [props.data],
        layout: props.layout,
        config: {
            responsive: true,
            displaylogo: false
        }
    });

    const [yRange, setYRange] = useState([0, 0]);

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

    const [selectionShapes] = useBoxSelection(
        "horizontal",
        props.currentSelection,
        props.savedSelections,
        chartState.data[0].x
    );

    useEffect(
        _ => {
            chartState.layout.shapes = selectionShapes;

            updateChartRevision();
        },
        [selectionShapes]
    );

    return (
        <Plot
            className="histogram-subplot"
            ref={props.chart}
            data={chartState.data}
            layout={chartState.layout}
            config={chartState.config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
            onInitialized={figure => setChartState(figure)}
            onUpdate={figure => setChartState(figure)}
            onClick={e => {
                if (e.event.button === 2 || e.event.ctrlKey) return;
                props.setCurrentSelection([]);
            }}
            onSelected={e => {
                if (!e) return;
                //fix range
                let points = utils.indicesInRange(chartState.data[0].x, e.range.x[0], e.range.x[1]);
                props.setCurrentSelection(points);
            }}
        />
    );
}

function mapStateToProps(state) {
    return {
        currentSelection: state.selections.currentSelection,
        savedSelections: state.selections.savedSelections
    };
}

function mapDispatchToProps(dispatch) {
    return {
        setCurrentSelection: bindActionCreators(selectionActions.setCurrentSelection, dispatch),
        saveCurrentSelection: bindActionCreators(selectionActions.saveCurrentSelection, dispatch)
    };
}

export default props => {
    const win = useWindowManager(props, {
        width: 500,
        height: 500,
        resizeable: true,
        title: "Histogram"
    });

    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    const [savedSelections, saveCurrentSelection] = useSavedSelections();
    const [globalChartState, setGlobalChartState] = useGlobalChartState();

    const features = usePinnedFeatures();

    if (features === null) {
        return <WindowCircularProgress />;
    }
    if (features.size === 0) {
        return <WindowError> Please select at least one feature to use this graph.</WindowError>;
    }

    win.setTitle(
        features
            .map(f => f.get("feature"))
            .toJS()
            .join(" vs ")
    );
    return (
        <HistogramGraph
            currentSelection={currentSelection}
            setCurrentSelection={setCurrentSelection}
            savedSelections={savedSelections}
            saveCurrentSelection={saveCurrentSelection}
            globalChartState={globalChartState}
            data={features}
        />
    );
};
