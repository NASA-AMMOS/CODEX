'use strict';

var React = require('react');
var d3 = require('d3');
var utils = require('../utils');
var DataSeries = require('./DataSeries');
var $__0=      require('../common'),Chart=$__0.Chart,XAxis=$__0.XAxis,YAxis=$__0.YAxis;

module.exports = React.createClass({

  displayName: 'CandleStickChart',

  propTypes: {
    data:              React.PropTypes.oneOfType([
                         React.PropTypes.array,
                         React.PropTypes.object
                       ]),
    fillUp:            React.PropTypes.func,
    fillUpAccessor:    React.PropTypes.func,
    fillDown:          React.PropTypes.func,
    fillDownAccessor:  React.PropTypes.func,
    height:            React.PropTypes.number,
    hoverAnimation:    React.PropTypes.bool,
    title:             React.PropTypes.string,
    xAccessor:         React.PropTypes.func,
    xAxisFormatter:    React.PropTypes.func,
    xAxisTickInterval: React.PropTypes.object,
    xAxisTickValues:   React.PropTypes.array,
    yAccessor:         React.PropTypes.func,
    yAxisFormatter:    React.PropTypes.func,
    yAxisTickCount:    React.PropTypes.number,
    yAxisTickValues:   React.PropTypes.array,
    width:             React.PropTypes.number,
  },

  getDefaultProps:function() {
    return {
      className:        'rd3-candlestick',
      xAxisClassName:   'rd3-candlestick-xaxis',
      yAxisClassName:   'rd3-candlestick-yaxis',
      data:             [],
      fillUp:           function(value)  {return '#ffffff';},
      fillUpAccessor:   function(d, idx)  {return idx;},
      fillDown:         d3.scale.category20c(),
      fillDownAccessor: function(d, idx)  {return idx;},
      height:           200,
      hoverAnimation:   true,
      margins:          {top: 10, right: 20, bottom: 30, left: 45},
      legendOffset:     120,
      title:            '',
      xAccessor:        function(d)  {return d.x;},
      yAccessor:        function(d)  {return { open: d.open, high: d.high, low: d.low, close: d.close };},
      width:            400,
    };
  },

  render:function() {

    var props = this.props;

    // Calculate inner chart dimensions
    var innerWidth, innerHeight;
    innerWidth = props.width - props.margins.left - props.margins.right;
    innerHeight = props.height - props.margins.top - props.margins.bottom;

    if (!Array.isArray(props.data)) {
      props.data = [props.data];
    }
    var flattenedData = utils.flattenData(props.data, props.xAccessor, props.yAccessor);

    var allValues = flattenedData.allValues,
        xValues = flattenedData.xValues,
        yValues = flattenedData.yValues;
    var scales = utils.calculateScales(innerWidth, innerHeight, xValues, yValues);

    var trans = ("translate(" + ( props.yAxisOffset < 0 ? props.margins.left + Math.abs(props.yAxisOffset) : props.margins.left) + "," +  props.margins.top + ")");

    var dataSeries = props.data.map( function(series, idx)  {
      return (
          React.createElement(DataSeries, {
            key: idx, 
            seriesName: series.name, 
            index: idx, 
            xScale: scales.xScale, 
            yScale: scales.yScale, 
            data: series.values, 
            fillUp: props.fillUp(props.fillUpAccessor(series, idx)), 
            fillDown: props.fillDown(props.fillDownAccessor(series, idx)), 
            xAccessor: props.xAccessor, 
            yAccessor: props.yAccessor, 
            hoverAnimation: props.hoverAnimation}
          )
        );
      });

    return (
      React.createElement(Chart, {
        viewBox: props.viewBox, 
        width: props.width, 
        height: props.height, 
        margins: props.margins, 
        title: props.title
      }, 
        React.createElement("g", {transform: trans, className: props.className}, 
          React.createElement(XAxis, {
            xAxisClassName: props.xAxisClassName, 
            xScale: scales.xScale, 
            xAxisTickValues: props.xAxisTickValues, 
            xAxisTickInterval: props.xAxisTickInterval, 
            xAxisOffset: props.xAxisOffset, 
            tickFormatting: props.xAxisFormatter, 
            xAxisLabel: props.xAxisLabel, 
            xAxisLabelOffset: props.xAxisLabelOffset, 
            xOrient: props.xOrient, 
            yOrient: props.yOrient, 
            margins: props.margins, 
            width: innerWidth, 
            height: innerHeight, 
            gridVertical: props.gridVertical, 
            gridVerticalStroke: props.gridVerticalStroke, 
            gridVerticalStrokeWidth: props.gridVerticalStrokeWidth, 
            gridVerticalStrokeDash: props.gridVerticalStrokeDash}
          ), 
          React.createElement(YAxis, {
            yAxisClassName: props.yAxisClassName, 
            yScale: scales.yScale, 
            yAxisTickValues: props.yAxisTickValues, 
            yAxisOffset: props.yAxisOffset, 
            yAxisTickCount: props.yAxisTickCount, 
            tickFormatting: props.yAxisFormatter, 
            yAxisLabel: props.yAxisLabel, 
            yAxisLabelOffset: props.yAxisLabelOffset, 
            xOrient: props.xOrient, 
            yOrient: props.yOrient, 
            margins: props.margins, 
            width: innerWidth, 
            height: props.height, 
            gridHorizontal: props.gridHorizontal, 
            gridHorizontalStroke: props.gridHorizontalStroke, 
            gridHorizontalStrokeWidth: props.gridHorizontalStrokeWidth, 
            gridHorizontalStrokeDash: props.gridHorizontalStrokeDash}
          ), 
          dataSeries
        )
      )
    );
  }

});
