export default class simplescatter {
    constructor() {
        this.seriesKey = {
            name: '',
            type: 'scatter',
            large: true,
            symbolSize: 5,
            data: [],
            progressive: 0,
            animation: true,
            itemStyle: {
                emphasis: {
                    borderColor: '#eee',
                    borderWidth: 2
                }
            }
        };

        this.option = {
            title: {
                text: ''
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
                        color: '#292939'
                    }
                }
            },
            legend: {
                data:['']
            },
            toolbox: {
                show : false,
            },
            xAxis : [
                {
                type : 'value',
                name: '',
                nameLocation: 'middle',
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
            yAxis : [
                {
                type : 'value',
                name: '',
                nameLocation: 'middle',
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
            series : [],
        }
    }

    getOption() {
        return this.option;
    }
    getSeriesKey() {
        return Object.assign( {}, this.seriesKey );
    }
    transformData( d ) {
        return d;
    }
}