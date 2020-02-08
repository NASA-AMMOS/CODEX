import "components/Graphs/SingleXMultipleYGraph.scss";

import Plot from "react-plotly.js";
import Plotly from "plotly.js";
import React, { useRef, useState, useEffect } from "react";
import mergeImg from "merge-img";

import GraphWrapper from "components/Graphs/GraphWrapper";
import * as uiTypes from "constants/uiTypes";
import * as utils from "utils/utils";

import { filterBounds } from "./graphFunctions";
import { useFeatureDisplayNames } from "../../hooks/DataHooks";

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
    return props.features
        .filter(feature => feature.name !== props.xAxis)
        .map(feature => (
            <div className="line-plot" key={feature.name}>
                <div className="color-swatch" style={{ background: feature.color }} />
                <span>{featureNameList.get(feature.name, feature.name)}</span>
            </div>
        ));
}

function SingleXMultipleYGraph(props) {
    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    function getProcessedData() {
        const sanitizedCols = utils.removeSentinelValues(
            props.data.map(col => col.get("data")).toJS(),
            props.fileInfo
        );
        return filterBounds(props.win.data.features, sanitizedCols, props.win.data.bounds);
    }

    const processedData = getProcessedData();
    const dataLength = processedData[0].length;

    // Generic index array
    const indexAry = [...Array(processedData[0].length)].map((_, idx) => idx);

    // Set initial x-axis as the index
    useEffect(_ => props.win.setData(data => ({ ...data.toJS(), xAxis: uiTypes.GRAPH_INDEX })), []);

    function getXAxis() {
        if (!props.win.data.xAxis || props.win.data.xAxis === uiTypes.GRAPH_INDEX) return indexAry;
        const colIndex = props.data.findIndex(col => col.get("feature") === props.win.data.xAxis);
        return Array.from(processedData[colIndex]).sort((a, b) => b - a);
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

    const featureDisplayNames = props.win.data.features.map(featureName =>
        props.data.find(feature => feature.get("feature") === featureName).get("displayName")
    );

    // Effect to assign the min and max bounds based on the data
    useEffect(_ => {
        if (!props.win.title) props.win.setTitle(featureDisplayNames.join(" vs "));
        props.win.setData(data => ({
            ...data.toJS(),
            bounds:
                props.win.data.bounds ||
                cols.reduce((acc, col) => {
                    acc[col.name] = { min: Math.min(...col.data), max: Math.max(...col.data) };
                    return acc;
                }, {})
        }));
    }, []);

    function getXAxisTitle() {
        return !props.win.data.xAxis || props.win.data.xAxis === uiTypes.GRAPH_INDEX
            ? "Row Index"
            : props.data
                  .find(feature => feature.get("feature") === props.win.data.xAxis)
                  .get("displayName");
    }

    function getYAxisTitle() {
        return props.data
            .filter(col => col.get("feature") !== props.win.data.xAxis)
            .map(col => col.get("displayName"))
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
                title: ""
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

            chartState.layout.yaxis.title = getYAxisTitle();
            updateChartRevision();
        },
        [props.win.data.features, props.win.data.xAxis]
    );

    const chartIds = [chartId, ...selectionChartStates.map(sel => sel.id)];
    return (
        <GraphWrapper
            chart={chart}
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
                        {selectionChartStates.map(selectionState => (
                            <Plot
                                key={selectionState.id}
                                data={selectionState.data}
                                layout={selectionState.layout}
                                config={selectionState.config}
                                style={{ width: "100%", height: "20px" }}
                                divId={selectionState.id}
                            />
                        ))}
                        <div className="x-axis-title">{getXAxisTitle()}</div>
                    </div>
                    <div className="singlex-multiy-legend">
                        <SingleXMultipleYGraphLegend
                            features={featureInfo}
                            xAxis={getXAxisTitle()}
                        />
                    </div>
                </div>
            </React.Fragment>
        </GraphWrapper>
    );
}

export default SingleXMultipleYGraph;
