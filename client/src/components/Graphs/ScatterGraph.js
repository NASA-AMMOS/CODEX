import "components/Graphs/ScatterGraph.css";

import { TinyColor } from "@ctrl/tinycolor";
import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";
import regression from "regression";

import GraphWrapper from "components/Graphs/GraphWrapper";
import * as utils from "utils/utils";

import { filterBounds } from "./graphFunctions";
import { unzip } from "../../utils/utils";
import {
    useSetWindowNeedsAutoscale,
    useWindowAxisLabels,
    useWindowAxisScale,
    useWindowDotOpacity,
    useWindowDotShape,
    useWindowDotSize,
    useWindowFeatureList,
    useWindowGraphBounds,
    useWindowNeedsResetToDefault,
    useWindowShowGridLines,
    useWindowTitle,
    useWindowTrendLineVisible,
    useWindowXAxis,
    useWindowYAxis
} from "../../hooks/WindowHooks";

const DEFAULT_POINT_COLOR = "rgba(0, 0, 0, 0.5)";
const DEFAULT_POINT_OPACITY = 0.5;
const DEFAULT_POINT_SHAPE = "circle";
const DEFAULT_POINT_SIZE = 5;
const ANIMATION_RANGE = 15;
const ANIMATION_SPEED = 0.75;
const COLOR_CURRENT_SELECTION = "#FF0000";
const DEFAULT_TITLE = "Scatter Graph";

function ScatterGraph(props) {
    const features = props.data.toJS();
    const [featuresImmutable] = useWindowFeatureList(props.win.id);
    const featureNames = featuresImmutable.toJS();
    const [bounds, setBounds] = useWindowGraphBounds(props.win.id);
    const [xAxis, setXAxis] = useWindowXAxis(props.win.id);
    const [yAxis, setYAxis] = useWindowYAxis(props.win.id);
    const [dotSize, setDotSize] = useWindowDotSize(props.win.id);
    const [dotOpacity, setDotOpacity] = useWindowDotOpacity(props.win.id);
    const [dotShape, setDotShape] = useWindowDotShape(props.win.id);
    const [axisScale, setAxisScale] = useWindowAxisScale(props.win.id);
    const [trendLineVisible, setTrendLineVisible] = useWindowTrendLineVisible(props.win.id);
    const [showGridLines, setShowGridLines] = useWindowShowGridLines(props.win.id);
    const [windowTitle, setWindowTitle] = useWindowTitle(props.win.id);
    const [axisLabels, setAxisLabels] = useWindowAxisLabels(props.win.id);
    const [needsResetToDefault, setNeedsResetToDefault] = useWindowNeedsResetToDefault(
        props.win.id
    );
    const [needsAutoscale, setNeedsAutoscale] = useSetWindowNeedsAutoscale(props.win.id);

    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    const sanitizedCols = utils.removeSentinelValues(
        featureNames.map(colName =>
            props.data
                .find(col => col.get("feature") === colName)
                .get("data")
                .toJS()
        ),
        props.fileInfo
    );

    const filteredCols = filterBounds(featureNames, sanitizedCols, bounds && bounds.toJS());

    const x = xAxis
        ? filteredCols[featureNames.findIndex(feature => feature === xAxis)]
        : filteredCols[0];
    const y = yAxis
        ? filteredCols[featureNames.findIndex(feature => feature === yAxis)]
        : filteredCols[1];

    const xAxisTitle =
        (axisLabels && axisLabels.get(xAxis)) ||
        props.data.find(feature => feature.get("feature") === featureNames[0]).get("displayName");

    const yAxisTitle =
        (axisLabels && axisLabels.get(yAxis)) ||
        props.data.find(feature => feature.get("feature") === featureNames[1]).get("displayName");

    const featureDisplayNames = props.win.data.features.map(featureName =>
        props.data.find(feature => feature.get("feature") === featureName).get("displayName")
    );

    // The plotly react element only changes when the revision is incremented.
    const chartRevision = useRef(0);

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x,
                y,
                type: "scattergl",
                mode: "markers",
                marker: { color: x.map((val, idx) => DEFAULT_POINT_COLOR), size: 5 },
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
                title: xAxisTitle
            },
            yaxis: {
                automargin: true,
                title: yAxisTitle
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

    function setDefaults() {
        setBounds(
            featureNames.reduce((acc, colName, idx) => {
                acc[colName] = {
                    min: Math.min(...sanitizedCols[idx]),
                    max: Math.max(...sanitizedCols[idx])
                };
                return acc;
            }, {})
        );
        setAxisLabels(
            featureNames.reduce((acc, featureName) => {
                acc[featureName] = featureName;
                return acc;
            }, {})
        );
        setDotSize(DEFAULT_POINT_SIZE);
        setDotOpacity(DEFAULT_POINT_OPACITY);
        setDotShape(DEFAULT_POINT_SHAPE);
        setAxisScale(
            featureNames.map(featureName => ({
                name: featureName,
                scale: "linear"
            }))
        );
        setTrendLineVisible(false);
        setShowGridLines(true);
        setXAxis(featureNames[0]);
        setYAxis(featureNames[1]);
        setWindowTitle(featureDisplayNames.join(" vs "));
    }

    useEffect(_ => {
        if (windowTitle) return; // Don't set defaults if we're keeping numbers from a previous chart in this window.
        setDefaults();
        updateChartRevision();
    }, []);

    // Function to update the chart with the latest global chart selection. NOTE: The data is modified in-place.
    useEffect(
        _ => {
            if (!props.currentSelection) return;
            chartState.data[0].selectedpoints = props.currentSelection;
            updateChartRevision();
        },
        [props.currentSelection]
    );

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
                        chartState.data[0].marker.color[row] = new TinyColor(selection.color)
                            .setAlpha(props.win.data.dotOpacity || DEFAULT_POINT_OPACITY)
                            .toString();
                    });
                }
            });
    }

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
            chartState.layout.dragmode = props.globalChartState;
            updateChartRevision();
        },
        [props.globalChartState]
    );

    function updateAxes() {
        chartState.data[0].x = x;
        chartState.data[0].y = y;
    }

    // Handles axis swap and label changes
    useEffect(
        _ => {
            updateAxes();
            chartState.layout.xaxis.title = xAxisTitle;
            chartState.layout.yaxis.title = yAxisTitle;
            chartState.data[0].marker.size = dotSize;
            chartState.data[0].selected.marker.size = dotSize;
            chartState.data[0].marker.color = chartState.data[0].marker.color.map(color =>
                new TinyColor(color).setAlpha(dotOpacity).toString()
            );
            chartState.data[0].selected.marker.color = new TinyColor(
                chartState.data[0].selected.marker.color
            )
                .setAlpha(dotOpacity)
                .toString();
            chartState.data[0].marker.symbol = dotShape;
            chartState.data[0].selected.marker.symbol = dotShape;
            chartState.layout.xaxis.type = axisScale
                ? axisScale.find(f => f.get("name") === featureNames[0]).get("scale")
                : "linear";
            chartState.layout.yaxis.type = axisScale
                ? axisScale.find(f => f.get("name") === featureNames[1]).get("scale")
                : "linear";
            if (trendLineVisible) {
                const [x, y] = unzip(regression.linear(unzip(filteredCols)).points);
                const trace = {
                    x,
                    y,
                    type: "scattergl",
                    mode: "lines",
                    marker: { color: "red", size: 5 },
                    visible: true
                };
                chartState.data.push(trace);
            } else {
                chartState.data.splice(1);
            }
            chartState.layout.xaxis.showgrid = showGridLines;
            chartState.layout.yaxis.showgrid = showGridLines;
            updateChartRevision();
        },
        [
            featuresImmutable,
            axisLabels,
            bounds,
            dotSize,
            dotOpacity,
            dotShape,
            trendLineVisible,
            axisScale,
            showGridLines,
            xAxis,
            yAxis
        ]
    );

    useEffect(
        _ => {
            if (needsResetToDefault) {
                setDefaults();
                setNeedsResetToDefault(false);
            }
        },
        [needsResetToDefault]
    );

    useEffect(
        _ => {
            if (needsAutoscale) {
                chartState.layout.xaxis.autorange = true;
                chartState.layout.yaxis.autorange = true;
                setNeedsAutoscale(false);
            }
        },
        [needsAutoscale]
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
