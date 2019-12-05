import "components/Graphs/ScatterGraph.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import {
    useCurrentSelection,
    useSavedSelections,
    usePinnedFeatures,
    useHoveredSelection,
    useFileInfo
} from "hooks/DataHooks";
import { useGlobalChartState } from "hooks/UIHooks";
import { useWindowManager } from "hooks/WindowHooks";
import GraphWrapper from "components/Graphs/GraphWrapper";
import * as utils from "utils/utils";

import { filterBounds } from "./graphFunctions";
import { usePrevious } from "../../hooks/UtilHooks";

const DEFAULT_POINT_COLOR = "rgba(0, 0, 0 ,0.5)";
const ANIMATION_RANGE = 15;
const ANIMATION_SPEED = 0.75;
const COLOR_CURRENT_SELECTION = "#FF0000";
const DEFAULT_TITLE = "Scatter Graph";

function ScatterGraph(props) {
    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    const sanitizedCols = utils.removeSentinelValues(
        props.win.data.features.map(colName =>
            props.data
                .find(col => col.get("feature") === colName)
                .get("data")
                .toJS()
        ),
        props.fileInfo
    );
    const cols = filterBounds(props.win.data.features, sanitizedCols, props.win.data.bounds);

    const xAxis = props.win.data.axisLabels
        ? props.win.data.axisLabels.x
        : props.win.data.features[0];
    const yAxis = props.win.data.axisLabels
        ? props.win.data.axisLabels.y
        : props.win.data.features[1];

    useEffect(_ => {
        if (!props.win.title) props.win.setTitle(props.win.data.features.join(" vs "));
        props.win.setData(data => ({
            ...data.toJS(),
            bounds:
                props.win.data.bounds ||
                props.win.data.features.reduce((acc, colName, idx) => {
                    acc[colName] = { min: Math.min(...cols[idx]), max: Math.max(...cols[idx]) };
                    return acc;
                }, {}),
            axisLabels: props.win.data.axisLabels || { x: xAxis, y: yAxis }
        }));
    }, []);

    // The plotly react element only changes when the revision is incremented.
    const chartRevision = useRef(0);

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: cols[0],
                y: cols[1],
                type: "scattergl",
                mode: "markers",
                marker: { color: cols[0].map((val, idx) => DEFAULT_POINT_COLOR), size: 5 },
                selected: { marker: { color: COLOR_CURRENT_SELECTION, size: 5 } },
                visible: true
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0, pad: 10 }, // Axis tick labels are drawn in the margin space
            dragmode: props.globalChartState || "lasso",
            datarevision: chartRevision.current,
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

    // Function to update the chart with the latest global chart selection. NOTE: The data is modified in-place.
    useEffect(
        _ => {
            if (!props.currentSelection) return;
            chartState.data[0].selectedpoints = props.currentSelection;
            updateChartRevision();
        },
        [props.currentSelection]
    );

    useEffect(
        _ => {
            setSelectionColors();
            updateChartRevision();
        },
        [props.savedSelections]
    );

    // Functions to animate selections that are being hovered over.
    const animationState = useRef({ index: 0, ascending: true });
    useEffect(
        _ => {
            if (props.hoverSelection === null) {
                setSelectionColors();
                updateChartRevision();
                return;
            }

            const activeSelection =
                props.hoverSelection === "current_selection"
                    ? { color: COLOR_CURRENT_SELECTION, isCurrentSelection: true }
                    : props.savedSelections.find(sel => sel.id === props.hoverSelection);

            const colorGradient = utils.createGradientStops(
                activeSelection.color,
                DEFAULT_POINT_COLOR,
                ANIMATION_RANGE
            );

            const animationInterval = setInterval(_ => {
                animationState.current.ascending =
                    animationState.current.index === 0
                        ? true
                        : animationState.current.index === ANIMATION_RANGE - 1
                        ? false
                        : animationState.current.ascending;

                // changing gradient going toward color saturation happens faster than
                // going toward de-saturated, which makes the points more saturated for
                // more time. I think.
                animationState.current.index = animationState.current.ascending
                    ? animationState.current.index + 2
                    : animationState.current.index - 1;

                const nextColor = colorGradient[animationState.current.index];

                if (activeSelection.isCurrentSelection) {
                    chartState.data[0].selected.marker.color = nextColor;
                } else {
                    activeSelection.rowIndices.forEach(row => {
                        chartState.data[0].marker.color[row] = nextColor;
                    });
                }
                updateChartRevision();
            }, ANIMATION_SPEED);

            return _ => {
                clearInterval(animationInterval);
                animationState.current = { index: 0, ascending: true };
                chartState.data[0].selected.marker.color = COLOR_CURRENT_SELECTION;
                setSelectionColors();
                updateChartRevision();
            };
        },
        [props.hoverSelection]
    );

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
            chartState.data[0].x = cols[0];
            chartState.data[0].y = cols[1];
            if (props.win.data.axisLabels) {
                chartState.layout.xaxis.title = props.win.data.axisLabels.x;
                chartState.layout.yaxis.title = props.win.data.axisLabels.y;
            }
            updateChartRevision();
        },
        [props.win.data.features]
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

export default ScatterGraph;
