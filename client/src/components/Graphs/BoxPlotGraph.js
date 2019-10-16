import "components/Graphs/BoxPlotGraph.css";

import React, { useRef, useState, useEffect, createRef } from "react";
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
import {
    useCurrentSelection,
    useSavedSelections,
    usePinnedFeatures,
    useFileInfo
} from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UIHooks";

const DEFAULT_POINT_COLOR = "#3386E6";

function generatePlotData(features, fileInfo) {
    const cols = utils.removeSentinelValues(features.map(feature => feature.data), fileInfo);
    return features.map((feature, idx) => {
        return {
            y: cols[idx],
            yaxis: "y",
            type: "box",
            visible: true,
            name: feature.feature
        };
    });
}

function generateLayouts(features) {
    let layouts = [];

    for (let index = 0; index < features.length; index++) {
        let layout = {
            autosize: true,
            margin: { l: 15, r: 5, t: 5, b: 20 }, // Axis tick labels are drawn in the margin space
            dragmode: "select",
            selectdirection: "v",
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            xaxis: {
                automargin: true,
                showline: false
            },
            yaxis: {
                automargin: true,
                fixedrange: true
            },
            shapes: []
        };

        layouts.push(layout);
    }

    return layouts;
}

function BoxPlotGraph(props) {
    const [chartId] = useState(utils.createNewId());
    //const features = utils.unzip(props.data.get("data"));
    const features = props.data.toJS();

    const featureNames = features.map(feature => {
        return feature.feature;
    });

    const chartRefs = useRef(featureNames.map(() => createRef()));

    let data = generatePlotData(features, props.fileInfo);

    let layouts = generateLayouts(features);

    return (
        <GraphWrapper
            resizeHandler={_ =>
                chartRefs.current.forEach(chartRef => chartRef.current.resizeHandler())
            }
            chartId={chartId}
            win={props.win}
        >
            <ul className="box-plot-container">
                {data.map((dataElement, index) => (
                    <BoxPlotSubGraph
                        key={index}
                        data={dataElement}
                        chart={chartRefs.current[index]}
                        layout={layouts[index]}
                        globalChartState={props.globalChartState}
                        setCurrentSelection={props.setCurrentSelection}
                        currentSelection={props.currentSelection}
                        savedSelections={props.savedSelections}
                        chartId={chartId}
                    />
                ))}
            </ul>
        </GraphWrapper>
    );
}

function BoxPlotSubGraph(props) {
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

    let data = chartState.data[0].y;

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

    const [selectionShapes] = useBoxSelection(
        "vertical",
        props.currentSelection,
        props.savedSelections,
        chartState.data[0].y
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
            className="box-subplot"
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
                let points = utils.indicesInRange(chartState.data[0].y, e.range.y[0], e.range.y[1]);

                props.setCurrentSelection(points);
            }}
            divId={props.chartId}
        />
    );
}

export default props => {
    const win = useWindowManager(props, {
        width: 500,
        height: 500,
        resizeable: true,
        title: "Box Plot"
    });

    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    const [savedSelections, saveCurrentSelection] = useSavedSelections();
    const [globalChartState, setGlobalChartState] = useGlobalChartState();
    const fileInfo = useFileInfo();

    const features = usePinnedFeatures(win);

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
        <BoxPlotGraph
            currentSelection={currentSelection}
            setCurrentSelection={setCurrentSelection}
            savedSelections={savedSelections}
            saveCurrentSelection={saveCurrentSelection}
            globalChartState={globalChartState}
            data={features}
            fileInfo={fileInfo}
            win={win}
        />
    );
};
