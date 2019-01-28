import React, { Component } from 'react';
import './GraphWork.css';

import { formulas } from '../../formulas/formulas';
import { getId } from '../../utils/utils';

import GenericGraph from '../GenericGraph/GenericGraph.js';

// redux!
import { connect } from 'react-redux'
import {
	selectionCreate
} from '../../../actions/data'

class GraphWork extends Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.vars = {
      type: this.props.type,
      groupId: 1,
      graphId: getId( 'graphId' ),
      windowId: this.props._RWindowManager.windowId,
      subsets: this.props.subsets || [],
      xaxis: this.props.xaxis || '',
      yaxis: this.props.yaxis || '',
      zaxis: '',
      _RWindowManager: this.props._RWindowManager || {},
    };
  }

  graphUpdater() {
    return this.vars;
  }

  changeGraph( type ) {
    /*
    if( formulas.objectArrayIndexOfKeyWithValue( controller.getGraphs(), 'type', type ) !== -1 ) {
      this.vars.type = type;
      controller.graphChanged( this.vars.id );
    }
    */
  }

  shouldComponentUpdate( nextProps ) {
    return !formulas.orderedObjectComparison( this.props, nextProps );
  }

  render() {
    return (
      <div className='GraphWork' ref={(e) => { this.componentContainer = e; }}>
        <GenericGraph
          vars={this.vars}
          changeGraph={(type) => this.changeGraph(type)}
        />
      </div>
    );
  }
}

// redux store
const mapStateToProps = state => {
	return {
    data: state.get('data')
	}
}
const mapDispatchToProps = (dispatch) => ({
	selectionCreate: (name, mask) => dispatch(selectionCreate(name, mask))
})

export { GraphWork }
export default connect(
	mapStateToProps,
	mapDispatchToProps
)(GraphWork)