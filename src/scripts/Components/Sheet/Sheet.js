import React, { Component } from 'react';
import './Sheet.css';
import HotTable from 'react-handsontable';

import { model } from '../../Model/model.js';

class Sheet extends Component {
  constructor( props ) {
    super( props );
    
    if( model.getActiveModel() ) {
      this.handsontableData = model.getActiveModel().data;
    }

    this.state = {
      width: 1,
      height: 1
    }
  }

  updateDimensions() {
    if( this.divElement ) {
      this.setState({ width: this.divElement.clientWidth, height: this.divElement.clientHeight });
    }
  }

  componentDidMount() {
    this.updateDimensions();
    window.addEventListener( 'resize', this.updateDimensions.bind(this) );
  }
  componentWillUnmountfunction() {
    window.removeEventListener( 'resize', this.updateDimensions.bind(this) );
  }

  render() {
    return (
      <div className='Sheet' ref={ (divElement) => this.divElement = divElement}>
        <HotTable root='ho' data={this.handsontableData}
                  colHeaders={true} rowHeaders={true}
                  width={this.state.width} height={this.state.height}
                  strechW='all' stretchH='all'
                  copyPaste={false} />
      </div>
    );
  }
}

export default Sheet;
