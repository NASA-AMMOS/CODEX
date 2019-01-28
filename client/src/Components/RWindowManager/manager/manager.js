export default class Manager {
  constructor() {
    this.components = {};
    this.wms = {}; //WindowManagerS
    this.nextWindowManagerId = 0;

    this.snap = {
      on: false,
      path: {
        on: false,
        start: {
          x: 0,
          y: 0,
          meta: {
            wmId: '',
            id: '',
            edge: ''
          } 
        },
        end: {
          x: 0,
          y: 0,
          meta: {
            wmId: '',
            id: '',
            edge: ''
          }
        }
      }
    };

    this.colorPalette = [ '#f5173e', '#f58319', '#d4f519', '#41f519', '#19f583', '#1941f5', '#8319f5', '#f519d4' ];

    this.gridSize = [1,1];

    // create bindings
    this.onAddWindow = this.onAddWindow.bind(this)
    this.onRemoveWindow = this.onRemoveWindow.bind(this)
  }
  
  subscribe( context ) {
    let nextId = this._getNextWindowManagerId();
    this.wms[nextId] = context;
    
    this.wms[nextId]._context = {};
    this.wms[nextId]._refreshWindow = {};
    this.wms[nextId]._unfocusWindow = {};
    this.wms[nextId]._focusWindow = {};
    this.wms[nextId]._centerWindow = {};
    this.wms[nextId]._maximizeWindow = {};
    this.wms[nextId]._setGridSize = {};
    this.wms[nextId]._tweenTo = {};
    this.wms[nextId]._shiftPosition = {};
    
    return nextId;
  }
  subscribeWindow( context ) {
    this.wms[context.wmId]._context[context.id] = context;
    this.wms[context.wmId]._refreshWindow[context.id] = context.refresh;
    this.wms[context.wmId]._unfocusWindow[context.id] = context.unfocus;
    this.wms[context.wmId]._focusWindow[context.id] = context.focus;
    this.wms[context.wmId]._centerWindow[context.id] = context.center;
    this.wms[context.wmId]._maximizeWindow[context.id] = context.maximize;
    this.wms[context.wmId]._setGridSize[context.id] = context.setGridSize;
    this.wms[context.wmId]._tweenTo[context.id] = context.tweenTo;
    this.wms[context.wmId]._shiftPosition[context.id] = context.shiftPosition;
  }
  subscribeWindows( context ) {
    this.wms[context.wmId]._refreshWindows = context.refresh;
  }
  subscribeTaskbar( context ) {
    this.wms[context.wmId]._refreshTaskbar = context.refresh;
  }
  subscribeComponent( name, component ) {
    this.components[name] = component;
  }

  getComponent( name ) {
    return this.components[name];
  }
  getWMS( wmId = 0 ) {
    return this.wms[wmId];
  }

  getRect() {
    return document.getElementsByClassName( 'Windows' )[0].getBoundingClientRect();
  }

  // stubs
  onAddWindow() {}
  onRemoveWindow() {}

  addWindow( config, wmId = 0 ) {
    if( this.wms.hasOwnProperty( wmId ) ) {
      this.wms[wmId].addWindow( config );
      this.onAddWindow();
    }
    else if( process.env.NODE_ENV !== 'test' )
      console.warn( 'Manager failed to add a new window. RWindowManager might not have initialized.' )
  }
  focusWindow( id, groupId = -1, wmId = 0 ) {
    //Change colors to make focused window pop
    for( let i in this.wms[wmId]._unfocusWindow ) {
      this.wms[wmId]._unfocusWindow[i]();
    }

    //Bring group to top
    if( groupId >= 0 ) {
      for( let i in this.wms[wmId].windows ) {
        if( this.wms[wmId].windows[i]._.embrace.isEmbraced &&
            this.wms[wmId].windows[i]._.embrace.group === groupId )
        if( this.wms[wmId]._focusWindow[i] )
          this.wms[wmId]._focusWindow[i](true);
      }
    }

    //Bring window to top
    if( this.wms[wmId]._focusWindow[id] )
      this.wms[wmId]._focusWindow[id]();

    //Highlight in taskbar\
    if( this.wms[wmId].Taskbar )
      this.wms[wmId].Taskbar.highlightThumbnail( id );
  }
  unsnapWindow( id, wmId = 0 ) {
    this.wms[wmId].windows[id]._.snap.isSnapped = false;
    setTimeout( () => {
      this.refresh();
    }, 300 );
  }
  normalizeWindow( id, wmId = 0 ) {
    this.wms[wmId].setWindowState( id, 'normal' );
  }
  centerWindow( id, wmId = 0 ) {
    if( this.wms[wmId]._centerWindow[id] )
      this.wms[wmId]._centerWindow[id]();
  }
  maxmizeWindow( id, wmId = 0 ) {
    if( this.wms[wmId]._maximizeWindow[id] )
      this.wms[wmId]._maximizeWindow[id]();
  }
  minimizeWindow( id, state, wmId = 0 ) {
    this.wms[wmId].setWindowState( id, 'minimize', state );
  }
  minimizeAllEmbraced( wmId = 0 ) {
    this.wms[wmId].minimizeAllEmbraced();
  }
  removeAllEmbraced( wmId = 0 ) {
    this.wms[wmId].removeAllEmbraced();
  }
  setWindowState( id, stateName, state, wmId = 0 ) {
    this.wms[wmId].setWindowState( id, stateName, state );
  }
  removeWindow( id, wmId = 0 ) {
    this.wms[wmId].removeWindow( id );
    this.onRemoveWindow( id );
  }
  removeWindowFunctions( id, wmId = 0 ) {
    //Clean this up later. Really only need _context
    delete this.wms[wmId]._context[id];
    delete this.wms[wmId]._refreshWindow[id];
    delete this.wms[wmId]._unfocusWindow[id];
    delete this.wms[wmId]._focusWindow[id];
    delete this.wms[wmId]._centerWindow[id];
    delete this.wms[wmId]._maximizeWindow[id];
    delete this.wms[wmId]._setGridSize[id];
    delete this.wms[wmId]._tweenTo[id];
    delete this.wms[wmId]._shiftPosition[id];
  }
  toggleAllWindowSnapPorts( on, wmId = 0 ) {
    if( on !== undefined ) {
      this.snap.on = !this.snap.on;
    }
    else {
      this.snap.on = on;
    }
    setTimeout( () => {
      this.refresh();
    }, 300 );
  }
  setGridSizes( grid, wmId = 0 ) {
    this.gridSize = grid;
    for( let i in this.wms[wmId]._setGridSize ) {
      this.wms[wmId]._setGridSize[i]( grid );
    }
  }
  tweenWindows( arrangement, wmId = 0 ) {
    Array.from(document.getElementsByClassName( 'WindowRnd' )).forEach((e) => { e.style.transition = 'transform 1s ease-in-out' } );

    for( let i in this.wms[wmId]._tweenTo ) {
      this.wms[wmId]._tweenTo[i]( 'focusorder', arrangement );
    }
    setTimeout( function() {
      Array.from(document.getElementsByClassName( 'WindowRnd' )).forEach((e) => { e.style.transition = 'unset' } );
    }, 1000 );
  }
  embraceAll( wmId = 0 ) {
    this.wms[wmId].embraceAll();
  }
  unembraceAll( wmId = 0 ) {
    this.wms[wmId].unembraceAll();
  }
  invertEmbrace( wmId = 0 ) {
    this.wms[wmId].invertEmbrace();
  }
  embraced( isEmbraced, id, wmId = 0 ) {
    this.wms[wmId].embraced( isEmbraced, id );
  }
  getAllEmbracedIds( wmId = 0 ) {
    return this.wms[wmId].getAllEmbracedIds();
  }
  groupEmbraced( wmId = 0 ) {
    this.wms[wmId].groupEmbraced();
  }
  shiftGroup( groupId, shiftX, shiftY, wmId = 0 ) {
    if( groupId !== -1 )
      this.wms[wmId].shiftGroup( groupId, shiftX, shiftY );
  }
  removeGroupHandle( groupId, wmId = 0 ) {
    if( groupId !== -1 )
      this.wms[wmId].removeGroupHandle( groupId );
  }
  removeFromGroup( id, wmId = 0 ) {
    this.wms[wmId].removeFromGroup( id );
  }
  minimizeGroup( groupId, wmId = 0 ) {
    if( groupId !== -1 )
      this.wms[wmId].minimizeGroup( groupId );
  }
  removeGroupWithWindows( groupId, wmId = 0 ) {
    if( groupId !== -1 )
      this.wms[wmId].removeGroupWithWindows( groupId );
  }
  minimizeAll( wmId = 0 ) {
    this.wms[wmId].minimizeAll();
  }
  showAll( wmId = 0 ) {
    this.wms[wmId].showAll();
  }
  removeAll( wmId = 0 ) {
    this.wms[wmId].removeAll();
  }
  
  startPath( x, y, wmId = 0, id, edge ) {
    this.snap.path.on = true;
    this.snap.path.start.x = x;
    this.snap.path.start.y = y;
    this.snap.path.start.meta.wmId = wmId;
    this.snap.path.start.meta.id = id;
    this.snap.path.start.meta.edge = edge;
    this.wms[wmId].updatePath();
  }
  drawPath( wmId = 0 ) {
    if( this.snap.path.on ) {
      this.snap.path.end.x = this.wms[wmId].mousePos[0];
      this.snap.path.end.y = this.wms[wmId].mousePos[1];
      this.wms[wmId].updatePath();
    }
  }
  endPath( wmId = 0, id, edge ) {
    this.snap.path.end.meta.wmId = wmId;
    this.snap.path.end.meta.id = id;
    this.snap.path.end.meta.edge = edge;
    this.snap.path.on = false;
    this.wms[wmId].snapWindowToWindow(
      this.snap.path.start.meta.id,
      this.snap.path.start.meta.edge,
      this.snap.path.end.meta.id,
      this.snap.path.end.meta.edge
    );
    this.wms[wmId].updatePath();
  }

  refreshWindow( id, wmId = 0 ) {
    if( this.wms[wmId]._refreshWindow[id] )
      this.wms[wmId]._refreshWindow[id]();
  }
  refresh( wmId = 0, timeout ) {
    if( this.wms[wmId]._refreshWindows )
      this.wms[wmId]._refreshWindows();
    if( this.wms[wmId]._refreshTaskbar )
      this.wms[wmId]._refreshTaskbar( timeout );
  }

  findHighestZIndex( wmId = 0 ) {
    let highestZ = 0;
    for( let w in this.wms[wmId].windows ) {
      if( this.wms[wmId].windows[w]._.zIndex > highestZ )
        highestZ = this.wms[wmId].windows[w]._.zIndex;
    }
    return highestZ;
  }
  getFocusOrder( id, isReversed, wmId = 0 ) { //Slow but fine since we won't have thousands of windows
    let orderings = [];
    for( let w in this.wms[wmId].windows ) {
      if( this.wms[wmId].windows[w]._.state !== 'minimize' )
        orderings.push( { 'id': w, 'z': this.wms[wmId].windows[w]._.zIndex } );
    }
    orderings = orderings.sort( function(a, b) {
      if( isReversed )
        return a.z - b.z;
      return b.z - a.z;
    });
    for( let o in orderings ) {
      if( orderings[o].id.toString() === id.toString() ) {
        return parseInt( o );
      }
    }
    return false;
  }

  _getNextWindowManagerId() {
    return this.nextWindowManagerId++;
  }

  //Deep compares objects but relies on ordering
  orderedObjectComparison( obj1, obj2 ) {
    return JSON.stringify( obj1 ) === JSON.stringify( obj2 );
  }

  getNumberOfWindows( wmId = 0 ) {
    return this.wms[wmId].getNumberOfWindows();
  }
  getWindowPosition( id, wmId = 0 ) {
    return this.wms[wmId].getWindowPosition( id );
  }

  unsnapAllEmbracedWindows() {
    for (let wmId in this.wms) {
      let targets = this.wms[wmId].getAllEmbracedIds();
      for (let t of targets) {
        this.unsnapWindow(t, wmId);
      }
    }
  }
}

export let manager = new Manager();
