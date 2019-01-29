import ecStat from "echarts-stat";

export default class histogram {
    constructor() {
        this.seriesKey = {
            name: "",
            type: "bar",
            barWidth: "95%",
            label: {
                normal: {
                    show: false, //Need to be able to hide 0 values
                    position: "top",
                    formatter: function(params) {
                        return params.value[1]; //[1] # in bins, [0] for values
                    }
                }
            },
            barGap: 0,
            markLine: {
                data: [{ type: "average", name: "average" }]
            },
            markPoint: {
                data: [{ type: "max", name: "max" }]
            },
            data: []
        };

        this.option = {
            title: {
                text: ""
            },
            //color: ['rgb(25, 183, 207)'],
            grid: {
                left: "2%",
                right: "10%",
                bottom: "10%",
                containLabel: true
            },
            legend: {
                data: []
            },
            dataZoom: [
                {
                    type: "slider",
                    height: 8,
                    bottom: 20,
                    borderColor: "transparent",
                    backgroundColor: "#000000",
                    handleIcon:
                        "M10.7,11.9H9.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4h1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7v-1.2h6.6z M13.3,22H6.7v-1.2h6.6z M13.3,19.6H6.7v-1.2h6.6z",
                    handleSize: 20,
                    handleStyle: {
                        shadowBlur: 6,
                        shadowOffsetX: 1,
                        shadowOffsetY: 2,
                        shadowColor: "#aaa"
                    }
                },
                {
                    type: "inside"
                }
            ],
            toolbox: {
                show: true,
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
                outOfBrush: {
                    color: "#abc"
                },
                brushStyle: {
                    borderWidth: 2,
                    color: "rgba(0,0,0,0.2)",
                    borderColor: "rgba(0,0,0,0.5)"
                },
                throttleType: "debounce",
                throttleDelay: 500
            },
            xAxis: [
                {
                    type: "value",
                    name: "",
                    nameLocation: "middle",
                    scale: true,
                    inverse: false
                }
            ],
            yAxis: [
                {
                    type: "value",
                    name: "",
                    nameLocation: "middle",
                    inverse: false
                }
            ],
            series: [
                //Object.assign( {}, this.seriesKey )
            ]
        };
    }

    getOption() {
        return this.option;
    }
    getSeriesKey() {
        return Object.assign({}, this.seriesKey);
    }
    transformData(d, seriesI, r, reverse) {
        if (r) {
            if (reverse === "x") this.option.xAxis[0].inverse = !this.option.xAxis[0].inverse;
            else this.option.yAxis[0].inverse = !this.option.yAxis[0].inverse;
            return this.option;
        }

        var arr = [];

        //currently working with x-axis
        for (var i = 1; i < d.length; i++) {
            arr.push(d[i][seriesI]);
        }

        var bins = ecStat.histogram(arr);
        //above method creates a 2d array
        /**
        [
        [bin, # of values]
        [bin, # of values]
        ]
        Need a proper definition how to get the bins
        **/

        return bins.data;
    }
}
