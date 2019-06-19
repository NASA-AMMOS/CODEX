import "components/Graphs/ContourGraph.css";

import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";
import Plot from "react-plotly.js";
import * as utils from "utils/utils";
import GraphWrapper from "components/Graphs/GraphWrapper";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useCurrentSelection, useSavedSelections, usePinnedFeatures } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UiHooks";

const DEFAULT_POINT_COLOR = "#3386E6";

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

    for (let i = 0; i < data.length; i++) {
        min = data[i] < min ? data[i] : min;
        max = data[i] > max ? data[i] : max;
    }

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

function HeatmapGraph(props) {
    const chart = useRef(null);

    let defaultBucketCount = 50;

    //the number of interpolation steps that you can take caps at 5?
    const interpolatedColors = interpolateColors(
        "rgb(255, 255, 255)",
        "rgb(255, 0, 0)",
        5,
        "linear"
    );

    //const data = props.data.get("data");
    const data = props.data.map(f => f.get("data")).toJS();

    //calculate range of data for axis labels
    const xAxis = props.data.getIn([0, "feature"]);
    const yAxis = props.data.getIn([1, "feature"]);

    const [xMin, xMax] = dataRange(data[0]);
    const [yMin, yMax] = dataRange(data[1]);

    //const xAxis = data[0][0];
    //const yAxis = data[0][1];

    const cols = squashDataIntoBuckets(data, defaultBucketCount);
    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: generateRange(xMin, xMax, (xMax - xMin) / defaultBucketCount),
                y: generateRange(yMin, yMax, (yMax - yMin) / defaultBucketCount),
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

    return (
        <GraphWrapper chart={chart}>
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

    const features = usePinnedFeatures();

    if (features === null) {
        return <WindowCircularProgress />;
    }

    if (features.size === 2) {
        win.setTitle(features.map(f => f.get("feature")).join(" vs "));
        return (
            <HeatmapGraph
                currentSelection={currentSelection}
                setCurrentSelection={setCurrentSelection}
                data={features}
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
