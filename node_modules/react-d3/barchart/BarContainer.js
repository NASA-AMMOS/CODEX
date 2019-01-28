'use strict';

var React = require('react');
var Bar = require('./Bar');
var shade = require('../utils').shade;

module.exports = React.createClass({displayName: "exports",

  propTypes: {
    fill: React.PropTypes.string,
  },

  getDefaultProps:function() {
    return {
      fill: '#3182BD'
    };
  },

  getInitialState:function() {
    return {
      // fill is named as fill instead of initialFill to avoid
      // confusion when passing down props from top parent
      fill: this.props.fill
    };
  },

  render:function() {

    var props = this.props;

    return (
      React.createElement(Bar, React.__spread({}, 
        props, 
        {fill: this.state.fill, 
        handleMouseOver: props.hoverAnimation ? this._animateBar : null, 
        handleMouseLeave: props.hoverAnimation ? this._restoreBar : null})
      )
    );
  },

  _animateBar:function() {
    this.setState({ 
      fill: shade(this.props.fill, 0.2)
    });
  },

  _restoreBar:function() {
    this.setState({ 
      fill: this.props.fill
    });
  },
});
