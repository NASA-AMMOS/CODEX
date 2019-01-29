export default class heatmap {
    constructor() {
        this.seriesKey = {
            name: "",
            type: "heatmap",
            data: [],
            progressive: 1000,
            animation: false,
            itemStyle: {
                emphasis: {
                    borderColor: "#eee",
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
                left: 140
            },
            tooltip: {},
            legend: {
                data: [""]
            },
            visualMap: {
                type: "piecewise",
                min: 0,
                max: 5000,
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
                    name: "",
                    nameLocation: "middle",
                    data: [],
                    inverse: false
                }
            ],
            yAxis: [
                {
                    type: "category",
                    name: "",
                    nameLocation: "middle",
                    data: [],
                    inverse: false
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
    transformData(d, seriesI, r, reverse) {
        if (r) {
            if (reverse === "x")
                this.option.xAxis[seriesI].inverse = !this.option.xAxis[seriesI].inverse;
            else this.option.yAxis[seriesI].inverse = !this.option.yAxis[seriesI].inverse;
            return this.option;
        }

        var data = [];
        var index = -1;
        //[ min value, max value ]
        var xRange = [d[1][0], d[1][0]];
        var yRange = [d[1][1], d[1][1]];
        let max = 0;
        for (var i = 1; i < d.length; i++) {
            d[i][0] = Math.floor(d[i][0]);
            d[i][1] = Math.floor(d[i][1]);

            if (xRange[0] > d[i][0]) xRange[0] = d[i][0];
            else if (xRange[1] < d[i][0]) xRange[1] = d[i][0];
            if (yRange[0] > d[i][1]) yRange[0] = d[i][1];
            else if (yRange[1] < d[i][1]) yRange[1] = d[i][1];

            index = inArray(data, d[i]);

            if (index !== -1) {
                data[index][2] += 1;
                if (data[index][2] > max) max = data[index][2];
            } else {
                data.push([d[i][0], d[i][1], 1]);
            }
        }

        //These are just arrays filled with ints from min range to max range
        this.option.xAxis[seriesI].data = Array.from(
            new Array(Math.floor(Math.abs(xRange[1] - xRange[0]) + 1)),
            (v, i) => {
                return i + xRange[0];
            }
        );
        this.option.yAxis[seriesI].data = Array.from(
            new Array(Math.floor(Math.abs(yRange[1] - yRange[0]) + 1)),
            (v, i) => {
                return i + yRange[0];
            }
        );
        this.option.visualMap.max = max;

        for (let i = 0; i < data.length; i++) {
            data[i][0] = this.option.xAxis[seriesI].data.indexOf(data[i][0]);
            data[i][1] = this.option.yAxis[seriesI].data.indexOf(data[i][1]);
        }

        return data;

        /*!!!This can become a rather heavy operation on larger datasets!!!
             A full 2d array where we go straight to the element would be faster
             (it'll take more memory though too)
        */
        //find indexOf find (array) in arr(2d array)
        function inArray(arr, find) {
            for (var x = 0; x < arr.length; x++) {
                if (arr[x][0] === find[0] && arr[x][1] === find[1]) return x;
            }
            return -1;
        }
    }
}
