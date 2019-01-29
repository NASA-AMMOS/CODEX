import ecStat from "echarts-stat";

export default class Bar {
    constructor() {
        this.seriesKey = {
            name: "",
            type: "bar",
            data: [],
            markPoint: {
                data: [{ type: "max", name: "MAX" }, { type: "min", name: "MIN" }]
            }
        };

        this.option = {
            title: {
                text: ""
            },
            grid: {
                left: "2%",
                right: "5%",
                bottom: "5%",
                containLabel: true
            },
            legend: {
                data: []
            },
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

        return bins.data;
    }
}
