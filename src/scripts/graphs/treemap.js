import ecStat from 'echarts-stat';

export default class treemap {
    constructor() {
        this.seriesKey = {
            name: '',
            type: 'treemap',
            data: [],
        };

        this.option = {
            title: {
                text: ''
            },
            grid: {
                right: 10,
                left: 140
            },
            calculable: false,
            series : [
                Object.assign( {}, this.seriesKey ),
            ]
        }
    }

    getOption() {
        return this.option;
    }
    getSeriesKey() {
        return Object.assign( {}, this.seriesKey );
    }
    transformData( d ) {
        var arr = [];

        for (var i = 1; i < d.length; i++) {
          arr.push(d[i][0]);
        }
        
        var bins = ecStat.histogram(arr);
        
        // var list_ = [];
        // for (var i = 0; i < bins.data.length; i++) {

        // }

        return {name: "first",
                value: 5}
    }
}
