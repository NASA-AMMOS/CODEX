'use strict';

var React = require('react');
var d3 = require('d3');

module.exports = React.createClass({

  displayName: 'VoronoiCircle',

  getDefaultProps:function() {
    return { 
      circleRadius: 3,
      circleFill: '#1f77b4',
    };
  },

  render:function() {
    return (
      React.createElement("g", null, 
        React.createElement("path", {
          onMouseOver: this.props.handleMouseOver, 
          onMouseLeave: this.props.handleMouseLeave, 
          fill: "transparent", 
          d: this.props.voronoiPath}
        ), 
        React.createElement("circle", {
          onMouseOver: this.props.handleMouseOver, 
          onMouseLeave: this.props.handleMouseLeave, 
          cx: this.props.cx, 
          cy: this.props.cy, 
          r: this.props.circleRadius, 
          fill: this.props.circleFill, 
          className: "rd3-linechart-circle"}
        )
      )
    );
  },
});
