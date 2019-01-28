import React, { Component } from 'react';

import { manager } from '../RWindowManager/manager/manager';

import Import from '../Import/Import';
import Export from '../Export/Export';

import LoadingBar from '../LoadingBar/LoadingBar';

import Dropdown, {
  MenuItem
} from '@trendmicro/react-dropdown';
import { Button, ButtonGroup } from 'reactstrap';

import './TopBar.css';

import PropTypes from 'prop-types'
// redux!
import { connect } from 'react-redux'
import {
  brushClear
} from '../../../actions/data'
import {
  openGraph,
  openAlgorithm,
  openReport,
  openDevelopment,
  brushtypeSet,
  modeSet
} from '../../../actions/ui'
import {
  getGraphs, getAlgorithms, getReports
} from '../../../selectors/ui'

class TopBar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      rSelected: 2,
      brushSelected: 'freehand',
      gridSize: 0
    };

    this.vars = {
      graphs: getGraphs( this.props.ui ).toJS(),
      algorithms: getAlgorithms( this.props.ui ).toJS(),
      reports: getReports( this.props.ui ).toJS()
    }

    this.defaultBackground = '#05101f';

    this.ref = null;
    this.ref_loading = null;
    this.ref_message = null;

    this.timeout = null;

    // handler bindings
    this.setLoadingPercent = this.setLoadingPercent.bind(this)
    this.toggleIndeterminateLoading = this.toggleIndeterminateLoading.bind(this)
    this.setMessageText = this.setMessageText.bind(this)
  }

  getGraphMenuItems() {
    let menuItems = [];
    for( let g of this.vars.graphs ) {
      menuItems.push(
        <MenuItem key={g.name}
          onSelect={() => { this.props.openGraph( g.name ); }}>
          {g.name}
        </MenuItem>
      );
    }
    return menuItems;
  }

  getAlgorithmsMenuItems() {
    let menuItems = [];
    for( let a of this.vars.algorithms ) {
      menuItems.push(
        <MenuItem key={a.name}
          onSelect={() => { this.props.openAlgorithm( a.name ); }}>
          {a.name}
        </MenuItem>
      );
    }
    return menuItems;
  }

  getReportsMenuItems() {
    let menuItems = [];
    for( let r of this.vars.reports ) {
      menuItems.push(
        <MenuItem key={r.name}
          onSelect={() => { this.props.openReport( r.name ); }}>
          {r.name}
        </MenuItem>
      );
    }
    return menuItems;
  }

  onRadioBtnClick( rSelected ) {
    switch( rSelected ) {
      case 1:
          this.props.modeSet( 'zoom' );
        break;
      case 2:
          this.props.brushtypeSet( this.state.brushSelected )
          this.props.modeSet( 'select' );
        break;
      case 3:
          this.props.modeSet( 'snap' );
        break;
      default:
        break;
    }
    this.setState( { rSelected } );
  }
  setBrushSelected( eventKey ) {
    if( eventKey === 'clear' ) {
      this.props.brushClear()
    }
    else {
      this.props.brushtypeSet( eventKey );
      this.setState( { brushSelected: eventKey } );
    }
  }
  setGridSize( size ) {
    manager.setGridSizes( [ size, size ] );
    this.setState( { 'gridSize': size } );
  }

  setLoadingPercent( p ) {
    if( this.ref_loading )
      this.ref_loading.setLoadingPercent( p );
  }
  toggleIndeterminateLoading( on, message ) {
    if( this.ref_loading )
      this.ref_loading.toggleIndeterminateLoading( on, message );
  }
  setMessageText( message, status ) {
    if( this.ref && this.ref_message ) {
      this.ref_message.textContent = message;
      this.ref_message.style.opacity = 1;

      let background = this.defaultBackground;
      switch( status.toLowerCase() ) {
        case 'note':
            background = '#49baff';
          break;
        case 'warning':
            background = '#ffa749';
          break;
        case 'error':
            background = '#ff4949';
          break;
        default:
          break;
      }
      
      this.ref.style.background = background;

      clearTimeout( this.timeout );
      this.timeout = setTimeout( () => {
        this.ref_message.style.opacity = 0;
        this.ref.style.background = this.defaultBackground;
      }, 5000 );
    }
  }

  componentDidMount() {
    //controller.setMessageText = this.setMessageText;
  }

  render() {
    let devDisplay = 'inline-block';
    // Don't show the development dropdown in production mode
    if( process.env.NODE_ENV === 'production' )
      devDisplay = 'none';

    return (
      <div className='TopBar'
        ref={(r) => { this.ref = r; }}
      >
        <LoadingBar
          ref={(r) => { this.ref_loading = r; }}
        />
        <div id='topBarMenu'>

          <Dropdown
            className='dropdownMain'
            autoOpen={true}
          >
            <Dropdown.Toggle className='dropdownToggle' title='Files' />
            <Dropdown.Menu>
                <MenuItem>
                  <Import
                    setProgress={ (p) => { this.setLoadingPercent( p ); } }
                    completedLoad={ () => {} }
                  />
                </MenuItem>
                <MenuItem>
                  <Export />
                </MenuItem>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown
            className='dropdownMain'
            autoOpen={true}
          >
            <Dropdown.Toggle className='dropdownToggle' title='Graphs' />
            <Dropdown.Menu>
                {this.getGraphMenuItems()}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown
            className='dropdownMain'
            autoOpen={true}
          >
            <Dropdown.Toggle className='dropdownToggle' title='Algorithms' />
            <Dropdown.Menu>
              {this.getAlgorithmsMenuItems()}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown
            className='dropdownMain'
            autoOpen={true}
          >
            <Dropdown.Toggle className='dropdownToggle' title='Reports' />
            <Dropdown.Menu>
              {this.getReportsMenuItems()}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown
            style={{display: devDisplay}}
            className='dropdownMain'
            autoOpen={true}
          >
            <Dropdown.Toggle className='dropdownToggle' title='Development' />
            <Dropdown.Menu>
              <MenuItem 
                    onSelect={(eventKey) => { this.props.openDevelopment('nrandomscatters'); }}>
                    8 Random Scatters
              </MenuItem>
              <MenuItem 
                    onSelect={(eventKey) => { this.props.openDevelopment('sparklinerange'); }}>
                    Create range slider window
              </MenuItem>
            </Dropdown.Menu>
          </Dropdown>

          <div className='triTopLeft'></div>
        </div>
        <div id='topBarMessageText' 
          ref={(r) => { this.ref_message = r; }}></div>
        <div id='topBarTools'>

          <ButtonGroup>
            <Button className='topBarRadioSmall' onClick={() => this.onRadioBtnClick(1)} active={this.state.rSelected === 1}>Zoom</Button>
            <Button className='topBarRadioSmall'
              onClick={() => this.onRadioBtnClick(2)}
              active={this.state.rSelected === 2}>Select</Button>
            <Dropdown
              className='dropdownMain right'
              autoOpen={true}
            >
              <Dropdown.Toggle className='dropdownToggle thin' title='' />
              <Dropdown.Menu>
                  <MenuItem header>Shape</MenuItem>
                  <MenuItem active={this.state.brushSelected === 'rectangle'}
                    onSelect={(eventKey) => { this.setBrushSelected(eventKey); }}
                    eventKey={'rectangle'}>
                    Rectangle
                  </MenuItem>
                  <MenuItem active={this.state.brushSelected === 'freehand'}
                    onSelect={(eventKey) => { this.setBrushSelected(eventKey); }}
                    eventKey={'freehand'}>
                    Freehand
                  </MenuItem>
                  <MenuItem divider />
                  <MenuItem
                    onSelect={(eventKey) => { this.setBrushSelected(eventKey); }}
                    eventKey={'clear'}>
                    Clear
                  </MenuItem>
              </Dropdown.Menu>
            </Dropdown>

            <Button className='topBarRadioSmall' onClick={() => this.onRadioBtnClick(3)} active={this.state.rSelected === 3}>Snap</Button>
          </ButtonGroup>

          <Dropdown
            className='dropdownMain right'
            autoOpen={true}
          >
            <Dropdown.Toggle className='dropdownToggle' title='Grid Size' />
            <Dropdown.Menu>
              <MenuItem active={this.state.gridSize === 1}
                onSelect={(eventKey) => { this.setGridSize(eventKey); }}
                eventKey={1}>
                  1
              </MenuItem>
              <MenuItem active={this.state.gridSize === 10}
                onSelect={(eventKey) => { this.setGridSize(eventKey); }}
                eventKey={10}>
                  10
              </MenuItem>
              <MenuItem active={this.state.gridSize === 25}
                onSelect={(eventKey) => { this.setGridSize(eventKey); }}
                eventKey={25}>
                  25
              </MenuItem>
              <MenuItem active={this.state.gridSize === 50}
                onSelect={(eventKey) => { this.setGridSize(eventKey); }}
                eventKey={50}>
                  50
              </MenuItem>
              <MenuItem active={this.state.gridSize === 100}
                onSelect={(eventKey) => { this.setGridSize(eventKey); }}
                eventKey={100}>
                  100
              </MenuItem>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown
            className='dropdownMain right'
            autoOpen={true}
          >
            <Dropdown.Toggle className='dropdownToggle' title='Windows' />
            <Dropdown.Menu>
              <MenuItem header>Arrangement</MenuItem>
              <MenuItem
                onSelect={() => { manager.tweenWindows('tile') }}>
                  Tile
              </MenuItem>
              <MenuItem
                onSelect={() => { manager.tweenWindows('cascade') }}>
                  Cascade
              </MenuItem>
              <MenuItem
                onSelect={() => { manager.tweenWindows('horizontal') }}>
                  Horizontal
              </MenuItem>
              <MenuItem
                onSelect={() => { manager.tweenWindows('vertical') }}>
                  Vertical
              </MenuItem>
              <MenuItem header>Select</MenuItem>
              <MenuItem
                onSelect={() => { manager.embraceAll(0); }}>
                  Select All
              </MenuItem>
              <MenuItem
                onSelect={() => { manager.unembraceAll(0); }}>
                  Deselect All
              </MenuItem>
              <MenuItem
                onSelect={() => { manager.invertEmbrace(0); }}>
                  Invert Selected
              </MenuItem>
              <MenuItem
                onSelect={() => { manager.unsnapAllEmbracedWindows(); }}>
                  Unsnap Selected
              </MenuItem>
              <MenuItem
                onSelect={() => { manager.minimizeAllEmbraced(0); }}>
                  Minimize Selected
              </MenuItem>
              <MenuItem
                onSelect={() => { manager.removeAllEmbraced(0); }}>
                  Close Selected
              </MenuItem>
              <MenuItem header>Grouping</MenuItem>
              <MenuItem
                onSelect={() => { manager.groupEmbraced(0); }}>
                  Group
              </MenuItem>
              <MenuItem header>State</MenuItem>
              <MenuItem
                onSelect={() => { manager.showAll(0); }}>
                  Show All
              </MenuItem>
              <MenuItem
                onSelect={() => { manager.minimizeAll(0); }}>
                  Minimize All
              </MenuItem>
              <MenuItem
                onSelect={() => { manager.removeAll(0); }}>
                  Close All
              </MenuItem>
            </Dropdown.Menu>
          </Dropdown>

          <div className='triTopRight'></div>
        </div>
      </div>
    );
  }
}

// validation
TopBar.propTypes = {
  brushClear: PropTypes.func.isRequired,
  openGraph: PropTypes.func.isRequired,
  openAlgorithm: PropTypes.func.isRequired,
  openReport: PropTypes.func.isRequired,
  brushtypeSet: PropTypes.func.isRequired,
  modeSet: PropTypes.func.isRequired
}

// redux store
const mapStateToProps = state => {
	return {
    data: state.get('data'),
    ui: state.get('ui')
	}
}
const mapDispatchToProps = (dispatch) => ({
  brushClear: () => dispatch(brushClear()),
  openGraph: (d,n,x,y,s,r) => dispatch(openGraph(d,n,x,y,s,r)),
  openAlgorithm: (d,n,w,h) => dispatch(openAlgorithm(d,n,w,h)),
  openReport: (d,n,w,h) => dispatch(openReport(d,n,w,h)),
  openDevelopment: (d,n) => dispatch(openDevelopment(d,n)),
  brushtypeSet: (t) => dispatch(brushtypeSet(t)),
  modeSet: (m) => dispatch(modeSet(m))
})

function mergeProps(propsFromState, propsFromDispatch, ownProps) {
  return {
    ui: propsFromState.ui,
    brushClear: () => { propsFromDispatch.brushClear() },
    openGraph: (name, xaxis, yaxis, selections, randomFeatures) => { propsFromDispatch.openGraph(propsFromState.data, name, xaxis, yaxis, selections, randomFeatures) },
    openAlgorithm: (name, width, height) => { propsFromDispatch.openAlgorithm(propsFromState.data, name, width, height) },
    openReport: (name, width, height) => { propsFromDispatch.openReport(propsFromState.data, name, width, height) },
    openDevelopment: (name) => { propsFromDispatch.openDevelopment(propsFromState.data, name) },
    brushtypeSet: (brushtype) => { propsFromDispatch.brushtypeSet(brushtype) },
    modeSet: (mode) => { propsFromDispatch.modeSet(mode) }
  }
}

export { TopBar }
export default connect(
	mapStateToProps,
  mapDispatchToProps,
  mergeProps
)(TopBar)