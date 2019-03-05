import React, { useState } from "react";
import ReactEcharts from "echarts-for-react";
import echartsgl from "echarts-gl";
import classnames from "classnames";

// Utility function that creates a set of series based on server return data.
export function createPlotSeries(serverData) {
    return serverData.data.reduce(
        (acc, val, idx) => {
            const seriesIndex = serverData.clusters[idx];
            if (seriesIndex !== -1) {
                acc.data[seriesIndex] = acc.data[seriesIndex] || [];
                acc.data[seriesIndex].push(val);
            } else {
                // Noise is indicated by a cluster index of -1
                acc.noise.push(val);
            }
            return acc;
        },
        { data: [], noise: [] }
    );
}

// Initializes a simple scatter plot. If no data is passed in, initialize a chart with the loading circle running.
export function makeSimpleScatterPlot(serverData) {
    let series = [];
    if (serverData) {
        const { data, noise } = createPlotSeries(serverData);
        series = data.map(s => {
            return {
                name: "",
                type: "scatter",
                large: true,
                symbolSize: 5,
                data: s,
                progressive: 0,
                animation: true,
                itemStyle: {
                    emphasis: {
                        borderColor: "#eee",
                        borderWidth: 2
                    }
                }
            };
        });

        // Set style for noise points.
        if (noise.length) {
            series.push({
                name: "",
                type: "scatter",
                large: true,
                symbolSize: 5,
                data: noise,
                progressive: 0,
                animation: true,
                itemStyle: {
                    normal: {
                        opacity: 1,
                        color: "#eee",
                        borderWidth: 0.5,
                        borderColor: "#aaa"
                    }
                }
            });
        }
    }

    const chartOptions = {
        title: {
            text: ""
        },
        grid: {
            right: 10,
            left: 10,
            top: 10,
            bottom: 10
        },
        axisPointer: {
            label: {
                textStyle: {
                    color: "#292939"
                }
            }
        },
        legend: {
            data: [""]
        },
        toolbox: {
            show: false
        },
        xAxis: [
            {
                type: "value",
                name: "",
                nameLocation: "middle",
                axisLabel: {
                    show: false
                },
                splitLine: { show: true },
                scale: true,
                z: 100,
                nameTextStyle: {
                    padding: 12,
                    fontSize: 18
                }
            }
        ],
        yAxis: [
            {
                type: "value",
                name: "",
                nameLocation: "middle",
                axisLabel: {
                    show: false
                },
                splitLine: { show: true },
                scale: true,
                z: 100,
                nameTextStyle: {
                    padding: 12,
                    fontSize: 18
                }
            }
        ],
        series
    };

    return (
        <ReactEcharts
            option={chartOptions}
            notMerge={true}
            lazyUpdate={true}
            style={{ height: "100%", width: "100%" }}
            showLoading={!serverData}
        />
    );
}

// Render the subalgo plot div.
export function SubalgoChart(props) {
    const [hoverState, setHoverState] = useState(false);

    const dataPoints = props.serverData ? props.serverData.data : null;
    const containerClasses = classnames({
        "subalgo-container": true,
        selected: !props.editMode && hoverState,
        "edit-mode": props.editMode
    });
    const titleClasses = classnames({
        "subalgo-title": true,
        selected: !props.editMode && hoverState
    });

    const timeToGenerate = props.serverData ? `~${props.serverData.eta.toFixed(2)}s` : "";

    return (
        <div
            className={containerClasses}
            onMouseOver={_ => setHoverState(true)}
            onMouseOut={_ => setHoverState(false)}
            onClick={props.onClickCallback}
        >
            <div className={titleClasses}>{props.editMode ? "Preview" : props.humanName}</div>
            <div className="subalgo-plot">{makeSimpleScatterPlot(props.serverData)}</div>
            <div className="subalgo-time" hidden={props.editMode}>
                {timeToGenerate}
            </div>
        </div>
    );
}

export default SubalgoChart;
