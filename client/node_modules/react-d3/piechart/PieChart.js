'use strict';

var d3 = require('d3');
var React = require('react');
var DataSeries = require('./DataSeries');
var Chart = require('../common').Chart;

module.exports = React.createClass({

  displayName: 'PieChart',

  propTypes: {
    data:               React.PropTypes.array,
    radius:             React.PropTypes.number,
    cx:                 React.PropTypes.number,
    cy:                 React.PropTypes.number,
    labelTextFill:      React.PropTypes.string,
    valueTextFill:      React.PropTypes.string,
    valueTextFormatter: React.PropTypes.func,
    colors:             React.PropTypes.func,
    colorAccessor:      React.PropTypes.func,
    title:              React.PropTypes.string,
    showInnerLabels:    React.PropTypes.bool,
    showOuterLabels:    React.PropTypes.bool,
    sectorBorderColor:  React.PropTypes.string,
    hoverAnimation:     React.PropTypes.bool
  },

  getDefaultProps: function() {
    return {
      data:               [],
      title:              '',
      colors:             d3.scale.category20c(),
      colorAccessor:      function(d, idx)  {return idx;},
      valueTextFormatter: function(val)  {return ( val + "%");},
      hoverAnimation:     true
    };
  },

  render: function() {
    var props = this.props;

    var transform = ("translate(" + ( props.cx || props.width/2) + "," + ( props.cy || props.height/2) + ")");

    var values = props.data.map( function(item)  {return item.value;} );
    var labels = props.data.map( function(item)  {return item.label;} );

    return (
      React.createElement(Chart, {
        width: props.width, 
        height: props.height, 
        title: props.title
      }, 
        React.createElement("g", {className: "rd3-piechart"}, 
          React.createElement(DataSeries, {
            labelTextFill: props.labelTextFill, 
            valueTextFill: props.valueTextFill, 
            valueTextFormatter: props.valueTextFormatter, 
            data: props.data, 
            values: values, 
            labels: labels, 
            colors: props.colors, 
            colorAccessor: props.colorAccessor, 
            transform: transform, 
            width: props.width, 
            height: props.height, 
            radius: props.radius, 
            innerRadius: props.innerRadius, 
            showInnerLabels: props.showInnerLabels, 
            showOuterLabels: props.showOuterLabels, 
            sectorBorderColor: props.sectorBorderColor, 
            hoverAnimation: props.hoverAnimation}
          )
        )
      )
    );
  }

});
