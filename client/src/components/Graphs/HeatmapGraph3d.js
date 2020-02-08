import "components/Graphs/HeatmapGraph3d.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useCurrentSelection, usePinnedFeatures, useFileInfo } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import GraphWrapper from "components/Graphs/GraphWrapper";
import * as graphFunctions from "components/Graphs/graphFunctions";
import * as utils from "utils/utils";

import { filterBounds } from "./graphFunctions";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_BUCKET_COUNT = 50;
const DEFAULT_TITLE = "Heat Map 3d Graph";

function squashDataIntoBuckets(data, numBuckets, features, xAxis, yAxis, zAxis) {
    const xAxisIndex = features.findIndex(colName => colName === xAxis);
    const yAxisIndex = features.findIndex(colName => colName === yAxis);
    const zAxisIndex = features.findIndex(colName => colName === zAxis);

    const cols = [data[xAxisIndex], data[yAxisIndex]];
    const zCol = data[zAxisIndex];

    const maxes = cols.map(col => Math.max(...col));
    const mins = cols.map(col => Math.min(...col));
    const bucketSizes = cols.map((_, idx) => (maxes[idx] - mins[idx]) / numBuckets[idx]);

    return utils
        .unzip(cols)
        .reduce(
            (acc, dataPoint, idx) => {
                const [xIdx, yIdx] = dataPoint.map((val, idx) =>
                    val === maxes[idx]
                        ? numBuckets[idx] - 1
                        : Math.floor((val - mins[idx]) / bucketSizes[idx])
                );
                acc[yIdx][xIdx].push(zCol[idx]);
                return acc;
            },
            Array(numBuckets[1])
                .fill(0)
                .map(_ =>
                    Array(numBuckets[0])
                        .fill(0)
                        .map(_ => [0])
                )
        )
        .map(row => row.map(values => values.reduce((acc, val) => val + acc, 0) / values.length));
}

function dataRange(data) {
    let min = data[0];
    let max = data[0];
    data.forEach(row => {
        min = row < min ? row : min;
        max = row > max ? row : max;
    });

    return [min, max];
}

function generateRange(low, high, increment) {
    let range = [];
    for (let i = low; i < high; i += increment) {
        range.push(i);
    }

    return range;
}

function generateDataAxis(col, bucketCount) {
    const [min, max] = dataRange(col);
    return generateRange(min, max, (max - min) / bucketCount);
}

function HeatmapGraph3d(props) {
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

    const xAxis = props.data
        .find(feature => feature.get("feature") === props.win.data.features[0])
        .get("displayName");

    const yAxis = props.data
        .find(feature => feature.get("feature") === props.win.data.features[1])
        .get("displayName");

    // Set x-axis averages as the z-axis
    useEffect(_ => {
        if (!props.win.title) props.win.setTitle(props.win.data.features.join(" vs "));
        props.win.setData(data => ({
            ...data.toJS(),
            xAxis: props.win.data.features[0],
            yAxis: props.win.data.features[1],
            zAxis: props.win.data.features[2],
            binSize: props.win.data.binSize || { x: DEFAULT_BUCKET_COUNT, y: DEFAULT_BUCKET_COUNT },
            bounds:
                props.win.data.bounds ||
                props.win.data.features.reduce((acc, colName, idx) => {
                    acc[colName] = { min: Math.min(...cols[idx]), max: Math.max(...cols[idx]) };
                    return acc;
                }, {})
        }));
    }, []);

    //the number of interpolation steps that you can take caps at 5?
    const interpolatedColors = graphFunctions.interpolateColors(
        "rgb(255, 255, 255)",
        "rgb(255, 0, 0)",
        5,
        "linear"
    );

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: generateDataAxis(cols[0], DEFAULT_BUCKET_COUNT),
                y: generateDataAxis(cols[1], DEFAULT_BUCKET_COUNT),
                z: squashDataIntoBuckets(
                    cols,
                    [DEFAULT_BUCKET_COUNT, DEFAULT_BUCKET_COUNT],
                    props.win.data.features,
                    props.win.data.features[0],
                    props.win.data.features[1],
                    props.win.data.features[2]
                ),
                type: "heatmap",
                showscale: true,
                colorscale: interpolatedColors
            }
        ],
        layout: {
            dragmode: "lasso",
            xaxis: {
                title: xAxis,
                automargin: true,
                ticklen: 0,
                scaleratio: 1.0
            },
            yaxis: {
                title: yAxis,
                automargin: true,
                ticklen: 0,
                anchor: "x"
            },
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: false, // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            annotations: []
        },
        config: {
            displaylogo: false,
            displayModeBar: false
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

    function getZAxis() {
        const binSize = props.win.data.binSize
            ? Object.values(props.win.data.binSize)
            : [DEFAULT_BUCKET_COUNT, DEFAULT_BUCKET_COUNT];

        return squashDataIntoBuckets(
            cols,
            binSize,
            props.win.data.features,
            props.win.data.xAxis || props.win.data.features[0],
            props.win.data.yAxis || props.win.data.features[1],
            props.win.data.zAxis || props.win.data.features[2]
        );
    }

    // Effect to keep axes updated if they've been swapped
    useEffect(
        _ => {
            const xAxisIndex = props.win.data.features.findIndex(
                colName => colName === props.win.data.xAxis
            );
            const yAxisIndex = props.win.data.features.findIndex(
                colName => colName === props.win.data.yAxis
            );
            chartState.data[0].x = generateDataAxis(
                cols[xAxisIndex === -1 ? 0 : xAxisIndex],
                props.win.data.binSize ? props.win.data.binSize.x : DEFAULT_BUCKET_COUNT
            );
            chartState.data[0].y = generateDataAxis(
                cols[yAxisIndex === -1 ? 0 : yAxisIndex],
                props.win.data.binSize ? props.win.data.binSize.y : DEFAULT_BUCKET_COUNT
            );
            chartState.data[0].z = getZAxis();

            if (props.win.data.xAxis)
                chartState.layout.xaxis.title = props.data
                    .find(feature => feature.get("feature") === props.win.data.xAxis)
                    .get("displayName");

            if (props.win.data.yAxis)
                chartState.layout.yaxis.title = props.data
                    .find(feature => feature.get("feature") === props.win.data.yAxis)
                    .get("displayName");

            updateChartRevision();
        },
        [props.win.data.features]
    );

    // Effect to keep z-axis updated if it's changed
    useEffect(
        _ => {
            chartState.data[0].z = getZAxis();
        },
        [props.win.data.zAxis]
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
                    if (e.event.button === 2) return;
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

export default HeatmapGraph3d;
