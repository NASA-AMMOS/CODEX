import "components/Graphs/ScatterGraph.css";

import React, { useRef, useState } from "react";
import ReactEcharts from "echarts-for-react";
import echartsgl from "echarts-gl";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";

function createGraphOptions(props) {
    const dataState = props.data;
    const selectedFeatures = dataState.get("featureList").filter(f => f.get("selected"));
    const xAxis = selectedFeatures.get(0).get("name");
    const yAxis = selectedFeatures.get(1).get("name");
    return {
        title: {
            text: ""
        },
        animation: false,
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
            show: false
        },
        brush: {
            toolbox: ["rect", "polygon", "keep", "clear"],
            brushStyle: {
                borderWidth: 5,
                color: "rgba(0,0,0,0.1)",
                borderColor: "rgba(255,69,0,1)"
            },
            outOfBrush: {
                color: "rgb(0,255,0)"
            },
            inBrush: {
                color: "rgb(0,0,255)"
            },
            xAxisIndex: 0,
            yAxisIndex: 0,
            throttleType: "debounce",
            throttleDelay: 300
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
                data: dataState.get("data"),
                itemStyle: {
                    normal: {
                        color: "#3386E6"
                    }
                }
            }
        ]
    };
}

function ScatterGraph(props) {
    const echart = useRef(null);
    const firstRender = useRef(true);

    let onEvents = {
        brushselected: (e, echart) => {
            console.log(e);
            // plug into the brush event here
            props.createSelection("Some Selection Name", [10, 15, 65]); // Action arguments are the selection name and an array of all the selected row indices.
        },
        rendered: () => {
            if (firstRender.current) {
                echart.current.getEchartsInstance().dispatchAction({
                    type: "takeGlobalCursor",
                    key: "brush",
                    brushOption: {
                        type: "rect"
                    }
                });
                firstRender.current = false;
            }
        }
    };

    const selectedFeatures = props.data.get("featureList").filter(f => f.get("selected"));
    const xAxis = selectedFeatures.get(0).get("name");
    const yAxis = selectedFeatures.get(1).get("name");

    return (
        <React.Fragment>
            <ReactEcharts
                ref={echart}
                option={createGraphOptions(props)}
                notMerge={true}
                lazyUpdate={false}
                style={{ height: "100%", width: "100%" }}
                onEvents={onEvents}
            />
            <div className="xAxisLabel">{xAxis}</div>
            <div className="yAxisLabel">{yAxis}</div>
        </React.Fragment>
    );
}

function mapStateToProps(state) {
    return {
        selections: state.selections.selections
    };
}

function mapDispatchToProps(dispatch) {
    return {
        createSelection: bindActionCreators(selectionActions.createSelection, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ScatterGraph);
