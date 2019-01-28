'use strict';

var React = require('react');
var mixins = require('../../mixins');

module.exports = React.createClass({

  displayName: 'BasicChart',

  propTypes: {
    children:       React.PropTypes.node,
    className:      React.PropTypes.string,
    height:         React.PropTypes.node,
    svgClassName:   React.PropTypes.string,
    title:          React.PropTypes.node,
    titleClassName: React.PropTypes.string,
    width:          React.PropTypes.node
  },

  getDefaultProps:function() {
    return {
      className:      'rd3-basic-chart',
      svgClassName:   'rd3-chart',
      titleClassName: 'rd3-chart-title'
    };
  },

  _renderTitle:function() {
    var props = this.props;

    if (props.title != '' && props.title != null) {
      return (
        React.createElement("h4", {
          className: props.titleClassName
        }, 
          props.title
        )
      );
    } else {
      return null;
    }
  },

  _renderChart: function() {
    var props = this.props;

    return (
      React.createElement("svg", {
        className: props.svgClassName, 
        height: props.height, 
        viewBox: props.viewBox, 
        width: props.width
      }, 
        props.children
      )
    );
  },

  render: function() {
    var props = this.props;

    return (
      React.createElement("div", {
        className: props.className
      }, 
        this._renderTitle(), 
        this._renderChart()
      )
    );
  }
});
