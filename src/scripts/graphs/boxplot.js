export default class boxplot {
    constructor() {
        this.seriesKey = {
            name: '',
            type: 'boxplot',
            large: true,
            symbolSize: 3,
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
            tooltip : {
                trigger: 'item',
                axisPointer: {
                  type: 'shadow',
                  label: {
                      textStyle: {
                          color: '#292939'
                      }
                }
            }
          },
            legend: {
                data:['']
            },
            toolbox: {
                show : true,
                feature : {
                mark : {show: true},
                dataZoom : {show: true, title: { zoom: 'area zoom', back: 'restore area zoom' }},
                restore : {show: true, title: 'restore'},
                saveAsImage : {show: true, title: 'save as image'},
                brush: {
                    show: true,
                    title: {
                        rect: 'Rectangle selection',
                        polygon: 'Polygon selection',
                        lineX: 'Horizontal selection',
                        lineY: 'Vertical selection',
                        keep: 'Keep previous selections',
                        clear: 'Clear selection'
                    }
                }
                }
            },
            brush: {
                toolbox: ['rect', 'polygon', 'keep', 'clear'],
                outOfBrush: {
                    color: '#abc'
                },
                brushStyle: {
                    borderWidth: 2,
                    color: 'rgba(0,0,0,0.2)',
                    borderColor: 'rgba(0,0,0,0.5)',
                },
                throttleType: 'debounce',
                throttleDelay: 500
            },
            xAxis : [
                {
                type : 'category',
                name: '',
                nameLocation: 'middle',
                scale: true,
                z: 100,
                data: [0, 1],
                nameTextStyle: {
                    padding: 12,
                    fontSize: 18
                },
                splitArea: {
                  show: false
                },
                inverse: false
                }
            ],
            yAxis : [
                {
                type : 'value',
                name: '',
                nameLocation: 'middle',
                scale: true,
                z: 100,
                nameTextStyle: {
                    padding: 12,
                    fontSize: 18
                },
                splitArea: {
                  show: false
                },
                inverse: false
                }
            ],
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
    transformData( d , seriesI, r, reverse) {
        if ( r ) {
            if (reverse === "x")
                this.option.xAxis[0].inverse = !(this.option.xAxis[0].inverse);
            else
                this.option.yAxis[0].inverse = !(this.option.yAxis[0].inverse);
            return this.option;
        }
        
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
        //default Math.max/min.apply weren't working, slow solution for now
        function findMax(arr) {
          var max = 0;
          for (var i = 0; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }
          return max;
        }

        function findMin(arr) {
          var min = Number.MAX_SAFE_INTEGER;
          for (var i = 0; i < arr.length; i++) {
            if (arr[i] < min) {
              min = arr[i];
            }
          }
          return min;
        }

        var boxData = [];
        for (var i = 0; i < d[0].length; i++) {
          var arr = [];
          for (var j = 1; j < d.length; j++) {
            arr.push(d[j][i]);
          }
          arr.sort(sortN);
          boxData.push([findMin(arr), quart(arr, 0.25),quart(arr,0.5),quart(arr,0.75), findMax(arr)]);
        }
        return boxData;
    }
}
