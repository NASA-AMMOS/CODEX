import "./SingleXMultipleYGraph.scss";

import Plot from "react-plotly.js";
import Plotly from "plotly.js";
import React, { useRef, useState, useEffect, useMemo } from "react";
import mergeImg from "merge-img";

import { filterBounds } from "./graphFunctions";
import { useFeatureDisplayNames } from "../../hooks/DataHooks";
import {
    useSetWindowNeedsAutoscale,
    useWindowAxisLabels,
    useWindowAxisScale,
    useWindowFeatureInfoList,
    useWindowFeatureList,
    useWindowGraphBounds,
    useWindowNeedsResetToDefault,
    useWindowShowGridLines,
    useWindowTitle,
    useWindowXAxis
} from "../../hooks/WindowHooks";
import GraphWrapper from "./GraphWrapper";
import * as uiTypes from "../../constants/uiTypes";
import * as utils from "../../utils/utils";

const Jimp = require("jimp");

const DEFAULT_POINT_COLOR = "rgba(0, 0, 0 ,0.5)";
const ANIMATION_RANGE = 15;
const ANIMATION_SPEED = 0.75;
const COLOR_CURRENT_SELECTION = "#FF0000";
const DEFAULT_TITLE = "Single X Multiple Y Graph";

// Custom image save function to handle tick plots
function saveImageFunction(chartIds, title) {
    Promise.all([
        Plotly.toImage(chartIds[0], { format: "png", width: 800, height: 800 }),
        ...chartIds
            .slice(1)
            .map(id => Plotly.toImage(id, { format: "png", width: 800, height: 30 }))
    ])
        .then(urls => Promise.all(urls.map(url => Jimp.read(url))))
        .then(images => mergeImg(images, { direction: true }))
        .then(img => img.getBase64Async("image/png"))
        .then(url => {
            const a = document.createElement("a");
            a.href = url;
            a.download = title;
            a.click();
            a.remove();
        });
}

export function SingleXMultipleYGraphLegend(props) {
    const [featureNameList] = useFeatureDisplayNames();
    if (!props.features) return null;
    return props.features
        .filter(feature => feature.get("name") !== props.xAxis)
        .map(feature => (
            <div className="line-plot" key={feature.get("name")}>
                <div className="color-swatch" style={{ background: feature.get("color") }} />
                <span>{props.axisLabels.get(feature.get("name"), feature.get("name"))}</span>
            </div>
        ));
}

function SingleXMultipleYGraph(props) {
    const [defaultsInitialized, setDefaultsInitialized] = useState(false);
    const chart = useRef(null);
    const selectionCharts = useRef([]);
    const [chartId] = useState(utils.createNewId());
    const [showGridLines, setShowGridLines] = useWindowShowGridLines(props.win.id);
    const [needsResetToDefault, setNeedsResetToDefault] = useWindowNeedsResetToDefault(
        props.win.id
    );
    const [xAxis, setXAxis] = useWindowXAxis(props.win.id);
    const [featuresImmutable] = useWindowFeatureList(props.win.id);
    const featureList = featuresImmutable.toJS();
    const [bounds, setBounds] = useWindowGraphBounds(props.win.id);
    const [featureInfo, setFeatureInfo] = useWindowFeatureInfoList(props.win.id);
    const [windowTitle, setWindowTitle] = useWindowTitle(props.win.id);
    const [axisLabels, setAxisLabels] = useWindowAxisLabels(props.win.id);
    const [featureNameList] = useFeatureDisplayNames();
    const [axisScales, setAxisScales] = useWindowAxisScale(props.win.id);
    const [needsAutoscale, setNeedsAutoscale] = useSetWindowNeedsAutoscale(props.win.id);

    const [sanitizedCols] = useState(_ =>
        utils.removeSentinelValues(props.data.map(col => col.get("data")).toJS(), props.fileInfo)
    );

    const processedData = useMemo(
        _ => filterBounds(featureList, sanitizedCols, bounds && bounds.toJS()),
        [bounds]
    );

    const dataLength = processedData[0].length;

    // Generic index array
    const [indexAry] = useState(_ => [...Array(processedData[0].length)].map((_, idx) => idx));

    const x = useMemo(
        _ =>
            !xAxis || xAxis === uiTypes.GRAPH_INDEX
                ? indexAry
                : Array.from(
                      processedData[
                          props.data.findIndex(col => col.get("feature") === props.win.data.xAxis)
                      ]
                  ).sort((a, b) => b - a),
        [xAxis]
    );

    const cols = props.data
        .filter(col => col.get("feature") !== xAxis)
        .map((col, idx) => ({ name: col.get("feature"), data: processedData[idx] }))
        .toJS();

    const featureDisplayNames = featureList.map(featureName =>
        props.data.find(feature => feature.get("feature") === featureName).get("displayName")
    );

    const xAxisTitle =
        !xAxis || xAxis === uiTypes.GRAPH_INDEX
            ? "Row Index"
            : props.data.find(feature => feature.get("feature") === xAxis).get("displayName");

    const yAxisTitle = props.data
        .filter(col => col.get("feature") !== xAxis)
        .map(col => (axisLabels ? axisLabels.get(col.get("feature")) : col.get("feature")))
        .join(", ");

    const palette = utils.getSelectionPalette();
    const baseFeatureInfo = featureList.map((feature, idx) => ({
        name: feature,
        color: palette[idx]
    }));

    function makeSelectionTrace(selection) {
        return cols.map(col => {
            return {
                x,
                y: selection.rowIndices.reduce((acc, idx) => {
                    acc[idx] = col.data[idx];
                    return acc;
                }, Array(col.data.length).fill(null)),
                type: "scattergl",
                mode: "lines",
                marker: { color: selection.color },
                visible: true,
                title: "selection",
                connectgaps: false,
                hoverinfo: "x+y"
            };
        });
    }

    const traces = useMemo(
        _ =>
            cols.map((col, idx) =>
                !defaultsInitialized
                    ? {}
                    : {
                          x,
                          y: col.data,
                          type: "scattergl",
                          mode: "lines",
                          marker: {
                              color: ((featureInfo && featureInfo.toJS()) || baseFeatureInfo).find(
                                  f => f.name === col.name
                              ).color
                          },
                          visible: true,
                          hoverinfo: "x+y"
                      }
            ),
        [defaultsInitialized]
    );

    // The plotly react element only changes when the revision is incremented.
    const chartRevision = useRef(0);

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
                title: ""
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

    /* SELECTION HANDLERS
    Selections are handled as a bunch of tick plots that are generated below the main plot.
    The selection graph objects are stored in state and then rendered. We don't modify these charts
    after they are created.
    */
    const [selectionChartStates, setSelectionChartStates] = useState([]);
    function makeTickPlotForSelection(selection) {
        const z = [
            selection.rowIndices.reduce((acc, sel) => {
                acc[sel] = 1;
                return acc;
            }, Array(dataLength).fill(0))
        ];
        return {
            id: utils.createNewId(),
            data: [
                {
                    z,
                    type: "heatmap",
                    showscale: false,
                    colorscale: [["0.0", "rgba(0,0,0,0)"], ["1.0", selection.color]]
                }
            ],
            layout: {
                autosize: true,
                margin: { l: 40, r: 0, t: 0, b: 10, pad: 10 },
                xaxis: {
                    showline: false,
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false,
                    ticks: ""
                },
                yaxis: {
                    showline: false,
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false,
                    ticks: ""
                }
            },
            config: {
                responsive: true,
                displaylogo: false,
                displayModeBar: false
            }
        };
    }

    // Effect to handle changed global selections
    const [previousSelectionCount, setPreviousSelectionCount] = useState(0);
    useEffect(
        _ => {
            let selections = [];

            // Add currrent selection (if there is one)
            if (props.currentSelection && props.currentSelection.length) {
                selections = selections.concat(
                    makeTickPlotForSelection({
                        rowIndices: props.currentSelection,
                        color: "red"
                    })
                );
            }

            // Add saved selections
            selections = selections.concat(
                ...props.savedSelections.map(selection => makeTickPlotForSelection(selection, cols))
            );

            setSelectionChartStates(selections);

            // Increase or decrease the window height to accomodate the selections.
            props.win.resizeY(props.win.height + (selections.length - previousSelectionCount) * 30);
            setPreviousSelectionCount(selections.length);
        },
        [props.currentSelection, props.savedSelections]
    );

    // TODO: How do selections work in this chart?
    useEffect(
        _ => {
            chartState.layout.dragmode = props.globalChartState; // Weirdly this works, can't do it with setChartState
            updateChartRevision();
        },
        [props.globalChartState]
    );

    useEffect(
        _ => {
            chartState.data = traces;
            chartState.layout.yaxis.title = yAxisTitle;
            if (axisScales) {
                setAxisScales(
                    axisScales.map((scale, idx) =>
                        scale.set("name", idx === 0 ? `X (${xAxisTitle})` : `Y (${yAxisTitle})`)
                    )
                );
            }
            updateChartRevision();
        },
        [xAxis, featureInfo, bounds]
    );

    useEffect(
        _ => {
            chartState.layout.xaxis.showgrid = showGridLines;
            chartState.layout.yaxis.showgrid = showGridLines;
            updateChartRevision();
        },
        [showGridLines]
    );

    useEffect(
        _ => {
            chartState.layout.yaxis.title = yAxisTitle;
            updateChartRevision();
        },
        [axisLabels]
    );

    function setDefaults(init) {
        if (!featureInfo) setFeatureInfo(baseFeatureInfo);
        if (!init || !bounds)
            setBounds(
                cols.reduce((acc, col) => {
                    const [min, max] = utils.getMinMax(col.data);
                    acc[col.name] = { min, max };
                    return acc;
                }, {})
            );

        if (!init || !axisLabels)
            setAxisLabels(
                featureList.reduce((acc, featureName) => {
                    acc[featureName] = featureNameList.get(featureName, featureName);
                    return acc;
                }, {})
            );
        if (!init || showGridLines === undefined) setShowGridLines(true);
        if (!init || !xAxis) setXAxis(uiTypes.GRAPH_INDEX);
        if (!init || !windowTitle) setWindowTitle(featureDisplayNames.join(" vs "));
        if (!init || !axisScales)
            setAxisScales([
                { name: `X (${xAxisTitle})`, scale: "linear" },
                { name: `Y (${yAxisTitle})`, scale: "linear" }
            ]);
        setDefaultsInitialized(true);
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

    useEffect(
        _ => {
            if (!axisScales) return;
            chartState.layout.xaxis.type = axisScales.get(0).get("scale");
            chartState.layout.yaxis.type = axisScales.get(1).get("scale");
            updateChartRevision();
        },
        [axisScales]
    );

    const chartIds = [chartId, ...selectionChartStates.map(sel => sel.id)];

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

    selectionCharts.current = selectionCharts.current.filter(sel => sel);
    return (
        <GraphWrapper
            chart={[chart.current, ...selectionCharts.current]}
            chartIds={chartIds}
            win={props.win}
            saveOptions={{ type: "singleXMultipleY" }}
            saveImageFunction={_ => saveImageFunction(chartIds, props.win.title)}
        >
            <React.Fragment>
                <div className="singlex-multiy-container">
                    <div className="singlex-multiy-plot">
                        <Plot
                            ref={chart}
                            data={chartState.data}
                            layout={chartState.layout}
                            config={chartState.config}
                            style={{
                                height: `calc(100% - ${previousSelectionCount * 30}px)`
                            }}
                            onInitialized={figure => setChartState(figure)}
                            onUpdate={figure => setChartState(figure)}
                            onClick={e => {
                                if (e.event.button === 2 || e.event.ctrlKey) return;
                                props.setCurrentSelection([]);
                            }}
                            onSelected={e => {
                                if (e)
                                    props.setCurrentSelection(
                                        e.points.map(point => point.pointIndex)
                                    );
                            }}
                            divId={chartId}
                            useResizeHandler
                        />
                        {selectionChartStates.map((selectionState, idx) => (
                            <Plot
                                ref={ref => (selectionCharts.current[idx] = ref)}
                                key={selectionState.id}
                                data={selectionState.data}
                                layout={selectionState.layout}
                                config={selectionState.config}
                                style={{ width: "100%", height: "20px" }}
                                divId={selectionState.id}
                                useResizeHandler
                            />
                        ))}
                        <div className="x-axis-title">{xAxisTitle}</div>
                    </div>
                    <div className="singlex-multiy-legend">
                        <SingleXMultipleYGraphLegend
                            features={featureInfo}
                            xAxis={xAxisTitle}
                            axisLabels={axisLabels}
                        />
                    </div>
                </div>
            </React.Fragment>
        </GraphWrapper>
    );
}

export default SingleXMultipleYGraph;
