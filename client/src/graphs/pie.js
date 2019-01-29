export default class Pie {
    constructor() {
        this.seriesKey = {
            name: "",
            type: "pie",
            radius: [0, "30%"],
            //avoidLabelOverlap: false,
            selectedMode: "single",
            label: {
                normal: {
                    show: false,
                    position: "inner"
                }
            },
            labelLine: {
                normal: {
                    show: false
                }
            },
            data: []
        };

        this.option = {
            title: {
                text: ""
            },
            grid: {
                right: 10,
                left: 140
            },
            tooltip: {
                trigger: "item",
                formatter: "{a} <br/>{b}: {c} ({d}%)"
            },
            legend: {
                orient: "vertical",
                x: "left",
                top: "20%",
                data: [""]
            },
            series: [Object.assign({}, this.seriesKey)]
        };
    }

    getOption() {
        return this.option;
    }
    getSeriesKey() {
        return Object.assign({}, this.seriesKey);
    }
    transformData(d, ind, reverse) {
        function sortN(a, b) {
            return parseFloat(a) - parseFloat(b);
        }
        //https://github.com/ecomfe/echarts/blob/master/extension/dataTool/quantile.js
        function quart(Arr, p) {
            var H = (Arr.length - 1) * p + 1,
                h = Math.floor(H),
                v = +Arr[h - 1],
                e = H - h;
            return e ? v + e * (Arr[h] - v) : v;
        }

        var arr = [];

        for (let i = 1; i < d.length; i++) {
            arr.push(d[i][ind]);
        }
        arr.sort(sortN);

        var retArr = [];
        var quarter = quart(arr, 0.25);
        var half = quart(arr, 0.5);
        var fourth = quart(arr, 0.75);

        var q = 0,
            h = 0,
            f = 0,
            z = 0;

        for (let i = 0; i < arr.length; i++) {
            if (arr[i] < quarter) q++;
            else if (arr[i] >= quarter && arr[i] < half) h++;
            else if (arr[i] >= half && arr[i] < fourth) {
                f++;
            } else z++;
        }

        retArr.push({ value: q, name: "< quarter" });
        retArr.push({ value: h, name: ">= quarter < half" });
        retArr.push({ value: f, name: ">= half < fourth" });
        retArr.push({ value: z, name: ">= fourth" });

        //if (this.option.legend.data.length == 0) {
        this.option.legend.data.push("< quarter");
        this.option.legend.data.push(">= quarter < half");
        this.option.legend.data.push(">= half < fourth");
        this.option.legend.data.push(">= fourth");

        return retArr;
    }
}
