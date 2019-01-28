import React, { Component } from 'react';

import './QualityScanInfo.css';
import { formulas } from '../../../formulas/formulas';

import { MdClose } from 'react-icons/lib/md';

// redux
import { connect } from 'react-redux'

import { getFeatures } from '../../../../selectors/data'

class QualityScanInfo extends Component {
  constructor(props) { 
    super(props);

    this.state = {
      on: false,
      listOrRaw: 'list',
      list: {
        name: '',
        data: {}
      },
      sortBy: 1, //table column index
      sortAscending: true
    };

    this._refs = {
      optionvalues: {}
    }

    this.vars = {
      maskName: '',
      lastChangedInput: 0,
      lastVariable: null
    }
  }

  //type == 'feature' -> variable is featurelist index
  //type == 'mask' DEPRECATE
  setQualityInfo( type, maskObj, variable ) {
    if( type !== 'feature' ) return; //!OVERRIDING
    this.vars.maskName = maskObj.name;
    if( variable === 'last' )
      variable = this.vars.lastVariable;
    if( variable === null ) return;

    let newState = {
      on: true,
      listOrRaw: 'list',
    };

    if( type === 'feature' ) {
      newState.list = {};
      let featureList = getFeatures(this.props.data).toJS();
      newState.list.name = featureList[variable];
      newState.list.data = this.getFullMaskFeatureData( maskObj, newState.list.name );
    }
    else if( type === 'mask' ) {
      newState.options = {
        inputs: maskObj.inputs
      };
    }

    this.vars.lastVariable = variable;
    this.setState( newState );
  }

  /**
   * 
   * @param {string} title - table title 
   * @param {object} dataObject - { key: count, key: count, ... } 
   */
  setQualityInfoRaw( title, dataObject ) {
    let newState = {
      on: true,
      listOrRaw: 'raw'
    };
    newState.list = {};
    newState.list.name = title;
    newState.list.data = dataObject;
    this.setState( newState );
  }

  
  getFullMaskFeatureData( maskObj, featureName ) {
    let fullData = {};
    let rowNumber = this.props.data.get(0).indexOf( featureName );
    let cutoff =  (maskObj.cutoff !== undefined ) ? maskObj.cutoff : 0;
    if( rowNumber !== -1 ) {
      for( let r = 1; r < this.props.data.size; r++ ) {
        if( maskObj.masker( this.props.data.getIn([r, rowNumber]), rowNumber ) ) {
          if( fullData.hasOwnProperty(this.props.data.getIn([r, rowNumber])) )
            fullData[this.props.data.getIn([r, rowNumber])]++;
          else
            fullData[this.props.data.getIn([r, rowNumber])] = 1;
        }
      }
    }
    else {
      console.warn( 'Warning - Feature [' + featureName + '] not found.' );
    }

    //Remove any data less than or equal to cutoff
    if( cutoff > 0 ) {
      for( let i in fullData ) {
        if( fullData[i] <= cutoff )
          delete fullData[i];
      }
    }

    return fullData;
  }

  _tablizeData( data, isList ) {
    if( this.state.sortBy === 0 )
      data = formulas.sortObjectByKeys( data );
    else
      data = formulas.sortObjectByValues( data );

    let tableElements = [];
    let keys = data.keys;

    let dataLength = this.props.data.size - 1;
    let valueSum = 0;
    if( !isList ) {
      for( let c in data.values ) {
        valueSum += parseInt(data.values[c],10);
      }
    }

    let l = keys.length;
    let i;
    let that = this;
    for( let d = 0; d < l; d++ ) {
      i = d;
      if( !this.state.sortAscending ) i = l - i - 1;
      if( isList )
        tableElements.push(
          <tr key={i}
            onMouseEnter={(function(i) { return () => { that.props.highlightByValue( that.state.list.name, keys[i] ); } })(i)}
            onMouseLeave={() => { that.props.mouseLeftFeature()}}>
            <td title={keys[i]}>{keys[i]}</td>
            <td>{data.values[i]}</td>
            <td title={(data.values[i]/dataLength * 100) + '%'}>{(data.values[i]/dataLength * 100).toFixed(2) + '%'}</td>
          </tr>
        );
      else
        tableElements.push(
          <tr key={i}>
            <td title={keys[i]}>{keys[i]}</td>
            <td>{data.values[i]}</td>
            <td title={(parseFloat(data.values[i],10)/valueSum * 100) + '%'}>{(parseFloat(data.values[i],10)/valueSum * 100).toFixed(2) + '%'}</td>
          </tr>
        );
    }
    return tableElements;
  }

  sortTable( by ) {
    if( this.state.sortBy === by )
      this.setState( { sortAscending: !this.state.sortAscending } );
    else
      this.setState( { sortBy: by } );
  }

  buildOptions() {
    let inputElements = [];
    let inputs = this.state.options.inputs;
    if( inputs ) {
      for( let i in inputs ) {
        if( inputs[i].type === 'range' ) {
          inputElements.push(
            <div key={i} className='option'>
              <div>{i}</div>
              <div id='value' ref={(r) => this._refs.optionvalues[i] = r }>
                {inputs[i].value}
              </div>
              <div className='range'>
                <input type='range' min={inputs[i].min} max={inputs[i].max} step={inputs[i].step} defaultValue={inputs[i].value}
                  onChange={(e) => { this.vars.lastChangedInput = parseFloat(e.target.value); this._refs.optionvalues[i].innerText = parseFloat(e.target.value).toFixed(2); } }
                  onMouseUp={() => { this.props.setMaskInputValue( this.vars.maskName, i, this.vars.lastChangedInput ); } }
                ></input>
              </div>
            </div>
          );
        }
        else if( inputs[i].type === 'text' ) {
          inputElements.push(
            <div key={i} className='option'>
              <div>{i}</div>
              <div className='text'>
                <input type='text' defaultValue={inputs[i].value}
                  onChange={(e) => { this.vars.lastChangedInput = e.target.value; } }
                  onBlur={() => { this.props.setMaskInputValue( this.vars.maskName, i, this.vars.lastChangedInput ); } }
                  onKeyUp={(e) => { if( e.keyCode === 13 ) { this.props.setMaskInputValue( this.vars.maskName, i, this.vars.lastChangedInput ); e.target.blur(); } } }
                ></input>
              </div>
            </div>
          );
        }
      }
    }
    return inputElements;
  }

  componentDidUpdate() {
    //Update table header spacing because css doesn't like tables and height
    let tr = this._refs.tbody.children[0];
    let h = this._refs.thead.children[0];
    if( tr ) {
      let w0 = tr.children[0].getBoundingClientRect().width + 'px';
      h.children[0].style.width = w0;
      let w1 = tr.children[1].getBoundingClientRect().width + 'px';
      h.children[1].style.width = w1;
      let w2 = tr.children[2].getBoundingClientRect().width + 'px';
      h.children[2].style.width = w2;
    }
  }

  render() {
    let l = this.state.listOrRaw === 'list';
      return (
        <div className='QualityScanInfo'>
          <div className='infoHeader'>
            <div id='headertitle'>
              {(l) ? this.vars.maskName + ' - ' + this.state.list.name : this.state.list.name}
            </div>
            <div id='headerclose'
              onClick={() => { this.props.shiftInfoTable( false ) }}
            ><MdClose /></div>  
          </div>
          <div className='infoTableHeader'>
            <table cellPadding='0' cellSpacing='0' border='0'>
              <thead ref={(r) => this._refs.thead = r}>
                <tr>
                  <th onClick={() => this.sortTable(0)}>Value</th>
                  <th onClick={() => this.sortTable(1)}>Count</th>
                  <th onClick={() => this.sortTable(1)}>%</th>
                </tr>
              </thead>
            </table>
          </div>
          <div className='infoTable'>
            <table cellPadding='0' cellSpacing='0' border='0'>
              <tbody ref={(r) => this._refs.tbody = r}>
                {this._tablizeData(this.state.list.data, l)}
              </tbody>
            </table>
          </div>
        </div>
      );
  }
 
}

// redux connection
const mapStateToProps = (state) => {
	return {
		data: state.getIn(['data', 'data'])
	}
}
const mapDispatchToProps = () => ({})

export { QualityScanInfo }
export default connect(
	mapStateToProps,
	mapDispatchToProps,
  null,
  { withRef: true }
)(QualityScanInfo);
