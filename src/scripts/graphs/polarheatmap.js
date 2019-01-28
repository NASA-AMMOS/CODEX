export default class polarheatmap {
    constructor() {
        this.seriesKey = {
            name: '',
            type: 'custom',
            coordinateSystem: 'polar',
            itemStyle: {
                normal: {
                    color: '#d14a61'
                }
            },
            renderItem: renderItem,
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
                  color: '#333',
                  type: 'dashed'
                }
              },
              axisLine: {
                show: false
              }
            },
            visualMap: {
                type: 'continuous',
                min: 0,
                max: null,
                top: 'middle',
                dimension: 2,
                calculable: true
            },
            radiusAxis: {
              type: 'category',
              z: 100,
            },
            legend: {
                data:['']
            },
            tooltip: {},
            series : [
                Object.assign( {}, this.seriesKey )
            ]
        }

        function renderItem(params, api) {
            var values = [api.value(0), api.value(1)];
            var coord = api.coord(values);
            var size = api.size([1, 1], values);
            return {
                type: 'sector',
                shape: {
                    cx: params.coordSys.cx,
                    cy: params.coordSys.cy,
                    r0: coord[2] - size[0] / 2,
                    r: coord[2] + size[0] / 2,
                    startAngle: coord[3] - size[1] / 2,
                    endAngle: coord[3] + size[1] / 2
                },
                style: api.style({
                    fill: api.visual('color')
                })
            };
        } 
    }

    getOption() {
        return this.option;
    }
    getSeriesKey() {
        return Object.assign( {}, this.seriesKey );
    }
    transformData( d , ind, reverse) {
        var data = [];
        var index = -1;
        var max = 0;
        //[ min value, max value ]
        var xRange = [ d[1][0], d[1][0] ];
        var yRange = [ d[1][1], d[1][1] ];
        
        for( var i = 1; i < d.length; i++) {
            d[i][0] = Math.floor(d[i][0]);
            d[i][1] = Math.floor(d[i][1]);
  
            if( xRange[0] > d[i][0] ) xRange[0] = d[i][0];
            else if( xRange[1] < d[i][0] ) xRange[1] = d[i][0];
            if( yRange[0] > d[i][1] ) yRange[0] = d[i][1];
            else if( yRange[1] < d[i][1] ) yRange[1] = d[i][1];
  
            index = inArray(data, d[i]);
  
            if (index !== -1) {
                data[index][2] += 1;
                max = (data[index][2] > max ? data[index][2] : max);
            }
            else {
              data.push([d[i][0], d[i][1], 1]);
            }
        }
        // this.option.visualMap.max = (xRange[1] > yRange[1] ? xRange[1] : yRange[1]);
        // this.option.visualMap.min = (xRange[0] < yRange[0] ? xRange[0] : yRange[0]);
        this.option.visualMap.max = max;
        return data;
        

        /*!!!This can become a rather heavy operation on larger datasets!!!
             A full 2d array where we go straight to the element would be faster
             (it'll take more memory though too)
        */
        //find indexOf find (array) in arr(2d array)
        function inArray(arr, find) {
            for (var x = 0; x < arr.length; x++) {
            if (arr[x][0] === find[0] && arr[x][1] === find[1])
                return x;
            }
            return -1;
        }

    }
}
