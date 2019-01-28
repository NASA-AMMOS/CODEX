import React, { Component } from 'react';
import './HoverableFS.css';

import IPropTypes from 'react-immutable-proptypes'
// redux!
import { connect } from 'react-redux'
import {
  getSelectedFeatures,
  getActiveSelectionNames
} from '../../../selectors/data'

class HoverableFS extends Component {
  constructor(props) {
    super(props);

    this.state = {
      chosenFeatures: [],
      chosenSelections: []
    };

    this.chosenFeatures = getSelectedFeatures( this.props.data ).toJS();
    this.chosenSelections = getActiveSelectionNames( this.props.data ).map( s => s.get('name')).toJS();

    this.uglytempflag = false;
  }
  

  makeChosenFeaturesList() {
    let f = [];
    for( let i in this.chosenFeatures ) {
      f.push( <li key={i}>{this.chosenFeatures[i]}</li> );
    }
    return f;
  }
  makeChosenSelectionsList() {
    let s = [];
    for( let i in this.chosenSelections ) {
      s.push( <li key={i}>{this.chosenSelections[i]}</li> );
    }
    return s;
  }

  onEnter() {
    if( this.refF && this.refS ) {
      let m = Math.max( this.chosenFeatures.length, this.chosenSelections.length );
      m *= 26;
      if( m > 156 ) {
        this.refF.style.overflow = 'scroll';
        this.refS.style.overflow = 'scroll';
      }
      this.refF.style.height = m + 'px';
      this.refS.style.height = m + 'px';
    }
  }
  onLeave() {
    if( this.refF && this.refS ) {
      this.refF.style.overflow = 'hidden';
      this.refS.style.overflow = 'hidden';
      this.refF.style.height = '0px';
      this.refS.style.height = '0px';
    }
  }

  componentDidMount() {
    this.onLeave();
  }

  //ugly
  componentWillReceiveProps() {
    this.uglytempflag = true;
  }
  componentDidUpdate() {
    this.chosenFeatures = getSelectedFeatures( this.props.data ).toJS();
    this.chosenSelections = getActiveSelectionNames( this.props.data ).map( s => s.get('name')).toJS();
    if( this.uglytempflag )
      this.forceUpdate();
    this.uglytempflag = false;
  }

  render() {
    let featureString = 'Features';
    if( this.chosenFeatures == 1 ) featureString = 'Feature';
    let selectionString = 'Selections';
    if( this.chosenSelections.length == 1 ) selectionString = 'Selection';

    return (
      <div className='HoverableFS'
        onMouseEnter={() => this.onEnter()}
        onMouseLeave={() => this.onLeave()}>
        <div className='selectedFS'>
          <div className='selectedF'>
            <div className='selectedHeader'><span>{this.chosenFeatures.length}</span> <span>{featureString}</span></div>
            <ul className='selectedCollapse'
              ref={(r) => { this.refF = r; }}>
              {this.makeChosenFeaturesList()}
            </ul>
          </div>
          <div className='selectedS'>
            <div className='selectedHeader'><span>{this.chosenSelections.length}</span> <span>{selectionString}</span></div>
            <ul className='selectedCollapse'
              ref={(r) => { this.refS = r; }}>
              {this.makeChosenSelectionsList()}
            </ul>
          </div>
        </div>
      </div>
    );
  }
}

// validation
HoverableFS.propTypes = {
	// reference to current data
  data: IPropTypes.map.isRequired,
}

// redux store
const mapStateToProps = state => {
	return {
    data: state.get('data'),
    ui: state.get('ui')
	}
}
const mapDispatchToProps = (dispatch) => ({
})

export { HoverableFS }
export default connect(
	mapStateToProps,
  mapDispatchToProps,
  null,
  { withRef: true }
)(HoverableFS)