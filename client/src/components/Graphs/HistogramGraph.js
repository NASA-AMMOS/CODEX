import "components/Graphs/HistogramGraph.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";

import GraphWrapper from "components/Graphs/GraphWrapper";
import * as utils from "utils/utils";

import { filterSingleCol } from "./graphFunctions";
import {
    useSetWindowNeedsAutoscale,
    useWindowAxisLabels,
    useWindowFeatureList,
    useWindowGraphBinSize,
    useWindowGraphBounds,
    useWindowNeedsResetToDefault,
    useWindowTitle
} from "../../hooks/WindowHooks";

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
                        xref: `x`,
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
    const features = props.data.toJS();
    const [featuresImmutable] = useWindowFeatureList(props.win.id);
    const featureNames = featuresImmutable.toJS();
    const [bounds, setBounds] = useWindowGraphBounds(props.win.id);
    const [binSize, setBinSize] = useWindowGraphBinSize(props.win.id);
    const [axisLabels, setAxisLabels] = useWindowAxisLabels(props.win.id);
    const [needsResetToDefault, setNeedsResetToDefault] = useWindowNeedsResetToDefault(
        props.win.id
    );
    const [windowTitle, setWindowTitle] = useWindowTitle(props.win.id);
    const [needsAutoscale, setNeedsAutoscale] = useSetWindowNeedsAutoscale(props.win.id);

    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    const layouts = features.reduce((acc, feature, idx) => {
        const xAxisName = `xaxis`;
        const yAxisName = `yaxis${idx === 0 ? "" : idx + 1}`;
        acc[xAxisName] = {
            title: axisLabels && axisLabels.get(feature.feature, feature.feature),
            automargin: true,
            showline: false
        };
        acc[yAxisName] = {
            title: "Counts",
            automargin: true,
            fixedrange: true
        };
        return acc;
    }, {});

    const baseCols = featureNames
        .map(colName => [
            props.data
                .find(col => col.get("feature") === colName)
                .get("data")
                .toJS(),
            bounds && bounds.get(colName).toJS()
        ])
        .map(([col, bound]) => [utils.removeSentinelValues([col], props.fileInfo)[0], bound]);

    const filteredCols = baseCols.map(([col, bound]) => filterSingleCol(col, bound));

    const traces = features.map((feature, idx) => {
        const trace = {
            x: filteredCols[idx],
            type: "histogram",
            hoverinfo: "x+y",
            marker: { color: DEFAULT_POINT_COLOR },
            name: "",
            nbinsx: binSize ? binSize.get("x") : null
        };
        if (idx > 0) {
            trace.xaxis = `x`;
            trace.yaxis = `y${idx + 1}`;
        }
        return trace;
    });

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);

    const [chartState, setChartState] = useState({
        data: traces,
        layout: {
            grid: {
                rows: traces.length,
                columns: 1,
                subplots: utils.range(traces.length).map(idx => [`xy${idx ? idx + 1 : ""}`])
            },
            showlegend: false,
            margin: { l: 40, r: 5, t: 5, b: 5 }, // Axis tick labels are drawn in the margin space
            dragmode: handleGlobalChartState(props.globalChartState) || "select",
            selectdirection: "h",
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            ...layouts
        },
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

    const featureDisplayNames = props.win.data.features.map(featureName =>
        props.data.find(feature => feature.get("feature") === featureName).get("displayName")
    );

    function setDefaults() {
        setBounds(
            featureNames.reduce((acc, colName, idx) => {
                acc[colName] = {
                    min: Math.min(...baseCols[idx][0]),
                    max: Math.max(...baseCols[idx][0])
                };
                return acc;
            }, {})
        );
        setBinSize({
            x: DEFAULT_BINS
        });
        setAxisLabels(
            featureNames.reduce((acc, featureName) => {
                acc[featureName] = featureName;
                return acc;
            }, {})
        );
        setWindowTitle(featureDisplayNames.join(" , "));
    }

    useEffect(_ => {
        if (windowTitle) return; // Don't set defaults if we're keeping numbers from a previous chart in this window.
        setDefaults();
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
        [bounds, binSize]
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
        },
        [props.currentSelection, props.savedSelections]
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
                onSelected={e => {
                    if (!e) return;
                    const selKey = Object.keys(e.range).find(key => key.startsWith("x"));
                    const dataIndex = selKey.substr(1).length ? parseInt(selKey.substr(1)) - 1 : 0;
                    const points = utils.indicesInRange(
                        chartState.data[dataIndex].x,
                        e.range[selKey][0],
                        e.range[selKey][1]
                    );
                    props.setCurrentSelection(points);
                }}
            />
        </GraphWrapper>
    );
}

export default HistogramGraph;
