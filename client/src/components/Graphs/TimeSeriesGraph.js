import "components/Graphs/TimeSeriesGraph.css";

import React, { useRef, useState, useEffect } from "react";
import plotComponentFactory from "react-plotly.js/factory";
import regression from "regression";

import GraphWrapper from "components/Graphs/GraphWrapper";
import PlotlyPatched from "plotly-patched/src/core";
import * as utils from "utils/utils";

import { filterSingleCol } from "./graphFunctions";
import { unzip } from "../../utils/utils";
import {
    useSetWindowNeedsAutoscale,
    useWindowAxisLabels,
    useWindowFeatureList,
    useWindowGraphBinSize,
    useWindowGraphBounds,
    useWindowNeedsResetToDefault,
    useWindowShowGridLines,
    useWindowTitle,
    useWindowTrendLineVisible
} from "../../hooks/WindowHooks";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_TITLE = "Time Series Graph";
const COLOR_CURRENT_SELECTION = "#FF0000";

// Using a patched version of plotly that allows us to toggle only certain shapes to be editable,
// and only use horizontal drag bars.
const Plot = plotComponentFactory(PlotlyPatched);

function handleGlobalChartState(state) {
    return state === "lasso" ? "select" : state;
}

function makeSelectionShapes(selection) {
    return !selection.rowIndices.length
        ? null
        : selection.rowIndices
              .reduce((acc, val) => {
                  const lastSection = acc.length && acc[acc.length - 1];
                  if (lastSection && lastSection[lastSection.length - 1] + 1 === val) {
                      lastSection.push(val);
                      return acc;
                  }

                  acc.push([val]);
                  return acc;
              }, [])
              .map(section => {
                  return {
                      type: "rect",
                      xref: "x",
                      yref: "paper",
                      x0: section[0],
                      y0: 0,
                      x1: section[section.length - 1],
                      y1: 1,
                      fillcolor: selection.color,
                      opacity: 0.2,
                      line: {
                          // Draw a line when the selection is only a single point
                          width: section.length === 1 ? 1 : 0,
                          color: selection.color
                      },
                      editable: Boolean(selection.editable),
                      horizontalOnly: true
                  };
              });
}

function TimeSeriesGraph(props) {
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
    const [showGridLines, setShowGridLines] = useWindowShowGridLines(props.win.id);
    const [trendLineVisible, setTrendLineVisible] = useWindowTrendLineVisible(props.win.id);
    const [needsAutoscale, setNeedsAutoscale] = useSetWindowNeedsAutoscale(props.win.id);

    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    const layouts = features.reduce((acc, feature, idx) => {
        const axisName = `yaxis${idx === 0 ? "" : idx + 1}`;
        acc[axisName] = {
            title: axisLabels && axisLabels.get(feature.feature, feature.feature),
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

    const timeAxis = [...Array(filteredCols[0].length).keys()];
    const traces = features.map((feature, idx) => {
        const trace = {
            x: timeAxis,
            y: filteredCols[idx],
            mode: "lines",
            type: "scatter",
            hoverinfo: "x+y",
            marker: { color: DEFAULT_POINT_COLOR }
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
            margin: { l: 40, r: 5, t: 5, b: 20 }, // Axis tick labels are drawn in the margin space
            dragmode: handleGlobalChartState(props.globalChartState) || "select",
            selectdirection: "h",
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            ...layouts
        },
        config: {
            responsive: true,
            displaylogo: false,
            editable: true,
            edits: {
                annotationPosition: false,
                axisTitleText: false,
                annotationTail: false,
                annotationText: false,
                colorbarPosition: false,
                colorbarTitleText: false,
                legendPosition: false,
                legendText: false,
                shapePosition: true,
                titleText: false
            },
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

    const featureDisplayNames = featureNames.map(featureName =>
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
        setAxisLabels(
            featureNames.reduce((acc, featureName) => {
                acc[featureName] = featureName;
                return acc;
            }, {})
        );
        setWindowTitle(featureDisplayNames.join(" , "));
        setShowGridLines(true);
        setTrendLineVisible(false);
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
            updateData();
            updateChartRevision();
        },
        [bounds]
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
            chartState.layout = Object.assign(chartState.layout, layouts);
            updateChartRevision();
        },
        [axisLabels]
    );

    function drawTrendLines() {
        if (trendLineVisible) {
            const timeAxis = [...Array(filteredCols[0].length).keys()];
            features.forEach((feature, idx) => {
                const [x, y] = unzip(
                    regression.linear(unzip([timeAxis, filteredCols[idx]])).points
                );
                const trace = {
                    x,
                    y,
                    type: "scatter",
                    mode: "lines",
                    marker: { color: "red", size: 5 },
                    visible: true,
                    isTrendLine: true
                };
                if (idx > 0) {
                    trace.xaxis = `x`;
                    trace.yaxis = `y${idx + 1}`;
                }
                chartState.data.push(trace);
            });
        } else {
            chartState.data = chartState.data.filter(trace => !trace.isTrendLine);
        }
    }

    useEffect(
        _ => {
            drawTrendLines();
            updateChartRevision();
        },
        [trendLineVisible]
    );

    useEffect(
        _ => {
            Object.keys(chartState.layout).forEach(key => {
                if (!key.includes("axis")) return;
                chartState.layout[key].showgrid = showGridLines;
            });
            updateChartRevision();
            drawTrendLines();
            updateChartRevision();
        },
        [showGridLines]
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
                    props.setCurrentSelection(
                        utils.range(Math.floor(e.range.x[0]), Math.ceil(e.range.x[1]))
                    );
                }}
                onRelayout={e => {
                    if (!e["shapes[0].x0"]) return;
                    props.setCurrentSelection(
                        utils.range(Math.floor(e["shapes[0].x0"]), Math.ceil(e["shapes[0].x1"]))
                    );
                }}
            />
        </GraphWrapper>
    );
}

export default TimeSeriesGraph;
