export default class simplescatter {
    constructor() {
        this.seriesKey = {
            name: "",
            type: "line",
            symbolSize: 5,
            data: [],
            animation: true,
            animationEasing: "quarticIn",
            itemStyle: {
                emphasis: {
                    borderColor: "#111",
                    borderWidth: 2
                }
            }
        };

        this.option = {
            title: {
                text: ""
            },
            grid: {
                right: 10,
                left: 30,
                top: 10,
                bottom: 25
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
                    min: 0,
                    max: "dataMax",
                    axisLabel: {
                        show: true
                    },
                    splitLine: { show: false },
                    scale: true,
                    splitNumber: 1,
                    interval: 1,
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
                    min: 0,
                    max: 1,
                    axisLabel: {
                        show: true
                    },
                    splitLine: { show: false },
                    scale: true,
                    nameTextStyle: {
                        padding: 12,
                        fontSize: 18
                    }
                }
            ],
            series: []
        };
    }

    getOption() {
        return this.option;
    }
    getSeriesKey() {
        return Object.assign({}, this.seriesKey);
    }
    transformData(d) {
        return d;
    }
}
