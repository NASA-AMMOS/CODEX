'use strict';

var React = require('react');


module.exports = React.createClass({

  displayName: 'Label',

  propTypes: {
    height:              React.PropTypes.number,
    horizontalTransform: React.PropTypes.string,
    label:               React.PropTypes.string.isRequired,
    width:               React.PropTypes.number,
    strokeWidth:         React.PropTypes.number,
    textAnchor:          React.PropTypes.string,
    verticalTransform:   React.PropTypes.string
  },

  getDefaultProps:function() {
    return {
      horizontalTransform: 'rotate(270)',
      strokeWidth:         0.01,
      textAnchor:          'middle',
      verticalTransform:   'rotate(0)'
    };
  },

  render:function() {

    var props = this.props;

    if (props.label) {
      switch (props.orient) {
        case 'top':
          return (
            React.createElement("text", {
              strokeWidth: props.strokeWidth.toString(), 
              textAnchor: props.textAnchor, 
              transform: props.verticalTransform, 
              x: props.width / 2, 
              y: props.offset
            }, 
              props.label
            )
          );
        case 'bottom':
          return (
            React.createElement("text", {
              strokeWidth: props.strokeWidth.toString(), 
              textAnchor: props.textAnchor, 
              transform: props.verticalTransform, 
              x: props.width / 2, 
              y: props.offset
            }, 
              props.label
            )
          );
        case 'left':
          return (
            React.createElement("text", {
              strokeWidth: props.strokeWidth.toString(), 
              textAnchor: props.textAnchor, 
              transform: props.horizontalTransform, 
              y: -props.offset, 
              x: -props.height / 2
            }, 
              props.label
            )
          );
        case 'right':
          return (
            React.createElement("text", {
              strokeWidth: props.strokeWidth.toString(), 
              textAnchor: props.textAnchor, 
              transform: props.horizontalTransform, 
              y: props.offset, 
              x: -props.height / 2
            }, 
              props.label
            )
          );
      }
    }
    return React.createElement("text", null);
  }

});
