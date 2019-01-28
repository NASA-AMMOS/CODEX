'use strict';

var React = require('react');
var d3 = require('d3');
var VoronoiCircleContainer = require('./VoronoiCircleContainer');
var Line = require('./Line');

module.exports = React.createClass({

  displayName: 'DataSeries',

  propTypes: {
    color: React.PropTypes.func,
    colorAccessor: React.PropTypes.func,
    data: React.PropTypes.array,
    interpolationType: React.PropTypes.string,
    xAccessor: React.PropTypes.func,
    yAccessor: React.PropTypes.func,
  },

  getDefaultProps:function() {
    return {
      data: [],
      xAccessor: function(d)  {return d.x;},
      yAccessor: function(d)  {return d.y;},
      interpolationType: 'linear'
    };
  },
  
  _isDate:function(d, accessor) {
      return Object.prototype.toString.call(accessor(d)) === '[object Date]';
  },

  render:function() {
    var props = this.props;
    var xScale = props.xScale;
    var yScale = props.yScale;
    var xAccessor = props.xAccessor,
        yAccessor = props.yAccessor;
    
    var interpolatePath = d3.svg.line()
        .y( function(d)  {return props.yScale(yAccessor(d));} )
        .interpolate(props.interpolationType);

        if (this._isDate(props.data[0].values[0], xAccessor)) {
          interpolatePath.x(function(d) {
            return props.xScale(props.xAccessor(d).getTime());
          });
        } else {
          interpolatePath.x(function(d) {
            return props.xScale(props.xAccessor(d));
          });
        }

    var lines = props.data.map(function(series, idx)  {
      return (
        React.createElement(Line, {
          path: interpolatePath(series.values), 
          stroke: props.colors(props.colorAccessor(series, idx)), 
          strokeWidth: series.strokeWidth, 
          strokeDashArray: series.strokeDashArray, 
          seriesName: series.name, 
          key: idx}
        )
      );
    });

    var voronoi = d3.geom.voronoi()
      .x(function(d){ return xScale(d.coord.x); })
      .y(function(d){ return yScale(d.coord.y); })
      .clipExtent([[0, 0], [ props.width , props.height]]);

    var cx, cy, circleFill;
    var regions = voronoi(props.value).map(function(vnode, idx) {
      var point = vnode.point.coord;
      if (Object.prototype.toString.call(xAccessor(point)) === '[object Date]') {
        cx = props.xScale(xAccessor(point).getTime());
      } else {
        cx = props.xScale(xAccessor(point));
      }
      if (Object.prototype.toString.call(yAccessor(point)) === '[object Date]') {
        cy = props.yScale(yAccessor(point).getTime());
      } else {
        cy = props.yScale(yAccessor(point));
      }
      circleFill = props.colors(props.colorAccessor(vnode, vnode.point.seriesIndex));
      
      return (
          React.createElement(VoronoiCircleContainer, {
              key: idx, 
              circleFill: circleFill, 
              vnode: vnode, 
              cx: cx, cy: cy, 
              circleRadius: props.circleRadius}
          )
      );
    }.bind(this));

    return (
      React.createElement("g", null, 
        React.createElement("g", null, regions), 
        React.createElement("g", null, lines)
      )
    );
  }

});
