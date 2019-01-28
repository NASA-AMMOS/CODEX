import React, { Component } from 'react';

import { SortableContainer, SortableElement, arrayMove } from 'react-sortable-hoc';
import { FaCheck, FaCaretDown } from 'react-icons/lib/fa';

import './QualityScanMasks.css';

const SortableItem = SortableElement(({ix, value, that}) => {
    return (
      <li className='QualityScanMasks_maskli' style={{zIndex: 10000, listStyleType: 'none'}}
        onWheel={(e) => that.scroll(e,ix)}
        ref={(r) => { that._refs.masklis[ix] = r; } }
        onMouseLeave={()=>that.props.setHoverMask(-1)}
        onMouseEnter={()=>that.props.setHoverMask(ix)}
      >
        <div className='header'>
          <div className='colorpalette'
            ref={(r) => { that._refs.masklispalette[ix] = r; } }
            style={{opacity: value.opacity}}
            >
            <img src={value.gradient} height='30' width='284' />
          </div>
          <div className='subheader' onClick={() => { that.check(value.name); that.choseMask(ix); }}>
            <div className='Checkbox'
              ref={(r) => that._refs.checks[value.name] = r }>
              <div><FaCheck /></div>
            </div>
            <div className='maskNames'>
              {value.name}
            </div>
          </div>
          <div className='subheader'>
            <div className='opacityslider'>
              <input type='range' min='0' max='100' step='1' defaultValue={value.opacity * 100}
                onChange={(e) => { that._refs.masklispalette[ix].style.opacity = e.target.value / 100;  that.props.setMaskOpacity( value.name, e.target.value / 100 ) } }
                onMouseUp={() => { that.props.setMaskOpacity( value.name, 'end' ) } }
              ></input>
            </div>
            <div className='toggleSettings'
              onClick={() => that.toggleSettings( value.name )}
            ><FaCaretDown /></div>
          </div>
        </div>
        <div className='maskmiddle'>
        </div>
        <div className='lisettings'>
          {that.getSettings( value.name )}
        </div>
      </li>
    );
  }
);
const SortableList = SortableContainer(({items, that}) => {
  return (
    <ul id='sortlist'>
      {items.map((value, index) => (
        <SortableItem key={`item-${index}`} ix={index} index={index} value={value} that={that} />
      ))}
    </ul>
  );
});


class QualityScanMasks extends Component {
  constructor(props) {
    super(props);

    let masks = [];
    for( let i in this.props.masks ) {
      masks.push( { name: this.props.masks[i].name, gradient: this.props.masks[i].gradient, masker: this.props.masks[i].masker, checked: true, opacity: this.props.masks[i].opacity } )
    }
    this.state = {
     masks: masks
    };

    this.vars = {
      inputValues: {},
      checkedName: ''
    }

    this._refs = {
      checks: {},
      masklis: {},
      masklispalette: {},
      options: {}
    };

    // handler bindings
    this.onSortEnd = this.onSortEnd.bind(this)
  }

  choseMask( i ) {
    for( let m in this._refs.masklis ) {
      this._refs.masklis[m].className = 'QualityScanMasks_maskli';
    }
    this._refs.masklis[i].className = 'QualityScanMasks_maskli active';
    this.props.choseMask(i);
    this.props.setQualityInfo('last');
  }
  check( name ) {
    this.vars.checkedName = name;
    for( let m in this._refs.masklis ) {
      this._refs.masklis[m].className = 'QualityScanMasks_maskli';
    }
    for( let i in this.state.masks ) {
      if( this.state.masks[i].name === name ) {
        this._refs.masklis[i].className = 'QualityScanMasks_maskli active';
        this._refs.checks[this.state.masks[i].name].className = 'Checkbox active';
      }
      else {
        this._refs.checks[this.state.masks[i].name].className = 'Checkbox';
      }
    }
  }
  scroll( e, i ) {
    let h = this._refs.masklis[i].lastChild.getBoundingClientRect().height;
    if( e.deltaY > 0 && h >= 30 )
      this._refs.masklis[i].scrollTop += 30;
    else
      this._refs.masklis[i].scrollTop -= 30;
  }
  
  toggleSettings( name ) { return;
    if( this._refs.options.hasOwnProperty( name ) ) {
      if( this._refs.options[name].main.style.display === 'flex' )
        this._refs.options[name].main.style.display = 'none';
      else
        this._refs.options[name].main.style.display = 'flex';
    }
  }
  getSettings( name ) {
    for( let m in this.props.masks ) {
      if( this.props.masks[m].name === name ) {
        return this.buildOptions( name, this.props.masks[m].inputs );
      }
    }
    return( 
      <div></div>
    );
  }

  buildOptions( name, inputs ) {
    let inputElements = [];
    if( inputs ) {
      if( !this._refs.options.hasOwnProperty( name ) )
        this._refs.options[name] = { main: null, values: [] };

      if( !this.vars.inputValues.hasOwnProperty( name ) )
        this.vars.inputValues[name] = {};

      for( let i in inputs ) {
        this.vars.inputValues[name][i] = inputs[i].value;

        if( inputs[i].type === 'range' ) {
          inputElements.push(
            <div key={i} className='option' ref={(r) => this._refs.options[name].main = r }>
              <div>{i}</div>
              <div id='value' ref={(r) => this._refs.options[name].values[i] = r }>
                {inputs[i].value}
              </div>
              <div className='range'>
                <input type='range' min={inputs[i].min} max={inputs[i].max} step={inputs[i].step} defaultValue={inputs[i].value}
                  onChange={(e) => { this.vars.inputValues[name][i] = parseFloat(e.target.value); this._refs.options[name].values[i].innerText = parseFloat(e.target.value).toFixed(2); } }
                  onMouseUp={() => { this.props.setMaskInputValue( name, i, this.vars.inputValues[name][i] ); } }
                ></input>
              </div>
            </div>
          );
        }
        else if( inputs[i].type === 'text' ) {
          inputElements.push(
            <div key={i} className='option' ref={(r) => this._refs.options[name].main = r }>
              <div>{i}</div>
              <div className='text'>
                <input type='text' defaultValue={inputs[i].value}
                  onChange={(e) => { this.vars.inputValues[name][i] = e.target.value; } }
                  onBlur={() => { this.props.setMaskInputValue( name, i, this.vars.inputValues[name][i] ); } }
                  onKeyUp={(e) => { if( e.keyCode === 13 ) { this.props.setMaskInputValue( name, i, this.vars.inputValues[name][i] ); e.target.blur(); } } }
                ></input>
              </div>
            </div>
          );
        }
      }
    }
    return inputElements;
  }

  onSortEnd = ({oldIndex, newIndex}) => {
    //Rearrange masks
    let masks = arrayMove(this.state.masks, oldIndex, newIndex);
    
    //Get and set new order
    let maskOrder = [];
    for( let i in masks ) maskOrder.push( masks[i].name );
    this.props.setMaskOrder( maskOrder );

    this.setState( { masks: masks } );
  };

  componentDidUpdate() {
    this.check( this.vars.checkedName );
  }

  render() {
    return (
      <div className='QualityScanMasks'>
        <SortableList
              items={this.state.masks}
              that={this}
              onSortEnd={this.onSortEnd}
              distance={3}
              axis={'x'}
              lockAxis={'x'}
            >
          </SortableList>
      </div>
    );
  }

}

export default QualityScanMasks;
