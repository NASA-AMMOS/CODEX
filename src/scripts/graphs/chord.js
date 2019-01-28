export default class chord {
    constructor() {
        this.seriesKey = {
            name: '',
            type: 'graph',
            layout: 'circular',
            circular: {
                rotateLabel: true
            },
            data: [],
            links: null,
            categories: [],
            roam: true,
            label: {
                normal: {
                    position: 'right',
                    formatter: '{b}'
                }
            },
            itemStyle: {
                normal: {
                    color: 'source',
                    curveness: 0.3
                }
            }
        };

        this.option = {
            title: {
                text: ''
            },
            grid: {
                right: 10,
                left: 140
            },
            tooltip : {},
            legend: {
                data:['']
            },
            animationDurationUpdate: 1500,
            animationEasingUpdate: 'quinticInOut',
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
    transformData( d ) {
        var arr = [];
        /*
            format:
            {
                node.itemStyle = null
                node.value = null
                node.symbolSize = null
                node.label = {}
                node.category = ??
            }
        */
        
        var temp = {
            itemStyle: null,
            value: null,
            symbolSize: null,
            label: {
                normal: {
                    show: true
                }
            },
            category: null
        };

        for (var i = 1; i < d.length; i++) {
            temp.value = d[i][0];
            temp.symbolSize = temp.value/1.5;
           // temp.label.normal.show = temp.value > 0;
            arr.push(temp);
        }
        return arr;
    }
}