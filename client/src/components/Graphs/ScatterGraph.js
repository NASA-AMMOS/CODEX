import "./ScatterGraph.css";

import { TinyColor } from "@ctrl/tinycolor";
import { scaleLog } from "d3-scale";
import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect, useMemo } from "react";
import regression from "regression";

import { WindowCircularProgress } from "../WindowHelpers/WindowCenter";
import { filterBounds } from "./graphFunctions";
import { usePrevious } from "../../hooks/UtilHooks";
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
import GraphWrapper from "./GraphWrapper";
import * as utils from "../../utils/utils";

const DEFAULT_POINT_COLOR = [0, 0, 0, 0.5];
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

    // To avoid needless rerenders, we only start rendering traces once all defaults have been set.
    const [defaultsInitialized, setDefaultsInitialized] = useState(false);
    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    const [sanitizedCols] = useState(_ =>
        utils.removeSentinelValues(
            featureNames.map(colName =>
                props.data
                    .find(col => col.get("feature") === colName)
                    .get("data")
                    .toJS()
            ),
            props.fileInfo
        )
    );

    const filteredCols = useMemo(
        _ => {
            const baseData = filterBounds(featureNames, sanitizedCols, bounds && bounds.toJS());
            if (!axisScale) return baseData;
            return baseData.map((col, idx) => {
                const scaleData = axisScale.find(f => f.get("name") === featureNames[idx]);
                const scale = scaleData ? scaleData.get("scale") : "linear";
                if (scale === "linear") return col;
                const [_, max] = utils.getMinMax(col);
                const scaleFunc = scaleLog()
                    .clamp(true)
                    .domain([0.1, max])
                    .nice();
                return col.map(val => scaleFunc(val));
            });
        },
        [bounds]
    );

    const baseX = xAxis
        ? filteredCols[featureNames.findIndex(feature => feature === xAxis)]
        : filteredCols[0];
    const baseY = yAxis
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

    // Want to avoid redrawing the selections unless we know that something visual has changed
    const previousSelectionIds = usePrevious(
        props.savedSelections.map(sel => [sel.id, sel.hidden])
    );
    const newSelections =
        JSON.stringify(previousSelectionIds) !==
        JSON.stringify(props.savedSelections.map(sel => [sel.id, sel.hidden]));
    const baseTrace = useMemo(
        _ => {
            if (!defaultsInitialized) return [];
            const x = baseX;
            const y = baseY;
            const colors = Array(baseX.length).fill(
                props.hoverSelection
                    ? `rgba(${DEFAULT_POINT_COLOR.slice(0, -1)
                          .concat([0.1])
                          .join(",")})`
                    : `rgba(${DEFAULT_POINT_COLOR.join(",")})`
            );
            props.savedSelections.forEach(sel => {
                if (sel.hidden) return;
                sel.rowIndices.forEach(idx => {
                    colors[idx] = "rgba(0,0,0,0)";
                });
            });
            props.currentSelection.forEach(idx => (colors[idx] = "rgba(0,0,0,0)"));
            return {
                x,
                y,
                type: "scattergl",
                mode: "markers",
                hoverinfo: "x+y",
                marker: {
                    color: colors,
                    size: dotSize || DEFAULT_POINT_SIZE,
                    symbol: dotShape || DEFAULT_POINT_SHAPE
                },
                visible: true,
                name: "baseData"
            };
        },
        [
            baseX,
            baseY,
            newSelections,
            props.hoverSelection,
            props.currentSelection,
            dotOpacity,
            dotSize,
            dotShape
        ]
    );

    const trendLineTrace = useMemo(
        _ => {
            if (!trendLineVisible) return [];
            const [x, y] = utils.unzip(regression.linear(utils.unzip(filteredCols)).points);
            return {
                x,
                y,
                type: "scattergl",
                mode:
                    axisScale && axisScale.every(x => x.get("scale") === "log")
                        ? "markers"
                        : "lines",
                hoverinfo: "x+y",
                marker: { color: "red", size: 5 }
            };
        },
        [filteredCols, trendLineVisible]
    );

    const selectionTraces = useMemo(
        _ => {
            if (!defaultsInitialized) return [];
            const currentSelectionTrace = props.currentSelection
                ? { color: "red", rowIndices: props.currentSelection }
                : [];
            return props.savedSelections
                .filter(sel => !sel.hidden)
                .concat(props.hoverSelection ? currentSelectionTrace : [])
                .sort((a, b) =>
                    a.id === props.hoverSelection ? 1 : b.id === props.hoverSelection ? -1 : 0
                )
                .concat(!props.hoverSelection ? currentSelectionTrace : [])
                .filter(sel => sel.rowIndices.length)
                .map((sel, _, ary) => {
                    const [x, y] = utils.unzip(sel.rowIndices.map(idx => [baseX[idx], baseY[idx]]));
                    const opacity =
                        props.hoverSelection && props.hoverSelection !== sel.id ? 0.1 : dotOpacity;
                    return {
                        x,
                        y,
                        type: "scattergl",
                        mode: "markers",
                        marker: {
                            color: new TinyColor(sel.color).setAlpha(opacity).toString(),
                            size: dotSize || DEFAULT_POINT_SIZE,
                            symbol: dotShape || DEFAULT_POINT_SHAPE
                        },
                        visible: true
                    };
                });
        },
        [
            baseX,
            baseY,
            newSelections,
            props.hoverSelection,
            props.currentSelection,
            dotOpacity,
            dotSize,
            dotShape
        ]
    );

    const traces = [baseTrace, trendLineTrace, ...selectionTraces];

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: traces,
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
        if (!bounds)
            setBounds(
                featureNames.reduce((acc, colName, idx) => {
                    const [min, max] = utils.getMinMax(sanitizedCols[idx]);
                    acc[colName] = {
                        min,
                        max
                    };
                    return acc;
                }, {})
            );
        if (!axisLabels)
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
        if (!xAxis) setXAxis(featureNames[0]);
        if (!yAxis) setYAxis(featureNames[1]);
        if (!windowTitle) setWindowTitle(featureDisplayNames.join(" vs "));
        setDefaultsInitialized(true);
    }

    useEffect(_ => {
        setDefaults();
        updateChartRevision();
    }, []);

    useEffect(
        _ => {
            chartState.layout.dragmode = props.globalChartState;
            updateChartRevision();
        },
        [props.globalChartState]
    );

    function updateAxes() {
        chartState.data = traces;
    }

    // Handles axis swap and label changes
    useEffect(
        _ => {
            updateAxes();
            chartState.layout.xaxis.title = xAxisTitle;
            chartState.layout.yaxis.title = yAxisTitle;
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
            yAxis,
            props.savedSelections,
            props.hoverSelection,
            props.currentSelection
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
                updateChartRevision();
                setNeedsAutoscale(false);
            }
        },
        [needsAutoscale]
    );

    const [loading, setLoading] = useState(true);

    return (
        <GraphWrapper chart={chart} chartId={chartId} win={props.win}>
            {loading ? <WindowCircularProgress /> : null}
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
                    if (e)
                        props.setCurrentSelection(
                            e.points
                                .filter(point => point.data.name === "baseData")
                                .map(point => point.pointIndex)
                        );
                }}
                onAfterPlot={_ => setLoading(false)}
                divId={chartId}
            />
        </GraphWrapper>
    );
}

export default ScatterGraph;
