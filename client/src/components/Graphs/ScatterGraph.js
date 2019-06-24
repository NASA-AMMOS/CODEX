import "components/Graphs/ScatterGraph.css";

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
import GraphWrapper from "components/Graphs/GraphWrapper";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useCurrentSelection, useSavedSelections, usePinnedFeatures } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UiHooks";

const DEFAULT_POINT_COLOR = "#3386E6";

function ScatterGraph(props) {
    const chart = useRef(null);

    // plug through data props
    const cols = props.data.map(f => f.get("data")).toJS();
    const xAxis = props.data.getIn([0, "feature"]);
    const yAxis = props.data.getIn([1, "feature"]);

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: cols[0],
                y: cols[1],
                type: "scattergl",
                mode: "markers",
                marker: { color: cols[0].map((val, idx) => DEFAULT_POINT_COLOR), size: 5 },
                selected: { marker: { color: "#FF0000", size: 5 } },
                visible: true
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0, pad: 10 }, // Axis tick labels are drawn in the margin space
            dragmode: "lasso",
            datarevision: chartRevision,
            hovermode: "closest", // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            xaxis: {
                automargin: true,
                title: xAxis
            },
            yaxis: {
                automargin: true,
                title: yAxis
            }
        },
        config: {
            responsive: true,
            displaylogo: false,
            modeBarButtons: [["zoomIn2d", "zoomOut2d", "autoScale2d"], ["toggleHover"]]
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

    // Function to update the chart with the latest global chart selection. NOTE: The data is modified in-place.
    useEffect(
        _ => {
            if (!props.currentSelection) return;
            chartState.data[0].selectedpoints = props.currentSelection;
            updateChartRevision();
        },
        [props.currentSelection]
    );

    // Function to color each chart point according to the current list of saved selections. NOTE: The data is modified in-place.
    useEffect(
        _ => {
            props.savedSelections.forEach(selection => {
                selection.rowIndices.forEach(row => {
                    chartState.data[0].marker.color[row] = selection.active
                        ? selection.color
                        : DEFAULT_POINT_COLOR;
                });
            });
            updateChartRevision();
        },
        [props.savedSelections]
    );

    return (
        <GraphWrapper chart={chart}>
            <Plot
                ref={chart}
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
                    if (e) props.setCurrentSelection(e.points.map(point => point.pointIndex));
                }}
            />
        </GraphWrapper>
    );
}

// wrapped data selector
export default props => {
    const win = useWindowManager(props, {
        width: 500,
        height: 500,
        resizeable: true,
        title: "Scatter Graph"
    });

    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    const [savedSelections, saveCurrentSelection] = useSavedSelections();
    const [globalChartState, setGlobalChartState] = useGlobalChartState();

    const features = usePinnedFeatures(win);

    if (features === null) {
        return <WindowCircularProgress />;
    }

    if (features.size === 2) {
        win.setTitle(
            features
                .map(f => f.get("feature"))
                .toJS()
                .join(" vs ")
        );
        return (
            <ScatterGraph
                currentSelection={currentSelection}
                setCurrentSelection={setCurrentSelection}
                savedSelections={savedSelections}
                saveCurrentSelection={saveCurrentSelection}
                globalChartState={globalChartState}
                data={features}
            />
        );
    } else {
        return (
            <WindowError>
                Please select exactly two features
                <br />
                in the features list to use this graph.
            </WindowError>
        );
    }
};
