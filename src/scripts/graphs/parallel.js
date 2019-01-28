export default class parallel {
    constructor() {
        this.seriesKey = {
            name: '',
            type: 'parallel',
            data: [],
            lineStyle: {
              normal: {
                  width: 1,
                  opacity: 0.5
              }
          }
        };

        this.option = {
            backgroundColor: '#333',
            title: {
                text: ''
            },
            parallel: {
              left: '5%',
              right: '18%',
              bottom: 100,
              parallelAxisDefault: {
                type: 'value',
                name: '',
                nameLocation: 'end',
                nameGap: 20,
                nameTextStyle: {
                    color: '#fff',
                    fontSize: 12
                },
                axisLine: {
                    lineStyle: {
                        color: '#aaa'
                    }
                },
                axisTick: {
                    lineStyle: {
                        color: '#777'
                    }
                },
                splitLine: {
                    show: false
                },
                axisLabel: {
                    textStyle: {
                        color: '#fff'
                    }
                }
          }
        },
            parallelAxis: [
              {dim: 0, name: '', inverse: true, nameLocation: 'start'},
              {dim: 1, name: ''},
            ],
            visualMap: {
            show: true,
            min: null,
            max: null,
            dimension: 0,
            inRange: {
                color: ['#d94e5d','#eac736','#50a3ba'],
                // colorAlpha: [0, 1]
            }
        },
            legend: {
                  bottom: 30,
                  data: [''],
                  itemGap: 20,
                  textStyle: {
                      color: '#fff',
                      fontSize: 14
                  }
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
    transformData( d , ind, reverse) {
        var arr = [];

        var max = Number.MIN_SAFE_INTEGER;
        var min = Number.MAX_SAFE_INTEGER;
        var temp = 0;
        for (var i = 1; i < d.length; i++) {
          arr.push([d[i][0], d[i][1]], d[i][2]);
        //   max = d[i][0] > d[i][1] ? (d[i][0] > max ? d[i][0] : max) : (d[i][1] > max ? d[i][1] : max);
        //   min = d[i][0] < d[i][1] ? (d[i][0] < min ? d[i][0] : min) : (d[i][1] < min ? d[i][1] : min);
          max = (temp = Math.max(d[i][0], d[i][1], d[i][2])) > max ? temp : max;
          min = (temp = Math.min(d[i][0], d[i][1], d[i][2])) < min ? temp : min;
        }
        this.option.visualMap.min = min;
        this.option.visualMap.max = max;

        return arr;
    }
}
