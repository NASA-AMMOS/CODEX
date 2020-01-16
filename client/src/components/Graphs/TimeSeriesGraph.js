import "components/Graphs/TimeSeriesGraph.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";

import GraphWrapper, { useBoxSelection } from "components/Graphs/GraphWrapper";
import * as utils from "utils/utils";

import { filterSingleCol } from "./graphFunctions";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_TITLE = "Time Series Graph";

function handleGlobalChartState(state) {
    return state === "lasso" ? "select" : state;
}

function generateLayouts(features) {
    return features.reduce((acc, feature, idx) => {
        const axisName = `yaxis${idx === 0 ? "" : idx + 1}`;
        acc[axisName] = {
            title: feature.feature
        };
        return acc;
    }, {});
}

function TimeSeriesGraph(props) {
    const features = props.data.toJS();
    const featureNames = features.map(feature => {
        return feature.feature;
    });

    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    function generatePlotData() {
        const cols = props.win.data.features
            .map(colName => [
                props.data
                    .find(col => col.get("feature") === colName)
                    .get("data")
                    .toJS(),
                props.win.data.bounds && props.win.data.bounds[colName]
            ])
            .map(([col, bounds]) => [utils.removeSentinelValues([col], props.fileInfo)[0], bounds])
            .map(([col, bounds]) => filterSingleCol(col, bounds));

        //generate time axis list
        const timeAxis = [...Array(cols[0].length).keys()];

        return [
            features.map((feature, idx) => {
                const trace = {
                    x: timeAxis,
                    y: cols[idx],
                    mode: "lines",
                    type: "scatter",
                    hoverinfo: "x+y"
                };
                if (idx > 0) {
                    trace.xaxis = `x`;
                    trace.yaxis = `y${idx + 1}`;
                }
                return trace;
            }),
            cols
        ];
    }

    const [processedData, setProcessedData] = useState(_ => generatePlotData());
    const [data, cols] = processedData;

    const layouts = generateLayouts(features);

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);

    const [chartState, setChartState] = useState({
        data: data,
        layout: {
            grid: {
                rows: data.length,
                columns: 1,
                subplots: utils.range(data.length).map(idx => [`xy${idx ? idx + 1 : ""}`])
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
            displaylogo: false
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

    // Update bound state with the calculated bounds of the data
    useEffect(_ => {
        if (!props.win.title) props.win.setTitle(featureDisplayNames.join(" , "));
        props.win.setData(data => ({
            ...data.toJS(),
            bounds:
                props.win.data.bounds ||
                props.win.data.features.reduce((acc, colName, idx) => {
                    acc[colName] = { min: Math.min(...cols[idx]), max: Math.max(...cols[idx]) };
                    return acc;
                }, {})
        }));
    }, []);

    // Update data state when the bounds change
    useEffect(
        _ => {
            setProcessedData(generatePlotData());
        },
        [props.win.data.bounds]
    );

    // Effect to update graph when data changes
    useEffect(
        _ => {
            chartState.data = data;
            updateChartRevision();
        },
        [data]
    );

    // Handle selections
    const [selectionShapes] = useBoxSelection(
        "horizontal",
        props.currentSelection,
        props.savedSelections,
        chartState.data[0].x
    );
    useEffect(
        _ => {
            chartState.layout.shapes = selectionShapes;

            updateChartRevision();
        },
        [selectionShapes]
    );

    // Update the chart state when the global chart state changes
    useEffect(
        _ => {
            chartState.layout.dragmode = handleGlobalChartState(props.globalChartState);
            updateChartRevision();
        },
        [props.globalChartState]
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
                    const xKey = Object.keys(e.range)[0];
                    let points = utils.indicesInRange(
                        chartState.data[0].x,
                        e.range[xKey][0],
                        e.range[xKey][1]
                    );
                    props.setCurrentSelection(points);
                }}
            />
        </GraphWrapper>
    );
}

export default TimeSeriesGraph;
