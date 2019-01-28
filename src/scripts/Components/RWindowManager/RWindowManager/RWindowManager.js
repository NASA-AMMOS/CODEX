import React, { Component } from 'react';
import './RWindowManager.css';

import { manager } from '../manager/manager';

import Windows from '../Windows/Windows';
import Taskbar from '../Taskbar/Taskbar';

import Bezier from 'bezier-js';

class RWindowManager extends Component {
  constructor() {
    super();
    this.wmId = manager.subscribe( this );
    this.WindowsComponent = null; //Unused?
    this.nextWindowId = 0;
    this.windows = {};
    this.groups = {};
    this.mousePos = [0,0];

    this.Taskbar = null;
  }

  addWindow( config ) {
    let newWindows = Object.assign( {}, this.windows );

    let nextId = this._getNextWindowId();
    //Attach additional fields to config
    config._ = {
      id: nextId,
      state: 'normal', //'normal', 'minimized', 'maximized'
      zIndex: manager.findHighestZIndex( this.wmId ) + 1,
      stateVars: {},
      snap: {
        isSnapped: false,
        edge: null,
        parentId: null,
        parentEdge: null
      },
      taskBarUpdatesNeeded: {
        thumbnail: true,
        state: true
      },
      embrace: {
        isEmbraced: false,
        group: -1
      }
    };
    
    config.props._RWindowManager = {};
    config.props._RWindowManager.managerId = this.wmId;
    config.props._RWindowManager.windowId = nextId;
    
    //Replace initial dimensions for full
    if( config.initialWidth === '100%' || config.initialHeight === '100%' ) {
      let rect = this._ref.getBoundingClientRect();
      if( config.initialWidth === '100%' ) config.initialWidth = rect.width;
      if( config.initialHeight === '100%' ) config.initialHeight = rect.height - 56; //56 for taskbar
    }

    newWindows[nextId] = config;
    this.windows = newWindows;
    manager.refresh( this.wmId, 500 );
  }

  setWindowState( id, stateName, state, stopRefresh ) {
    let newWindows = Object.assign( {}, this.windows );
    for( let w in newWindows ) {
      if( newWindows[w]._.id === id ) {
        newWindows[w]._.state = stateName || newWindows[w]._.state;
  
        if( state ) {
          for( let s in state ) {
            newWindows[w]._.stateVars[s] = state[s];
          }
        }

        newWindows[w]._.taskBarUpdatesNeeded.state = true;
        break;
      }
    }

    this.windows = newWindows;
    if( !stopRefresh ) 
      manager.refresh( this.wmId );
  }

  minimizeAllEmbraced() {
    for( let w in this.windows ) {
      this.setWindowState( this.windows[w]._.id, 'minimize', null, true );
    }
    manager.refresh( this.wmId );
  }
  removeAllEmbraced() {
    for( let w in this.windows ) {
      if( this.windows[w]._.embrace.isEmbraced )
        this.removeWindow( this.windows[w]._.id, false, true );
    }
    this.clearBlankGroupHandles();
    manager.refresh( this.wmId );
  }

  removeWindow( id, idIsGroup, stopRefresh ) {
    let newWindows = Object.assign( {}, this.windows );

    for( let w in newWindows ) {
      if( idIsGroup ) {
        if( newWindows[w]._.embrace.group === id ) {
          delete newWindows[w];
          manager.removeWindowFunctions( w, this.wmId );
        }
      }
      else if( newWindows[w]._.id === id ) {
        delete newWindows[w];
        manager.removeWindowFunctions( w, this.wmId );
        break;
      }
    }

    this.windows = newWindows;
    
    if( !stopRefresh ) 
      manager.refresh( this.wmId );
  }

  updatePath() {
    if( this.ref_path ) {
      let elm = document.getElementById( 'RWindowManager_svgunderlay_path' ); //eww
      if( manager.snap.path.on ) {
        elm.setAttribute( 'd',
          new Bezier( manager.snap.path.start.x,manager.snap.path.start.y ,
            ( manager.snap.path.start.x + manager.snap.path.end.x ) / 2,manager.snap.path.start.y ,
            ( manager.snap.path.start.x + manager.snap.path.end.x ) / 2,manager.snap.path.end.y ,
            manager.snap.path.end.x,manager.snap.path.end.y )
            .toSVG()
        );
      }
      else {
        elm.setAttribute( 'd', '' );
      }
    }
  }

  snapWindowToWindow( id1, edge1, id2, edge2 ) {
    if( edge1 === 'left' && edge2 === 'top' ) return;
    if( edge1 === 'left' && edge2 === 'bottom' ) return;
    if( edge1 === 'right' && edge2 === 'top' ) return;
    if( edge1 === 'right' && edge2 === 'bottom' ) return;
    if( edge1 === 'top' && edge2 === 'left' ) return;
    if( edge1 === 'top' && edge2 === 'right' ) return;
    if( edge1 === 'bottom' && edge2 === 'left' ) return;
    if( edge1 === 'bottom' && edge2 === 'right' ) return;

    this.windows[id1]._.snap.isSnapped = true;
    this.windows[id1]._.snap.edge = edge1;
    this.windows[id1]._.snap.parentId = id2;
    this.windows[id1]._.snap.parentEdge = edge2;
    manager.refresh( this.wmId );
  }

  setMousePosition( e ) {
    let r = this._ref.getBoundingClientRect();
    this.mousePos = [e.clientX - r.x, e.clientY - r.y];
    manager.drawPath();
  }

  embraceAll( wmId = 0 ) {
    for( let w in this.windows ) {
      this.windows[w]._.embrace.isEmbraced = true;
      manager.wms[wmId]._context[this.windows[w]._.id].embrace( true );
    }
  }
  unembraceAll( wmId = 0 ) {
    for( let w in this.windows ) {
      this.windows[w]._.embrace.isEmbraced = false;
      manager.wms[wmId]._context[this.windows[w]._.id].embrace( false );
    }
  }
  invertEmbrace( wmId = 0 ) {
    for( let w in this.windows ) {
      this.windows[w]._.embrace.isEmbraced = !this.windows[w]._.embrace.isEmbraced;
      manager.wms[wmId]._context[this.windows[w]._.id].embrace( this.windows[w]._.embrace.isEmbraced );
    }
  }
  embraced( isEmbraced, id ) {
    if( this.windows[id] ) {
      this.windows[id]._.embrace.isEmbraced = isEmbraced;
    }
  }
  getAllEmbracedIds() {
    let ids = [];
    for( let w in this.windows ) {
      if( this.windows[w]._.embrace.isEmbraced ) {
        ids.push( w );
      }
    }
    return ids;
  }
  getAllUsedGroups() {
    let groups = [];
    for( let w in this.windows ) {
      groups.push( this.windows[w]._.embrace.group );
    }
    return groups;
  }
  getNextFreeGroup() {
    let groups = [];
    for( let w in this.windows ) {
        groups.push( this.windows[w]._.embrace.group );
    }
    let nextGroup = 0;
    while( groups.indexOf( nextGroup ) !== -1 )
      nextGroup++;
    return nextGroup; 
  }
  groupEmbraced() {
    let ids = this.getAllEmbracedIds();
    if( ids.length > 0 ) {
      let groupXY = [0,0];
      for( let id in ids ) {
        this.windows[ids[id]]._.embrace.group = -1; //clear group for now
        groupXY[0] += this.windows[ids[id]]._.stateVars.x + ( this.windows[ids[id]]._.stateVars.width / 2 );
        groupXY[1] += this.windows[ids[id]]._.stateVars.y + ( this.windows[ids[id]]._.stateVars.height / 2 );
      }
      groupXY[0] = parseInt( groupXY[0] / ids.length );
      groupXY[1] = parseInt( groupXY[1] / ids.length );

      this.clearBlankGroupHandles();
      let groupId = this.getNextFreeGroup();
      for( let id in ids ) {
        this.windows[ids[id]]._.embrace.group = groupId;
        this.windows[ids[id]]._.taskBarUpdatesNeeded.state = true;
      }
      this.makeGroupHandle( groupId, groupXY[0], groupXY[1] );
    }
  }
  makeGroupHandle( groupId, x, y ) {
    this.groups[groupId] = { groupId: groupId, x: x, y: y };
    manager.refresh( this.wmId );
  }
  removeGroupHandle( groupId, stopRefresh ) {
    //Remove the group
    for( let g in this.groups ) {
      if( this.groups[g].groupId === groupId ) {
        delete this.groups[g];
      }
    }
    //Remove all window links to that group
    for( let w in this.windows ) {
      if( this.windows[w]._.embrace.group === groupId ) {
        this.windows[w]._.embrace.group = -1;
        this.windows[w]._.taskBarUpdatesNeeded.state = true;
      }
    }
    if( !stopRefresh ) 
      manager.refresh( this.wmId );
  }
  removeFromGroup( id ) {
    for( let w in this.windows ) {
      if( this.windows[w]._.id === id ) {
        this.windows[w]._.embrace.group = -1;
        this.windows[w]._.taskBarUpdatesNeeded.state = true;
      }
    }

    this.clearBlankGroupHandles();
    manager.refresh( this.wmId );
  }
  removeGroupWithWindows( groupId ) {
    this.removeWindow( groupId, true, true );
    this.removeGroupHandle( groupId );
  }

  clearBlankGroupHandles() {
    let usedGroups = this.getAllUsedGroups();
    for( let g in this.groups ) {
      if( usedGroups.indexOf( this.groups[g].groupId ) === -1 ) {
        delete this.groups[g];
      }
    }
  }
  shiftGroup( groupId, shiftX, shiftY ) {
    //Find all windows with groupId
    for( let w in this.windows ) {
      if( this.windows[w]._.embrace.group === groupId ) {
        this._shiftPosition[w]( shiftX, shiftY );
      }
    }
  }
  minimizeGroup( groupId ) {
    for( let w in this.windows ) {
      if( this.windows[w]._.embrace.group === groupId ) {
        this.setWindowState( this.windows[w]._.id, 'minimize', null, true );
      }
    }
    manager.refresh( this.wmId );
  }
  minimizeAll() {
    for( let w in this.windows ) { 
      this.setWindowState( this.windows[w]._.id, 'minimize', null, true );
    }
    manager.refresh( this.wmId );
  }
  showAll() {
    for( let w in this.windows ) { 
      this.setWindowState( this.windows[w]._.id, 'normal', null, true );
    }
    manager.refresh( this.wmId );
  }
  removeAll() {
    for( let w in this.windows ) { 
      this.removeWindow( this.windows[w]._.id, false, true );
    }
    
    this.clearBlankGroupHandles();
    manager.refresh( this.wmId );
  }

  getNumberOfWindows() {
    return Object.keys(this.windows).length;
  }
  getWindowPosition( id ) {
    return this.windows[id]._.stateVars;
  }

  _getNextWindowId() {
    return this.nextWindowId++;
  }

  render() {
    return (
      <div className='RWindowManager' ref={(r) => { this._ref = r; }}
        onMouseMove={(e) => { this.setMousePosition(e); }}
        >
        <div id='RWindowManager_windowcont'>
          <Windows ref={(r) => { this.WindowsComponent = r; }}
            wmId={this.wmId}
          />
          <svg id='RWindowManager_svgunderlay'>
            <path id='RWindowManager_svgunderlay_path' ref={(r) => { this.ref_path = r; } } d="" stroke="rgba(255,255,255,0.9)" strokeWidth="3" fill="none" />
          </svg>
        </div>
        <div id='RWindowManager_taskbarcont'>
          <Taskbar ref={(r) => { this.Taskbar = r; } }
            wmId={this.wmId}
          />
        </div>
      </div>
    );
  }
}

export default RWindowManager;