import "./ContourGraph.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";

import { createNewId, removeSentinelValues, zip } from "../../utils/utils";
import { filterBounds } from "./graphFunctions";
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
    useWindowYAxis
} from "../../hooks/WindowHooks";
import GraphWrapper from "./GraphWrapper";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_BUCKET_COUNT = 50;
const DEFAULT_TITLE = "Heat Map Graph";

// Returns a single rgb color interpolation between given rgb color
// based on the factor given; via https://codepen.io/njmcode/pen/axoyD?editors=0010
function interpolateColor(color1, color2, factor) {
    if (arguments.length < 3) {
        factor = 0.5;
    }
    let result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
}

// My function to interpolate between two colors completely, returning an array
function interpolateColors(color1, color2, steps, scaling) {
    let stepFactor = 1 / steps,
        interpolatedColorArray = [];

    color1 = color1.match(/\d+/g).map(Number);
    color2 = color2.match(/\d+/g).map(Number);

    let percentage = 0.0;

    if (scaling === "log") {
        percentage = 1.0 / Math.pow(10, steps);
    } else {
        //assumed linear
        percentage = 0.0;
    }

    for (let i = 0; i <= steps; i++) {
        const interpolatedColor = interpolateColor(color1, color2, stepFactor * i);
        interpolatedColorArray.push([
            percentage,
            "rgb(" +
                interpolatedColor[0] +
                "," +
                interpolatedColor[1] +
                "," +
                interpolatedColor[2] +
                ")"
        ]);

        if (scaling === "log") {
            percentage *= 10;
        } else {
            //assumed linear
            percentage += 1.0 / steps;
        }
    }

    return interpolatedColorArray;
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

function squashDataIntoBuckets(data, numBuckets) {
    const maxes = data.map(col => Math.max(...col));
    const mins = data.map(col => Math.min(...col));

    const bucketSizes = data.map((_, idx) => (maxes[idx] - mins[idx]) / numBuckets[idx]);

    return zip(data).reduce(
        (acc, dataPoint) => {
            const [xIdx, yIdx] = dataPoint.map((val, idx) =>
                val === maxes[idx]
                    ? numBuckets[idx] - 1
                    : Math.floor((val - mins[idx]) / bucketSizes[idx])
            );
            acc[yIdx][xIdx] = acc[yIdx][xIdx] + 1;
            return acc;
        },
        Array(numBuckets[1])
            .fill(0)
            .map(_ => Array(numBuckets[0]).fill(0))
    );
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

function HeatmapGraph(props) {
    const chart = useRef(null);
    const [chartId] = useState(createNewId());

    const [featuresImmutable] = useWindowFeatureList(props.win.id);
    const featureList = featuresImmutable.toJS();
    const [bounds, setBounds] = useWindowGraphBounds(props.win.id);
    const [binSize, setBinSize] = useWindowGraphBinSize(props.win.id);
    const [axisLabels, setAxisLabels] = useWindowAxisLabels(props.win.id);
    const [needsResetToDefault, setNeedsResetToDefault] = useWindowNeedsResetToDefault(
        props.win.id
    );
    const [windowTitle, setWindowTitle] = useWindowTitle(props.win.id);
    const [needsAutoscale, setNeedsAutoscale] = useSetWindowNeedsAutoscale(props.win.id);
    const [xAxis, setXAxis] = useWindowXAxis(props.win.id);
    const [yAxis, setYAxis] = useWindowYAxis(props.win.id);

    //the number of interpolation steps that you can take caps at 5?
    const interpolatedColors = interpolateColors(
        "rgb(255, 255, 255)",
        "rgb(255, 0, 0)",
        5,
        "linear"
    );

    const sanitizedCols = removeSentinelValues(
        featureList.map(colName =>
            props.data
                .find(col => col.get("feature") === colName)
                .get("data")
                .toJS()
        ),
        props.fileInfo
    );

    const filteredCols = filterBounds(featureList, sanitizedCols, bounds && bounds.toJS());

    const baseX = xAxis
        ? filteredCols[featureList.findIndex(feature => feature === xAxis)]
        : filteredCols[0];
    const baseY = yAxis
        ? filteredCols[featureList.findIndex(feature => feature === yAxis)]
        : filteredCols[1];

    const x = generateDataAxis(baseX, (binSize && binSize.get("x")) || DEFAULT_BUCKET_COUNT);
    const y = generateDataAxis(baseY, (binSize && binSize.get("y")) || DEFAULT_BUCKET_COUNT);
    const z = squashDataIntoBuckets(
        filteredCols,
        binSize
            ? Object.values(binSize.toJS()).map(val => val || 1)
            : [DEFAULT_BUCKET_COUNT, DEFAULT_BUCKET_COUNT]
    );

    const xAxisTitle =
        (axisLabels && axisLabels.get(xAxis)) ||
        props.data.find(feature => feature.get("feature") === featureList[0]).get("displayName");

    const yAxisTitle =
        (axisLabels && axisLabels.get(yAxis)) ||
        props.data.find(feature => feature.get("feature") === featureList[1]).get("displayName");

    const featureDisplayNames = featureList.map(featureName =>
        props.data.find(feature => feature.get("feature") === featureName).get("displayName")
    );

    // // The plotly react element only changes when the revision is incremented.
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
                colorscale: interpolatedColors
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
            margin: { l: 0, r: 0, t: 0, b: 0 },
            hovermode: "closest",
            titlefont: { size: 5 },
            annotations: []
        },
        config: {
            responsive: true,
            displaylogo: false,
            modeBarButtons: [["zoomIn2d", "zoomOut2d", "autoScale2d"], ["toggleHover"]]
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

    function setDefaults(init) {
        if (!init || !bounds)
            setBounds(
                featureList.reduce((acc, colName, idx) => {
                    acc[colName] = {
                        min: Math.min(...sanitizedCols[idx]),
                        max: Math.max(...sanitizedCols[idx])
                    };
                    return acc;
                }, {})
            );
        setBinSize({
            x: DEFAULT_BUCKET_COUNT,
            y: DEFAULT_BUCKET_COUNT
        });
        if (!init || !axisLabels)
            setAxisLabels(
                featureList.reduce((acc, featureName) => {
                    acc[featureName] = featureName;
                    return acc;
                }, {})
            );
        if (!init || !windowTitle) setWindowTitle(featureDisplayNames.join(" vs "));
        if (!init || !xAxis) setXAxis(featureList[0]);
        if (!init || !yAxis) setYAxis(featureList[1]);
    }

    useEffect(_ => {
        setDefaults(true);
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
            updateChartRevision();
        },
        [featuresImmutable, axisLabels, binSize, bounds]
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

export default HeatmapGraph;
