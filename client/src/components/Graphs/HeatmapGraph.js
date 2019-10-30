import "components/Graphs/ContourGraph.css";

import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";
import Plot from "react-plotly.js";
import * as utils from "utils/utils";
import GraphWrapper from "components/Graphs/GraphWrapper";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import {
    useCurrentSelection,
    useSavedSelections,
    usePinnedFeatures,
    useFileInfo
} from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UIHooks";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_BUCKET_COUNT = 50;

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
    const columnLength = data[0].length;
    const cols = utils.unzip(data);

    let ret = new Array(numBuckets).fill(0).map(() => new Array(numBuckets).fill(0));

    const [xMin, xMax] = dataRange(data[0]);
    const [yMin, yMax] = dataRange(data[1]);

    const xDivisor = (xMax - xMin) / numBuckets;
    const yDivisor = (yMax - yMin) / numBuckets;

    for (let i = 0; i < cols.length; i++) {
        let xValue = Math.floor((cols[i][0] - xMin) / xDivisor);
        xValue = xValue > 0 && xValue < numBuckets ? xValue : 0;
        let yValue = Math.floor((cols[i][1] - yMin) / yDivisor);
        yValue = yValue > 0 && yValue < numBuckets ? yValue : 0;

        ret[yValue][xValue]++;
    }
    return ret;
}

function generateRange(low, high, increment) {
    let range = [];
    for (let i = low; i < high; i += increment) {
        range.push(i);
    }

    return range;
}

function generateDataAxis(col) {
    const [min, max] = dataRange(col);
    return generateRange(min, max, (max - min) / DEFAULT_BUCKET_COUNT);
}

function HeatmapGraph(props) {
    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    //the number of interpolation steps that you can take caps at 5?
    const interpolatedColors = interpolateColors(
        "rgb(255, 255, 255)",
        "rgb(255, 0, 0)",
        5,
        "linear"
    );

    const data = utils.removeSentinelValues(
        props.win.data.features.map(colName =>
            props.data
                .find(col => col.get("feature") === colName)
                .get("data")
                .toJS()
        ),
        props.fileInfo
    );

    //calculate range of data for axis labels
    const xAxis = props.win.data.features[0];
    const yAxis = props.win.data.features[1];

    const cols = squashDataIntoBuckets(data, DEFAULT_BUCKET_COUNT);
    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: generateDataAxis(data[0]),
                y: generateDataAxis(data[1]),
                z: cols,
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

    // Effect to keep axes updated if they've been swapped
    useEffect(
        _ => {
            chartState.data[0].x = generateDataAxis(data[0]);
            chartState.data[0].y = generateDataAxis(data[1]);
            chartState.data[0].z = squashDataIntoBuckets(data, DEFAULT_BUCKET_COUNT);
            chartState.layout.xaxis.title = xAxis;
            chartState.layout.yaxis.title = yAxis;
            updateChartRevision();
        },
        [props.win.data.features]
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

export default props => {
    const win = useWindowManager(props, {
        width: 500,
        height: 500,
        resizeable: true,
        title: "Heat Map"
    });

    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    //const [savedSelections, saveCurrentSelection] = useSavedSelections();
    //const [globalChartState, setGlobalChartState] = useGlobalChartState();
    const fileInfo = useFileInfo();

    const features = usePinnedFeatures(win);

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    if (features.size === 2) {
        win.setTitle(win.data.features.join(" vs "));
        return (
            <HeatmapGraph
                currentSelection={currentSelection}
                setCurrentSelection={setCurrentSelection}
                data={features}
                fileInfo={fileInfo}
                win={win}
            />
        );
    } else {
        return (
            <WindowError>
                Please select exactly two features
                <br />
                in the features list to use this graph.
            </WindowError>
        );
    }
};
