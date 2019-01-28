'use strict';

var React = require('react');
var d3 = require('d3');
var AreaContainer = require('./AreaContainer');

module.exports = React.createClass({

  displayName: 'DataSeries',

  propTypes: {
    fill:              React.PropTypes.string,
    interpolationType: React.PropTypes.string
  },

  getDefaultProps:function() {
    return {
      interpolationType: 'linear'
    };
  },

  render:function() {

    var props = this.props;

    var area = d3.svg.area()
      .x(function(d) { return props.xScale(props.xAccessor(d)); })
      .y0(function(d) { return props.yScale(d.y0); })
      .y1(function(d) { return props.yScale(d.y0 + props.yAccessor(d)); })
      .interpolate(props.interpolationType);

    var path = area(props.data);

    return (
      React.createElement(AreaContainer, {
        fill: props.fill, 
        hoverAnimation: props.hoverAnimation, 
        path: path}
      )
    );
  }

});
