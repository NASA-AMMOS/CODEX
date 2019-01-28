import React, { Component } from 'react';

import './StringSlider.css';

import { controller } from '../../Controller/controller';

class StringSlider extends Component {

  handleChange( v ) {
    controller.setNameSubstart( v );
  }

  render() {
    return (
      <div className='StringSlider'>
        <input type='range'
          onChange={ (e) => this.handleChange( e.target.value ) }
        />
      </div>
    );
  }
}

export default StringSlider;
