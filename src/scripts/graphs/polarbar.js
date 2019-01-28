import ecStat from 'echarts-stat';

export default class polarbar {
    constructor() {
        this.seriesKey = {
            name: '',
            type: 'bar',
            coordinateSystem: 'polar',
            stack: 'a',
            data: [],
        };

        this.option = {
            title: {
                text: ''
            },
            polar: {},
            angleAxis: {
                //
            },
            radiusAxis: {
                type: 'category',
                z: 10,
                data: []
            },
            //color: ['rgb(25, 183, 207)'],
            // grid: {
            //     left: '2%',
            //     right: '5%',
            //     bottom: '5%',
            //     containLabel: true
            // },
            legend: {
                data:[]
            },
            series : [
                Object.assign( {}, this.seriesKey )
            ]
        }
    }

    getOption() {
        return this.option;
    }
    getSeriesKey() {
        return Object.assign( {}, this.seriesKey );
    }

    transformData( d, ind, reverse) {
        var arr = [];

        //currently working with x-axis
        for (var i = 1; i < d.length; i++) {
          arr.push(d[i][ind]);
        }

        var bins = ecStat.histogram(arr);
        // var max = Number.MIN_SAFE_INTEGER;
        // var min = Number.MAX_SAFE_INTEGER;
        // var interval;

        // for (var i = 0; i < bins.bins.length; i++) {
        //     var x0 = bins.bins[i].x0;
        //     var x1 = bins.bins[i].x1;
        //     interval = x1 - x0;
        //     min = Math.min(min, x0);
        //     max = Math.max(max, x1); 
        // }
        // var add = min;
        // this.option.radiusAxis.data.push(min);
        // while (add <= max) {
        //     add += interval;
        //     this.option.radiusAxis.data.push(add);
        // }

        return bins.data;

    }
}
