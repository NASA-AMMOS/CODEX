export default class polarScatter {
    constructor() {
        this.seriesKey = {
            name: '',
            type: 'scatter',
            coordinateSystem: 'polar',
            symbolSize: 10,
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
            polar: {},
            angleAxis: {
              type: 'category',
              data: ['90', '60', '30', '0', '330', '300', '270', '240', '210', '180', '150', '120'],
              boundaryGap: false,
              splitLine: {
                show: true,
                lineStyle: {
                  color: '#999',
                  type: 'dashed'
                }
              },
              axisLine: {
                show: true
              }
            },
            radiusAxis: {
              type: 'value',
              axisLine: {
                show: false
              },
              axisLabel: {
                rotate: 45
              }
            },
            legend: {
                data:['']
            },
            tooltip: {
              formatter: function(params) {
                return params.value[0] + ',' + params.value[1];
              }
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

        //must convertToDegree(radian) first
        //this function rounds to the nearest multiple of 30
        function roundDegree(degree) {
          if (degree < 0)
            return Math.abs((Math.round(degree / 30.0) * 30) - 180);
          return Math.round(degree / 30.0) * 30
        }

        function convertToDegree(radian) {
          return radian * 180 / Math.PI;
        }

        var arr = [];
        for (var i = 1; i < d.length; i++) {
          var r = Math.sqrt(d[i][0] * d[i][0] + (d[i][1] * d[i][1]));
          var theta = roundDegree(convertToDegree(Math.atan(d[i][1], d[i][0])));
          for (var x = 0; x < this.option.angleAxis.data.length; x++) {
            if (theta + '' === this.option.angleAxis.data[x]) {
              theta = x;
              break;
            }
          }
          arr.push([r, theta]);
        }

        arr.map(JSON.stringify).reverse().filter(function (e, i, a) {
            return a.indexOf(e, i+1) === -1;
        }).reverse().map(JSON.parse)

        return arr;
    }
}
