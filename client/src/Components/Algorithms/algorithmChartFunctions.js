import React from "react";
import ReactEcharts from "echarts-for-react";
import echartsgl from "echarts-gl";

export function makeSubalgoPlot(subalgo_state) {
    const dataPoints = subalgo_state.serverData ? subalgo_state.serverData.data : null;
    return (
        <div key={subalgo_state.name} className="subalgo-plot">
            {makeSimpleScatterPlot(dataPoints)}
        </div>
    );
}

// Initializes a simple scatter plot. If no data is passed in, initialize a chart with the loading circle running.
export function makeSimpleScatterPlot(data) {
    data = data || [];
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
        series: [
            {
                name: "",
                type: "scatter",
                large: true,
                symbolSize: 5,
                data,
                progressive: 0,
                animation: true,
                itemStyle: {
                    emphasis: {
                        borderColor: "#eee",
                        borderWidth: 2
                    }
                }
            }
        ]
    };
    return (
        <ReactEcharts
            option={chartOptions}
            notMerge={true}
            lazyUpdate={true}
            style={{ height: "100%", width: "100%" }}
            showLoading={!data.length}
        />
    );
}
