// import "components/Graphs/SingleXMultipleYGraph.scss";

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
import {
    useCurrentSelection,
    useSavedSelections,
    usePinnedFeatures,
    useHoveredSelection,
    useFileInfo
} from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UIHooks";
import * as uiTypes from "constants/uiTypes";

const DEFAULT_POINT_COLOR = "rgba(0, 0, 0 ,0.5)";
const ANIMATION_RANGE = 15;
const ANIMATION_SPEED = 0.75;
const COLOR_CURRENT_SELECTION = "#FF0000";

function SingleXMultipleYGraph(props) {
    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    function getProcessedData() {
        return utils.removeSentinelValues(
            props.data.map(col => col.get("data")).toJS(),
            props.fileInfo
        );
    }
    const processedData = getProcessedData();

    // Generic index array
    const indexAry = [...Array(processedData[0].length)].map((_, idx) => idx);

    // Set initial x-axis as the index
    useEffect(_ => props.win.setData(data => ({ ...data.toJS(), xAxis: uiTypes.GRAPH_INDEX })), []);

    function getXAxis() {
        if (!props.win.data.xAxis || props.win.data.xAxis === uiTypes.GRAPH_INDEX) return indexAry;
        const colIndex = props.data.findIndex(col => col.get("feature") === props.win.data.xAxis);
        return processedData[colIndex];
    }
    const xAxisData = getXAxis();

    function getYAxes() {
        return props.data
            .filter(col => col.get("feature") !== props.win.data.xAxis)
            .map((col, idx) => ({ name: col.get("feature"), data: processedData[idx] }))
            .toJS();
    }
    const cols = getYAxes();

    // Here we assign colors to the seleted features and update the window state with them for use elsewhere.
    const palette = utils.getSelectionPalette();
    const featureInfo = props.win.data.features.map((feature, idx) => {
        return { name: feature, color: palette[idx] };
    });
    props.win.setData(data => ({ ...data.toJS(), featureInfo }));

    function getXAxisTitle() {
        return !props.win.data.xAxis || props.win.data.xAxis === uiTypes.GRAPH_INDEX
            ? "Index"
            : props.win.data.xAxis;
    }

    function getYAxisTitle() {
        return props.data
            .filter(col => col.get("feature") !== props.win.data.xAxis)
            .map(col => col.get("feature"))
            .join(", ");
    }

    function makeSelectionTrace(selection) {
        return getYAxes().map(col => {
            return {
                x: getXAxis(),
                y: selection.rowIndices.reduce((acc, idx) => {
                    acc[idx] = col.data[idx];
                    return acc;
                }, Array(col.data.length).fill(null)),
                type: "scatter",
                mode: "lines",
                marker: { color: selection.color },
                visible: true,
                title: "selection",
                connectgaps: false,
                hoverinfo: "x+y"
            };
        });
    }

    // The plotly react element only changes when the revision is incremented.
    const chartRevision = useRef(0);

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: cols.map((col, idx) => ({
            x: xAxisData,
            y: col.data,
            type: "scatter",
            mode: "lines",
            marker: { color: featureInfo.find(f => f.name === col.name).color },
            visible: true,
            hoverinfo: "x+y"
        })),
        layout: {
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0, pad: 10 }, // Axis tick labels are drawn in the margin space
            dragmode: props.globalChartState || "lasso",
            datarevision: chartRevision.current,
            hovermode: "closest", // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            xaxis: {
                automargin: true,
                title: getXAxisTitle()
            },
            yaxis: {
                automargin: true,
                title: getYAxisTitle()
            },
            showlegend: false
        },
        config: {
            responsive: true,
            displaylogo: false,
            modeBarButtons: [["zoomIn2d", "zoomOut2d", "autoScale2d"], ["toggleHover"]]
        }
    });

    function updateChartRevision() {
        chartRevision.current++;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: chartRevision.current }
        });
    }

    function setSelectionColors() {
        chartState.data[0].marker.color.forEach((row, idx) => {
            chartState.data[0].marker.color[idx] = DEFAULT_POINT_COLOR;
        });

        props.savedSelections
            .concat()
            .reverse()
            .forEach(selection => {
                if (!selection.hidden) {
                    selection.rowIndices.forEach(row => {
                        chartState.data[0].marker.color[row] = selection.color;
                    });
                }
            });
    }

    function updateSelections() {
        // Remove all selections so we can re-render them
        chartState.data = chartState.data.filter(
            trace => !trace.title || trace.title.text !== "selection"
        );

        // Add saved selections
        chartState.data = chartState.data.concat(
            ...props.savedSelections.map(selection => makeSelectionTrace(selection, cols))
        );

        // Add currrent selection (if there is one)
        if (props.currentSelection && props.currentSelection.length) {
            chartState.data = chartState.data.concat(
                makeSelectionTrace({
                    rowIndices: props.currentSelection,
                    color: "red"
                })
            );
        }

        updateChartRevision();
    }

    // Function to update the chart with the latest global chart selections. NOTE: The data is modified in-place.
    useEffect(_ => updateSelections(), [props.currentSelection, props.savedSelections]);

    // useEffect(
    //     _ => {
    //         setSelectionColors();
    //         updateChartRevision();
    //     },
    //     [props.savedSelections]
    // );

    // // Functions to animate selections that are being hovered over.
    // const animationState = useRef({ index: 0, ascending: true });
    // useEffect(
    //     _ => {
    //         if (props.hoverSelection === null) {
    //             setSelectionColors();
    //             updateChartRevision();
    //             return;
    //         }

    //         const activeSelection =
    //             props.hoverSelection === "current_selection"
    //                 ? { color: COLOR_CURRENT_SELECTION, isCurrentSelection: true }
    //                 : props.savedSelections.find(sel => sel.id === props.hoverSelection);

    //         const colorGradient = utils.createGradientStops(
    //             activeSelection.color,
    //             DEFAULT_POINT_COLOR,
    //             ANIMATION_RANGE
    //         );

    //         const animationInterval = setInterval(_ => {
    //             animationState.current.ascending =
    //                 animationState.current.index === 0
    //                     ? true
    //                     : animationState.current.index === ANIMATION_RANGE - 1
    //                     ? false
    //                     : animationState.current.ascending;

    //             // changing gradient going toward color saturation happens faster than
    //             // going toward de-saturated, which makes the points more saturated for
    //             // more time. I think.
    //             animationState.current.index = animationState.current.ascending
    //                 ? animationState.current.index + 2
    //                 : animationState.current.index - 1;

    //             const nextColor = colorGradient[animationState.current.index];

    //             if (activeSelection.isCurrentSelection) {
    //                 chartState.data[0].selected.marker.color = nextColor;
    //             } else {
    //                 activeSelection.rowIndices.forEach(row => {
    //                     chartState.data[0].marker.color[row] = nextColor;
    //                 });
    //             }
    //             updateChartRevision();
    //         }, ANIMATION_SPEED);

    //         return _ => {
    //             clearInterval(animationInterval);
    //             animationState.current = { index: 0, ascending: true };
    //             chartState.data[0].selected.marker.color = COLOR_CURRENT_SELECTION;
    //             setSelectionColors();
    //             updateChartRevision();
    //         };
    //     },
    //     [props.hoverSelection]
    // );

    useEffect(
        _ => {
            chartState.layout.dragmode = props.globalChartState; // Weirdly this works, can't do it with setChartState
            updateChartRevision();
        },
        [props.globalChartState]
    );

    // Effect to keep axes updated if they've been swapped
    useEffect(
        _ => {
            const xAxisData = getXAxis();

            chartState.data = getYAxes().map((col, idx) => ({
                x: xAxisData,
                y: col.data,
                type: "scatter",
                mode: "lines",
                marker: { color: featureInfo.find(f => f.name === col.name).color },
                visible: true,
                hoverinfo: "x+y"
            }));

            chartState.layout.xaxis.title = getXAxisTitle();
            chartState.layout.yaxis.title = getYAxisTitle();
            updateSelections();
        },
        [props.win.data.features, props.win.data.xAxis]
    );

    return (
        <GraphWrapper chart={chart} chartId={chartId} win={props.win}>
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
                divId={chartId}
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
        title: "Single X Multiple Y Graph"
    });

    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    const [savedSelections, saveCurrentSelection] = useSavedSelections();
    const [globalChartState, setGlobalChartState] = useGlobalChartState();
    const [hoverSelection, saveHoverSelection] = useHoveredSelection();
    const fileInfo = useFileInfo();

    const features = usePinnedFeatures(win);

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    if (features.size) {
        win.setTitle(win.data.features.join(","));
        return (
            <SingleXMultipleYGraph
                currentSelection={currentSelection}
                setCurrentSelection={setCurrentSelection}
                savedSelections={savedSelections}
                saveCurrentSelection={saveCurrentSelection}
                hoverSelection={hoverSelection}
                globalChartState={globalChartState}
                data={features}
                fileInfo={fileInfo}
                win={win}
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
