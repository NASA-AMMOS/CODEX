import "components/Graphs/ScatterGraph.css";

import React from "react";
import ReactEcharts from "echarts-for-react";

function createGraphOptions(dataState) {
    const selectedFeatures = dataState.get("featureList").filter(f => f.get("selected"));
    const xAxis = selectedFeatures.get(0).get("name");
    const yAxis = selectedFeatures.get(1).get("name");
    return {
        title: {
            text: ""
        },
        grid: {
            top: 15,
            right: 15,
            left: 5,
            bottom: 5,
            containLabel: true
        },
        dataZoom: [
            {
                type: "inside",
                xAxisIndex: 0,
                yAxisIndex: 0
                //orient: 'vertical'
            }
        ],
        tooltip: {
            formatter: function(params) {
                if (params.length) {
                    return (
                        params.length +
                        " points:<br/>" +
                        "x: " +
                        params[0].value[0] +
                        " y: " +
                        params[0].value[1]
                    );
                }
            },
            trigger: "none",
            showDelay: 0,
            axisPointer: {
                show: true,
                type: "cross",
                lineStyle: {
                    type: "dashed",
                    width: 1
                }
            },
            zlevel: 1
        },
        legend: {
            type: "scroll",
            top: "25",
            data: [""],
            align: "left",
            tooltip: {
                overflow: false,
                confine: true
            }
        },
        toolbox: {
            show: false,
            feature: {
                mark: { show: true },
                dataZoom: {
                    show: true,
                    title: { zoom: "area zoom", back: "restore area zoom" }
                },
                restore: { show: true, title: "restore" },
                saveAsImage: { show: true, title: "save as image" },
                brush: {
                    show: true,
                    title: {
                        rect: "Rectangle selection",
                        polygon: "Polygon selection",
                        lineX: "Horizontal selection",
                        lineY: "Vertical selection",
                        keep: "Keep previous selections",
                        clear: "Clear selection"
                    }
                }
            }
        },
        brush: {
            toolbox: ["rect", "polygon", "keep", "clear"],
            brushStyle: {
                borderWidth: 5,
                color: "rgba(0,0,0,0.1)",
                borderColor: "rgba(255,69,0,1)"
            },
            throttleType: "debounce",
            throttleDelay: 800
        },
        xAxis: [
            {
                type: "value",
                name: xAxis,
                nameLocation: "end",
                scale: true,
                axisPointer: {
                    show: true
                },
                z: 100,
                nameTextStyle: {
                    padding: 12,
                    fontSize: 18,
                    color: "rgba(0,0,0,0)"
                },
                inverse: false
            }
        ],
        yAxis: [
            {
                type: "value",
                name: yAxis,
                nameLocation: "middle",
                scale: true,
                axisPointer: {
                    show: true
                },
                z: 100,
                nameTextStyle: {
                    padding: 20,
                    fontSize: 18,
                    color: "rgba(0,0,0,0)"
                },
                inverse: false
            }
        ],
        series: [
            {
                name: `${xAxis} vs ${yAxis}`,
                type: "scatterGL",
                symbolSize: 2,
                large: true,
                data: dataState.get("data").toJS(),
                itemStyle: {
                    normal: {
                        color: "#3386E6"
                    }
                }
            }
        ],
        color: [
            "#0069e0",
            "#61a0a8",
            "#d48265",
            "#91c7ae",
            "#749f83",
            "#ca8622",
            "#bda29a",
            "#6e7074",
            "#546570",
            "#c4ccd3"
        ]
    };
}

function ScatterGraph(props) {
    const selectedFeatures = props.data.get("featureList").filter(f => f.get("selected"));
    const xAxis = selectedFeatures.get(0).get("name");
    const yAxis = selectedFeatures.get(1).get("name");

    return (
        <React.Fragment>
            <ReactEcharts
                option={createGraphOptions(props.data)}
                notMerge={true}
                lazyUpdate={true}
                style={{ height: "100%", width: "100%" }}
            />
            <div className="GenericGraphXAxisLabel">{xAxis}</div>
            <div className="GenericGraphYAxisLabel">{yAxis}</div>
        </React.Fragment>
    );
}

export default ScatterGraph;
