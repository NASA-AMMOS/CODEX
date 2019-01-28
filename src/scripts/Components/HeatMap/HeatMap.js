import React, { Component } from 'react';
import './HeatMap.css';

import echarts from 'echarts';
import ReactEcharts from 'echarts-for-react';

import { getNoiseHelper } from './helper.js';

class HeatMap extends Component {
  constructor() {
    super();

    this.vars = {
      data: generateData(2, -5, 5)
    };
    this.state = {
      option: {
        title: {
          text: ''
        },
         tooltip: {
            trigger: 'item',
         },
        axisPointer: {
          label: {
            textStyle: {
              color: '#292939'
            }
          }
        },
        legend: {
          data:['XAxis vs Y Axis']
        },
        toolbox: {
          show: true,
          feature: {
            mark: {show: true},
            dataZoom: {show: true, title: { zoom: 'area zoom', back: 'restore area zoom'}},
            restore: {show: true, title: 'restore'},
            saveAsImage: {show: true, title: 'save as image'},
            brush: {
              type: ['rect','polygon','keep','clear']
            }
          }
        },
        brush: {
          toolbox: ['rect', 'polygon','keep','clear'],
          outOfBrush: {
            colorAlpha: 0.3,
            color: '#abc'
          },
          brushType: 'rect',
          brushMode: 'single',
          brushStyle: {
            borderWidth: 3,
            color: 'rgba(0,0,0,0.2)',
            borderColor: 'rgba(0,0,0,0.5)'
          }
        },
        xAxis: [
          {
            type: 'value',
            name: '',
            nameLocation: 'middle',
            scale: false,
          }
        ],
        yAxis: [
          {
            type: 'value',
            name: '',
            nameLocation: 'middle',
            scale: false,
          }
        ],
        visualMap: {
          type: 'piecewise',
          min: 0,
          max: 1,
          calculable: false,
          realtime: false,
          splitNumber: 8,
          inRange: {
              color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
          }
        },
        series: [
          {
            name: 'HeatMap',
            type: 'heatmap',
            data: this.vars.data,
            itemStyle: {
              emphasis: {
                borderColor: '#333',
                borderWidth: 1
              }
            },
            animation: false,
            progressive: 1000
          }
        ]
      }
    };

  function generateData(theta, min, max) {
    var noise = getNoiseHelper();
    var ARRAYSZ = 200;
    var PTS = 150;
    noise.seed(Math.random());
    var data = [];
    for (var i = 1; i <= ARRAYSZ; i++) {
        for (var j = 1; j <= PTS; j++) {
            data.push([i, j, noise.perlin2(i / 40, j / 20) + 0.5]);
        }
    }
    return data;
}

    function _getDarkTheme() {
      var contrastColor = '#eee';
      var axisCommon = function () {
          return {
              axisLine: {
                  lineStyle: {
                      color: contrastColor
                  }
              },
              axisTick: {
                  lineStyle: {
                      color: contrastColor
                  }
              },
              axisLabel: {
                  textStyle: {
                      color: contrastColor
                  }
              },
              splitLine: {
                  lineStyle: {
                      type: 'dashed',
                      color: '#555'
                  }
              },
              splitArea: {
                  areaStyle: {
                      color: contrastColor
                  }
              }
          };
      };

      var colorPalette = ['#dd6b66','#759aa0','#e69d87','#8dc1a9','#ea7e53','#eedd78','#73a373','#73b9bc','#7289ab', '#91ca8c','#f49f42'];
      return {
          color: colorPalette,
          backgroundColor: 'none',
          tooltip: {
              axisPointer: {
                  lineStyle: {
                      color: contrastColor
                  },
                  crossStyle: {
                      color: contrastColor
                  }
              }
          },
          legend: {
              textStyle: {
                  color: contrastColor
              }
          },
          textStyle: {
              color: contrastColor
          },
          title: {
              textStyle: {
                  color: contrastColor
              }
          },
          toolbox: {
              iconStyle: {
                  normal: {
                      borderColor: contrastColor
                  }
              }
          },
          dataZoom: {
              textStyle: {
                  color: contrastColor
              }
          },
          visualMap: {
              textStyle: {
                  color: contrastColor
              }
          },
          timeline: {
              lineStyle: {
                  color: contrastColor
              },
              itemStyle: {
                  normal: {
                      color: colorPalette[1]
                  }
              },
              label: {
                  normal: {
                      textStyle: {
                          color: contrastColor
                      }
                  }
              },
              controlStyle: {
                  normal: {
                      color: contrastColor,
                      borderColor: contrastColor
                  }
              }
          },
          timeAxis: axisCommon(),
          logAxis: axisCommon(),
          valueAxis: axisCommon(),
          categoryAxis: axisCommon(),

          line: {
              symbol: 'circle'
          },
          graph: {
              color: colorPalette
          },
          gauge: {
              title: {
                  textStyle: {
                      color: contrastColor
                  }
              }
          },
          candlestick: {
              itemStyle: {
                  normal: {
                      color: '#FD1050',
                      color0: '#0CF49B',
                      borderColor: '#FD1050',
                      borderColor0: '#0CF49B'
                  }
              }
          }
      };
    }
    echarts.registerTheme( 'dark_theme', _getDarkTheme() );
}//constructor

render() {
  return (
    <div className='HeatMap'>
      <ReactEcharts
          option={this.state.option}
          style={{height: 'calc( 100% - 32px )', width: '100%'}}
          theme={'dark_theme'}
      />
      </div>
  );
}
}//class



export default HeatMap;
