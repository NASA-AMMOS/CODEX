'use strict';

var React = require('react');
var shade = require('../utils').shade;
var Cell = require('./Cell');


module.exports = React.createClass({

  displayName: 'CellContainer',

  propTypes: {
    fill: React.PropTypes.string,
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
      React.createElement(Cell, React.__spread({},  
        props, 
        {fill: this.state.fill, 
        handleMouseOver: props.hoverAnimation ? this._animateCell : null, 
        handleMouseLeave: props.hoverAnimation ? this._restoreCell : null})
      )
    );
  },

  _animateCell:function() {
    this.setState({
      fill: shade(this.props.fill, 0.05)
    });
  },

  _restoreCell:function() {
    this.setState({
      fill: this.props.fill
    });
  }
});
