import "./BoxPlotGraph.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";

import GraphWrapper from "./GraphWrapper";

import { filterSingleCol } from "./graphFunctions";
import { setWindowNeedsAutoscale } from "../../actions/windowDataActions";
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
import * as utils from "../../utils/utils";

const DEFAULT_POINT_COLOR = "#3386E6";
const COLOR_CURRENT_SELECTION = "#FF0000";
const DEFAULT_TITLE = "Box Plot Graph";

function handleGlobalChartState(state) {
    return state === "lasso" ? "select" : state;
}

function makeSelectionShapes(selection, data) {
    return data
        .map((col, dataIdx) =>
            !selection.rowIndices.length
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
                          const xSize = 1 / data.length;
                          return {
                              type: "rect",
                              xref: "paper",
                              yref: `y`,
                              x0: dataIdx * xSize,
                              y0: section[0],
                              x1: dataIdx * xSize + xSize,
                              y1: section[section.length - 1],
                              fillcolor: selection.color,
                              opacity: 0.2,
                              line: {
                                  // Draw a line when the selection is only a single point
                                  width: section.length === 1 ? 1 : 0,
                                  color: selection.color
                              }
                          };
                      })
        )
        .flat();
}

function BoxPlotGraph(props) {
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
        const xAxisName = `xaxis${idx === 0 ? "" : idx + 1}`;
        const yAxisName = `yaxis`;
        acc[xAxisName] = {
            title: axisLabels ? axisLabels.get(feature.feature, feature.feature) : feature.feature,
            automargin: true,
            showline: false,
            fixedrange: true
        };
        acc[yAxisName] = {
            automargin: true
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
            y: filteredCols[idx],
            type: "box",
            hoverinfo: "x+y",
            marker: { color: DEFAULT_POINT_COLOR },
            name: ""
        };
        if (idx > 0) {
            trace.xaxis = `x${idx + 1}`;
            trace.yaxis = `y`;
        }
        return trace;
    });

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);

    const [chartState, setChartState] = useState({
        data: traces,
        layout: {
            grid: {
                rows: 1,
                columns: traces.length,
                subplots: utils.range(traces.length).map(idx => `x${idx ? idx + 1 : ""}y`)
            },
            showlegend: false,
            margin: { l: 40, r: 5, t: 5, b: 20 }, // Axis tick labels are drawn in the margin space
            dragmode: handleGlobalChartState(props.globalChartState) || "select",
            selectdirection: "v",
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
            chartState.layout.shapes = props.savedSelections
                .concat(
                    props.currentSelection.length && {
                        color: COLOR_CURRENT_SELECTION,
                        rowIndices: props.currentSelection
                    }
                )
                .filter(x => x)
                .map(sel => makeSelectionShapes(sel, traces))
                .flat();
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
                .map(sel => makeSelectionShapes(sel, traces))
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

    useEffect(
        _ => {
            if (needsAutoscale) {
                Object.keys(chartState.layout).map(key => {
                    if (key.includes("axis")) chartState.layout[key].autorange = true;
                });
                updateChartRevision();
                setWindowNeedsAutoscale(false);
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
                    const selKey = Object.keys(e.range).find(key => key.startsWith("y"));
                    props.setCurrentSelection(
                        utils.range(Math.floor(e.range[selKey][0]), Math.ceil(e.range[selKey][1]))
                    );
                }}
            />
        </GraphWrapper>
    );
}

export default BoxPlotGraph;
