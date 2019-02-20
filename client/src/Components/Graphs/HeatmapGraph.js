import "components/Graphs/HeatmapGraph.css";

import React from "react";
import ReactEcharts from "echarts-for-react";

import * as utils from "utils/utils";

function formatData(cols) {
    /* Create array of all unique values with a tally (row[2]) of how many times they appear.
        This operation can get slow and may need to be optimized in the future (maybe use typed arrays?).

        It's a lot faster to search an array of numbers than an array of arrays,
        so we use zip/unzip functions to break the data into columns and then back again. */

    const yCol = cols[1].slice(1);
    return utils.zip(
        cols[0].slice(1).reduce(
            (acc, xVal, idx) => {
                const yVal = yCol[idx];
                const itemIndex = acc[0].findIndex((val, i) => val === xVal && acc[1][i] === yVal);
                if (itemIndex !== -1) {
                    acc[2][itemIndex]++;
                } else {
                    acc[0].push(xVal);
                    acc[1].push(yVal);
                    acc[2].push(1);
                }
                return acc;
            },
            [[], [], []]
        )
    );
}

function createGraphOptions(dataState) {
    const selectedFeatures = dataState.get("featureList").filter(f => f.get("selected"));

    const xAxis = selectedFeatures.get(0).get("name");
    const yAxis = selectedFeatures.get(1).get("name");

    // Split into columns for faster searching
    const cols = utils.unzip(dataState.get("data").toJS());
    const xRange = [Math.min(...cols[0].slice(1)), Math.max(...cols[0].slice(1))];
    const yRange = [Math.min(...cols[1].slice(1)), Math.max(...cols[1].slice(1))];

    return {
        title: {
            text: ""
        },
        grid: {
            right: 10,
            left: 140
        },
        tooltip: {},
        legend: {
            data: [""]
        },
        visualMap: {
            type: "piecewise",
            min: 0,
            max: xRange[1],
            calculable: true,
            realtime: false,
            splitNumber: 10,
            inRange: {
                color: [
                    "#313695",
                    "#4575b4",
                    "#74add1",
                    "#abd9e9",
                    "#e0f3f8",
                    "#ffffbf",
                    "#fee090",
                    "#fdae61",
                    "#f46d43",
                    "#d73027",
                    "#a50026"
                ]
            }
        },
        xAxis: [
            {
                type: "category",
                name: xAxis,
                nameLocation: "middle",
                data: Array.from(
                    new Array(Math.floor(Math.abs(xRange[1] - xRange[0]) + 1)),
                    (v, i) => {
                        return i + xRange[0];
                    }
                ),
                inverse: false
            }
        ],
        yAxis: [
            {
                type: "category",
                name: yAxis,
                nameLocation: "middle",
                data: Array.from(
                    new Array(Math.floor(Math.abs(yRange[1] - yRange[0]) + 1)),
                    (v, i) => {
                        return i + yRange[0];
                    }
                ),
                inverse: false
            }
        ],
        series: [
            {
                name: `${xAxis} vs ${yAxis}`,
                type: "heatmap",
                data: formatData(cols),
                progressive: 1000,
                animation: false,
                itemStyle: {
                    emphasis: {
                        borderColor: "#eee",
                        borderWidth: 2
                    }
                }
            }
        ]
    };
}

function HeatmapGraph(props) {
    return (
        <React.Fragment>
            <ReactEcharts
                option={createGraphOptions(props.data)}
                notMerge={true}
                lazyUpdate={true}
                style={{ height: "100%", width: "100%" }}
            />
        </React.Fragment>
    );
}

export default HeatmapGraph;
