import "./HeatmapGraph3d.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect, useMemo } from "react";

import { setWindowNeedsAutoscale } from "../../actions/windowDataActions";
import {
    useSetWindowNeedsAutoscale,
    useWindowAxisLabels,
    useWindowFeatureList,
    useWindowGraphBinSize,
    useWindowGraphBounds,
    useWindowNeedsResetToDefault,
    useWindowTitle,
    useWindowXAxis,
    useWindowYAxis,
    useWindowZAxis
} from "../../hooks/WindowHooks";
import GraphWrapper from "./GraphWrapper";
import * as graphFunctions from "./graphFunctions";
import * as utils from "../../utils/utils";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_BUCKET_COUNT = 50;
const DEFAULT_TITLE = "Heat Map 3d Graph";

function squashDataIntoBuckets(numBuckets, xData, yData, zData) {
    const cols = [xData, yData];
    const [mins, maxes] = cols.reduce(
        (acc, col) => {
            const [min, max] = utils.getMinMax(col);
            acc[0].push(min);
            acc[1].push(max);
            return acc;
        },
        [[], []]
    );
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
                acc[yIdx][xIdx].push(zData[idx]);
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

//the number of interpolation steps that you can take caps at 5?
const interpolatedColors = graphFunctions.interpolateColors(
    "rgb(255, 255, 255)",
    "rgb(255, 0, 0)",
    5,
    "linear"
);

function HeatmapGraph3d(props) {
    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    const [featuresImmutable] = useWindowFeatureList(props.win.id);
    const featureList = featuresImmutable.toJS();
    const [bounds, setBounds] = useWindowGraphBounds(props.win.id);
    const [binSize, setBinSize] = useWindowGraphBinSize(props.win.id);
    const [axisLabels, setAxisLabels] = useWindowAxisLabels(props.win.id);
    const [needsResetToDefault, setNeedsResetToDefault] = useWindowNeedsResetToDefault(
        props.win.id
    );
    const [windowTitle, setWindowTitle] = useWindowTitle(props.win.id);
    const [xAxis, setXAxis] = useWindowXAxis(props.win.id);
    const [yAxis, setYAxis] = useWindowYAxis(props.win.id);
    const [zAxis, setZAxis] = useWindowZAxis(props.win.id);
    const [needsAutoscale, setNeedsAutoscale] = useSetWindowNeedsAutoscale(props.win.id);

    const [sanitizedCols] = useState(_ =>
        utils.removeSentinelValues(
            featureList.map(colName =>
                props.data
                    .find(col => col.get("feature") === colName)
                    .get("data")
                    .toJS()
            ),
            props.fileInfo
        )
    );

    const filteredCols = useMemo(
        _ => graphFunctions.filterBounds(featureList, sanitizedCols, bounds && bounds.toJS()),
        [bounds]
    );

    const xData = xAxis
        ? filteredCols[featureList.findIndex(feature => feature === xAxis)]
        : filteredCols[0];
    const yData = yAxis
        ? filteredCols[featureList.findIndex(feature => feature === yAxis)]
        : filteredCols[1];
    const zData = zAxis
        ? filteredCols[featureList.findIndex(feature => feature === zAxis)]
        : filteredCols[2];

    const x = useMemo(
        _ => generateDataAxis(xData, (binSize && binSize.get("x")) || DEFAULT_BUCKET_COUNT),
        [xData, binSize]
    );
    const y = useMemo(
        _ => generateDataAxis(yData, (binSize && binSize.get("y")) || DEFAULT_BUCKET_COUNT),
        [yData, binSize]
    );
    const z = useMemo(
        _ =>
            squashDataIntoBuckets(
                binSize
                    ? Object.values(binSize.toJS()).map(val => val || 1)
                    : [DEFAULT_BUCKET_COUNT, DEFAULT_BUCKET_COUNT],
                xData,
                yData,
                zData
            ),
        [xData, yData, zData, binSize]
    );

    const xAxisTitle =
        (axisLabels && axisLabels.get(xAxis)) ||
        props.data.find(feature => feature.get("feature") === featureList[0]).get("displayName");

    const yAxisTitle =
        (axisLabels && axisLabels.get(yAxis)) ||
        props.data.find(feature => feature.get("feature") === featureList[1]).get("displayName");

    const zAxisTitle =
        (axisLabels && axisLabels.get(zAxis)) ||
        props.data.find(feature => feature.get("feature") === featureList[2]).get("displayName");

    const featureDisplayNames = featureList.map(featureName =>
        props.data.find(feature => feature.get("feature") === featureName).get("displayName")
    );

    function setDefaults() {
        setBounds(
            featureList.reduce((acc, colName, idx) => {
                const [min, max] = utils.getMinMax(sanitizedCols[idx]);
                acc[colName] = {
                    min,
                    max
                };
                return acc;
            }, {})
        );
        setBinSize({
            x: DEFAULT_BUCKET_COUNT,
            y: DEFAULT_BUCKET_COUNT
        });
        setAxisLabels(
            featureList.reduce((acc, featureName) => {
                acc[featureName] = featureName;
                return acc;
            }, {})
        );
        setWindowTitle(featureDisplayNames.join(" vs "));
        setXAxis(featureList[0]);
        setYAxis(featureList[1]);
        setZAxis(featureList[2]);
    }

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x,
                y,
                z,
                type: "heatmap",
                showscale: true,
                colorscale: interpolatedColors,
                colorbar: { title: zAxisTitle }
            }
        ],
        layout: {
            dragmode: props.globalChartState !== "lasso" && props.globalChartState,
            xaxis: {
                title: xAxisTitle,
                automargin: true,
                ticklen: 0,
                scaleratio: 1.0
            },
            yaxis: {
                title: yAxisTitle,
                automargin: true,
                ticklen: 0,
                anchor: "x"
            },
            autosize: true,
            margin: { l: 0, r: 30, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
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

    useEffect(_ => {
        if (windowTitle) return; // Don't set defaults if we're keeping numbers from a previous chart in this window.
        setDefaults();
        updateChartRevision();
    }, []);

    useEffect(
        _ => {
            chartState.layout.dragmode =
                props.globalChartState !== "lasso" && props.globalChartState;
            updateChartRevision();
        },
        [props.globalChartState]
    );

    function updateAxes() {
        chartState.data[0].x = x;
        chartState.data[0].y = y;
        chartState.data[0].z = z;
    }

    // Handles axis swap and label changes
    useEffect(
        _ => {
            updateAxes();
            chartState.layout.xaxis.title = xAxisTitle;
            chartState.layout.yaxis.title = yAxisTitle;
            chartState.data[0].colorbar.title = zAxisTitle;
            updateChartRevision();
        },
        [featuresImmutable, axisLabels, binSize, bounds, xAxis, yAxis, zAxis]
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
                setWindowNeedsAutoscale(false);
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
