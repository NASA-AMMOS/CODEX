import "components/Graphs/TimeSeriesGraph.css";

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

function generatePlotData(features) {
    //generate time axis list
    let timeAxis = [];
    for (let i = 0; i < features[0].length; i++) {
        timeAxis.push(i);
    }

    let data = [];

    for (let i = 0; i < features.length; i++) {
        data[i] = {
            x: timeAxis,
            y: features[i],
            xaxis: "x",
            yaxis: "y1",
            mode: "lines",
            type: "scatter"
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
            margin: { l: 40, r: 5, t: 5, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            yaxis: {
                title: features[index][0],
                fixedrange: true
            }
        };

        let axisLabel = "xaxis" + (index + 1);
        layout[axisLabel] = {};

        if (index != features.length - 1) {
            layout[axisLabel].visible = false;
        } else {
            layout.margin.b = 25;
        }

        layouts.push(layout);
    }

    return layouts;
}

function TimeSeriesGraph(props) {
    //const features = utils.unzip(props.data.get("data"));
    const features = props.data.map(f => f.get("data")).toJS();

    const chartRefs = features.map(feat => useRef(null));

    let data = generatePlotData(features);

    let layouts = generateLayouts(features);

    return (
        <GraphWrapper
            resizeHandler={_ => chartRefs.forEach(chart => chart.current.resizeHandler())}
        >
            <ul className="time-series-plot-container">
                {data.map((dataElement, index) => (
                    <TimeSeriesSubGraph
                        key={index}
                        axisKey={"x" + (index + 1)}
                        data={data[index]}
                        chart={chartRefs[index]}
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

function TimeSeriesSubGraph(props) {
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
            className="time-series-subplot"
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
                let points = utils.indicesInRange(chartState.data[0].x, e.range.x[0], e.range.x[1]);
                props.setCurrentSelection(points);
            }}
        />
    );
}

export default props => {
    const win = useWindowManager(props, {
        width: 500,
        height: 500,
        resizeable: true,
        title: "Time Series Graph"
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
        <TimeSeriesGraph
            currentSelection={currentSelection}
            setCurrentSelection={setCurrentSelection}
            savedSelections={savedSelections}
            saveCurrentSelection={saveCurrentSelection}
            globalChartState={globalChartState}
            data={features}
        />
    );
};
