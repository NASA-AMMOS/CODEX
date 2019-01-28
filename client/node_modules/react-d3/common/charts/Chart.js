'use strict';

var React = require('react');
var LegendChart = require('./LegendChart');
var BasicChart = require('./BasicChart');

module.exports = React.createClass({

  displayName: 'Chart',

  propTypes: {
    legend:         React.PropTypes.bool,
    svgClassName:   React.PropTypes.string,
    titleClassName: React.PropTypes.string
  },

  getDefaultProps: function() {
    return {
      legend:         false,
      svgClassName:   'rd3-chart',
      titleClassName: 'rd3-chart-title'
    };
  },

  render: function() {
    var props = this.props;

    if (props.legend) {
      return (
        React.createElement(LegendChart, React.__spread({
          svgClassName: props.svgClassName, 
          titleClassName: props.titleClassName}, 
          this.props)
        )
      );
    }
    return (
      React.createElement(BasicChart, React.__spread({
        svgClassName: props.svgClassName, 
        titleClassName: props.titleClassName}, 
        this.props)
      )
    );
  }

});
