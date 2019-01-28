import React, { Component } from 'react';
import reactCSS from 'reactcss';
import './ColorPicker.css';

class ColorPicker extends Component {
  constructor() {
    super();

    this.updateFlag = false;
    this.state = {
      displayColorPicker: false,
      color: 0,
      colors: [ 'none', '#f44336', '#9c27b0', '#3f51b5', '#03a9f4', '#009688', '#8bc34a', '#ffeb3b' ]
    };

  }

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false })
  };

  componentDidUpdate() {
    if( !this.updateFlag ) {
      if( this.props.initialColorI !== null && ( this.props.initialColorI !== this.state.color ) ) {
        this.setState( { color: this.props.initialColorI } );
      }
    }
    this.updateFlag = false;
  }

  _setColor( c ) {
    this.updateFlag = true;
    this.setState( { color: c, displayColorPicker: false } );
    if( this.props.onColorChange ) {
      this.props.onColorChange( this.state.colors[c], c );
    }
  }

  _makeColors() {
    let pickColors = [];
    for( let i = this.state.colors.length - 1; i >= 0; i-- ) {
      pickColors.push( <li className={'ColorPickerPickColors'} key={i}
                  style={{background: this.state.colors[i], boxShadow: (this.state.colors[i] === 'none') ? 'inset 0px 0px 3px #000' : 'none' }}
                  onClick={ () => this._setColor(i) }>
                 </li> );
    }
    return pickColors;
  }

  render() {

    const styles = reactCSS({
      'default': {
        color: {
          width: '36px',
          height: '36px',
          borderRadius: '18px',
          background: `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b }, ${ this.state.color.a })`,
          cursor: 'pointer'
        },
        swatch: {
          padding: '5px',
          background: '#fff',
          borderRadius: '1px',
          boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
          display: 'inline-block',
          cursor: 'pointer',
        },
        popover: {
          position: 'absolute',
          zIndex: '2',
        }
      },
    });

    return (
      <div className='ColorPicker' style={{background: this.state.colors[this.state.color]}}>
        <div id='colorPickerLabel' onClick={ this.handleClick }>
          Group
        </div>
        { this.state.displayColorPicker ? <div style={ styles.popover }>
          <ul className='container'>
            {this._makeColors()}
          </ul>
        </div> : null }
      </div>
    )
  }
}


export default ColorPicker;
