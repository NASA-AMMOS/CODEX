import "./HistogramGraph.css";

import { scaleLinear } from "d3-scale";
import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect, useLayoutEffect, useMemo } from "react";

import { filterSingleCol } from "./graphFunctions";
import {
    useSetWindowNeedsAutoscale,
    useWindowAxisLabels,
    useWindowAwareLabelShortener,
    useWindowFeatureList,
    useWindowGraphBinSize,
    useWindowGraphBounds,
    useWindowNeedsResetToDefault,
    useWindowTitle
} from "../../hooks/WindowHooks";
import GraphWrapper from "./GraphWrapper";
import * as utils from "../../utils/utils";

const DEFAULT_POINT_COLOR = "#3386E6";
const COLOR_CURRENT_SELECTION = "#FF0000";
const DEFAULT_TITLE = "Histogram Graph";
const DEFAULT_BINS = 25;

function snapValueToBin(value, binInfo) {
    for (let i = binInfo.start; i <= binInfo.end; i += binInfo.size) {
        if (value >= i && value < i + binInfo.size) {
            return Math.floor(i / binInfo.size) + 1;
        }
    }
}

function getBinBounds(binIndex, binInfo) {
    return [
        binInfo.start + binInfo.size * binIndex,
        binInfo.start + binInfo.size * binIndex + binInfo.size
    ];
}

function handleGlobalChartState(state) {
    return state === "lasso" ? "select" : state;
}

function makeSelectionShapes(selection, data, chartRef) {
    return data
        .map((col, idx) => {
            const binInfo = chartRef.current.el._fullData[idx].xbins;
            return Array.from(
                selection.rowIndices.reduce((acc, rowIndex) => {
                    acc.add(snapValueToBin(col.x[rowIndex], binInfo));
                    return acc;
                }, new Set())
            )
                .sort((a, b) => a - b)
                .reduce((acc, val) => {
                    const lastSection = acc.length && acc[acc.length - 1];
                    if (lastSection && lastSection[lastSection.length - 1] + 1 === val) {
                        lastSection.push(val);
                        return acc;
                    }
                    acc.push([val]);
                    return acc;
                }, [])
                .map(bin => {
                    const bounds = [
                        getBinBounds(bin[0], binInfo)[0],
                        getBinBounds(bin[bin.length - 1], binInfo)[1]
                    ];
                    const xSize = 1 / data.length;
                    const posIdx = data.length - idx - 1;
                    return {
                        type: "rect",
                        xref: `x${idx === 0 ? "" : idx + 1}`,
                        yref: "paper",
                        x0: bounds[0],
                        y0: posIdx * xSize,
                        x1: bounds[1],
                        y1: posIdx * xSize + xSize,
                        fillcolor: selection.color,
                        opacity: 0.2,
                        line: {
                            color: selection.color
                        }
                    };
                });
        })
        .flat();
}

function HistogramGraph(props) {
    const features = props.data;
    const [featuresImmutable] = useWindowFeatureList(props.win.id);
    const featureNames = featuresImmutable.toJS();
    const [bounds, setBounds] = useWindowGraphBounds(props.win.id);
    const [binSize, setBinSize] = useWindowGraphBinSize(props.win.id);
    const [axisLabels, setAxisLabels] = useWindowAxisLabels(props.win.id);
    const axisLabelShortener = useWindowAwareLabelShortener(props.win.id);
    const [needsResetToDefault, setNeedsResetToDefault] = useWindowNeedsResetToDefault(
        props.win.id
    );
    const [windowTitle, setWindowTitle] = useWindowTitle(props.win.id);
    const [needsAutoscale, setNeedsAutoscale] = useSetWindowNeedsAutoscale(props.win.id);
    const [zoom, setZoom] = useState([0, 100]);
    const [needsRedrawSelections, setNeedsRedrawSelections] = useState(false);

    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    const [baseCols] = useState(_ =>
        featureNames
            .map(colName => [props.data.find(col => col.feature === colName)?.data, colName])
            .map(([col, name]) => [utils.removeSentinelValues([col], props.fileInfo)[0], name])
    );

    const filteredCols = useMemo(
        _ =>
            baseCols.map(([col, name]) => {
                const bound = bounds && bounds.get(name);
                return filterSingleCol(col, bound && bound.toJS());
            }),
        [baseCols, bounds]
    );

    const layouts = useMemo(
        _ =>
            features.reduce((acc, feature, idx) => {
                const xAxisName = `xaxis${idx === 0 ? "" : idx + 1}`;
                const yAxisName = `yaxis${idx === 0 ? "" : idx + 1}`;
                const x = filteredCols[idx];
                const [min, max] = utils.getMinMax(x);
                const scale = scaleLinear()
                    .domain([0, 100])
                    .range([min, max]);
                const range = zoom.map(scale);
                acc[xAxisName] = {
                    title: "",
                    automargin: true,
                    showline: true,
                    showticklabels: true,
                    range
                };
                acc[yAxisName] = {
                    title:
                        (axisLabels && axisLabels.get(feature.feature, feature.feature)) ||
                        feature.feature,
                    automargin: true,
                    fixedrange: true
                };
                return acc;
            }, {}),
        [filteredCols, axisLabels]
    );

    const traces = useMemo(
        _ =>
            features.map((feature, idx) => {
                const x = filteredCols[idx];
                const [min, max] = utils.getMinMax(x);
                const trace = {
                    x,
                    type: "histogram",
                    hoverinfo: "y",
                    marker: { color: DEFAULT_POINT_COLOR },
                    name: "",
                    xbins: {
                        start: min,
                        end: max,
                        size: (max - min) / ((binSize && binSize.get("x")) || DEFAULT_BINS)
                    },
                    selected: { marker: { color: DEFAULT_POINT_COLOR } }
                };
                if (idx > 0) {
                    trace.xaxis = `x${idx + 1}`;
                    trace.yaxis = `y${idx + 1}`;
                }
                return trace;
            }),
        [filteredCols, binSize]
    );

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);

    const layout = {
        grid: {
            rows: traces.length,
            columns: 1,
            pattern: "independent"
        },
        showlegend: false,
        margin: { l: 40, r: 5, t: 5, b: 5 }, // Axis tick labels are drawn in the margin space
        dragmode: handleGlobalChartState(props.globalChartState) || "select",
        selectdirection: "h",
        hovermode: "compare", // Turning off hovermode seems to screw up click handling
        ...layouts
    };

    const [chartState, setChartState] = useState({
        data: traces,
        layout,
        config: {
            responsive: true,
            displaylogo: false,
            modeBarButtons: [["toImage", "zoomIn2d", "zoomOut2d", "autoScale2d"], ["toggleHover"]]
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

    const featureDisplayNames = props.win.data.features.map(
        featureName => props.data.find(feature => feature.feature === featureName)?.displayName
    );

    function setDefaults(init) {
        if (!init || !bounds)
            setBounds(
                featureNames.reduce((acc, colName, idx) => {
                    const [min, max] = utils.getMinMax(baseCols[idx][0]);
                    acc[colName] = {
                        min,
                        max
                    };
                    return acc;
                }, {})
            );
        if (!init || !binSize)
            setBinSize({
                x: DEFAULT_BINS
            });
        if (!init || !axisLabels)
            setAxisLabels(
                featureNames.reduce((acc, featureName) => {
                    acc[featureName] = featureName;
                    return acc;
                }, {})
            );
        if (!init || !windowTitle) setWindowTitle(featureDisplayNames.join(" , "));
    }

    useEffect(_ => {
        setDefaults(true);
        updateChartRevision();
    }, []);

    useEffect(
        _ => {
            if (needsResetToDefault) {
                setDefaults();
                setNeedsResetToDefault(false);
            }
        },
        [needsResetToDefault]
    );

    function updateData() {
        chartState.data = traces;
        chartState.layout = layout;
    }

    useEffect(
        _ => {
            chartState.layout.shapes = props.savedSelections
                .concat(
                    props.currentSelection.length && {
                        color: COLOR_CURRENT_SELECTION,
                        rowIndices: props.currentSelection
                    }
                )
                .filter(x => x)
                .map(sel => makeSelectionShapes(sel, traces, chart))
                .flat();
            updateData();
            updateChartRevision();
        },
        [bounds, binSize, axisLabels, zoom]
    );

    // Effect to handle drawing of selections
    useEffect(
        _ => {
            chartState.layout.shapes = props.savedSelections
                .concat(
                    props.currentSelection.length && {
                        color: COLOR_CURRENT_SELECTION,
                        rowIndices: props.currentSelection
                    }
                )
                .filter(x => x)
                .map(sel => makeSelectionShapes(sel, traces, chart))
                .flat();
            updateChartRevision();
            setNeedsRedrawSelections(false);
        },
        [props.currentSelection, props.savedSelections, needsRedrawSelections]
    );

    // Update the chart state when the global chart state changes
    useEffect(
        _ => {
            chartState.layout.dragmode = handleGlobalChartState(props.globalChartState);
            updateChartRevision();
        },
        [props.globalChartState]
    );

    useEffect(
        _ => {
            if (needsAutoscale) {
                Object.keys(chartState.layout).map(key => {
                    if (key.includes("axis")) chartState.layout[key].autorange = true;
                });
                updateChartRevision();
                setNeedsAutoscale(false);
            }
        },
        [needsAutoscale]
    );

    // Synchronizes zoom/pan actions
    function handleRelayout(e) {
        const selKey = Object.keys(e).find(key => key.startsWith("xaxis"));
        if (!selKey) return;
        const parsedKey = selKey.match(/xaxis(\d)/) ? selKey.match(/xaxis(\d)/) : ["xaxis", 1];
        const dataIndex = parseInt(parsedKey[1]) - 1;
        const zoomMin = e[`${parsedKey[0]}.range[0]`];
        const zoomMax = e[`${parsedKey[0]}.range[1]`];
        const dataset = filteredCols[dataIndex];
        const [min, max] = utils.getMinMax(dataset);
        const scale = scaleLinear()
            .domain([min, max])
            .range([0, 100]);
        setZoom([zoomMin, zoomMax].map(scale));
        setNeedsRedrawSelections(true);
    }

    useLayoutEffect(() => {
        axisLabelShortener(chartId, layouts);
    }, [chartState]);

    function handleSelection(e) {
        if (!e) return;
        const selKey = Object.keys(e.range).find(key => key.startsWith("x"));
        const dataIndex = selKey.substr(1).length ? parseInt(selKey.substr(1)) - 1 : 0;
        const points = utils.indicesInRange(
            filteredCols[dataIndex],
            e.range[selKey][0],
            e.range[selKey][1]
        );
        props.setCurrentSelection(points);
    }

    return (
        <GraphWrapper chart={chart} win={props.win} chartId={chartId}>
            <Plot
                ref={chart}
                data={chartState.data}
                layout={chartState.layout}
                config={chartState.config}
                style={{ width: "100%", height: "100%" }}
                onInitialized={figure => setChartState(figure)}
                onUpdate={figure => setChartState(figure)}
                useResizeHandler
                divId={chartId}
                onClick={e => {
                    if (e.event.button === 2 || e.event.ctrlKey) return;
                    props.setCurrentSelection([]);
                }}
                onSelected={handleSelection}
                onRelayout={handleRelayout}
            />
        </GraphWrapper>
    );
}

export default HistogramGraph;
