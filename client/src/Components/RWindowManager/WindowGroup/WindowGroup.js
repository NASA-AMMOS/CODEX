import React, { Component } from 'react';
import './WindowGroup.css';

import { ContextMenu, MenuItem, SubMenu, ContextMenuTrigger } from 'react-contextmenu';

import { manager } from '../manager/manager';

import Rnd from 'react-rnd';
import { FaCheck } from 'react-icons/lib/fa';

//DEPRECATED!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!1
class WindowGroup extends Component {

  constructor(props) {
    super(props);

    this.wmId = this.props.wmId;

    //vars
    this.groupId = this.props.groupId;
    this.x = ( this.props.x !== undefined ) ? this.props.x : 0;
    this.y = ( this.props.y !== undefined ) ? this.props.y : 0;
    this.radius = 16;
    this.x -= this.radius;
    this.y -= this.radius;
    this.color = this.props.color || manager.colorPalette[this.groupId];

    // handler stubs
    this.handleContextMenuClick = this.handleContextMenuClick.bind(this)
  }

  dragStart( e, d ) {
    this.x = e.clientX;
    this.y = e.clientY;
  }
  drag( e, d ) {
    let shiftX = this.x - e.clientX;
    let shiftY = this.y - e.clientY;
    if( e.shiftKey === false )
      manager.shiftGroup( this.groupId, shiftX, shiftY, this.wmId );
    this.x = e.clientX;
    this.y = e.clientY;
  }

  handleContextMenuClick(e, data) {
    switch( data.action ) {
      case 'minimize':
          manager.minimizeGroup( this.groupId, this.wmId );
        break;
      case 'ungroup':
          manager.removeGroupHandle( this.groupId, this.wmId );
        break;
      case 'close':
          manager.removeGroupWithWindows( this.groupId, this.wmId );
        break;
      default:
        console.warn( 'Unknown context menu action.' );
    }
  }

  //hackiness
  correctContextMenuPosition() {
    setTimeout( () => {
      if( this._ref && this._ref.parentElement && this._ref.parentElement.parentElement
        && this._ref.parentElement.parentElement.parentElement ) {
        let coords = this._ref.parentElement.parentElement.parentElement.getBoundingClientRect();
        let top = -coords.y + 'px';
        let left = -coords.x + 'px';
        
        this.wrapper.children[0].style.display = 'inherit';
        this.wrapper.style.top = top;
        this.wrapper.style.left = left;
      }
    }, 50);
  }
  hideContextMenu() {
    if( this.wrapper )
      this.wrapper.children[0].style.display = 'none';
  }

  render() {
    return (
      <div className='WindowGroup' id={'WindowGroup__' + this.groupId}
        style={{'display': 'none' }} /*!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/
        ref={(r) => { this._ref = r; } }>
        <ContextMenuTrigger id={'WindowGroupContextMenu__' + this.groupId}
          holdToDisplay={-1}>
          <Rnd
            ref={r => { this.ref_rnd = r; }}
            className='WindowGroupRnd'
            default={{
              x: this.x,
              y: this.y,
              width: this.radius * 2,
              height: this.radius * 2
            }}
            enableResizing={{
              top: false,
              right: false,
              bottom: false,
              left: false,
              topRight: false,
              bottomRight: false,
              bottomLeft: false,
              topLeft: false
            }}
            style={{
              background: this.color,
              boxShadow: '0px 2px 15px rgba(0,0,0,0.2)'
            }}
            onDragStart={(e,d) => { this.dragStart(e,d); }}
            onDrag={(e,d) => { this.drag(e,d); }}
            dragHandleClassName={'.WindowGroupHandle__' + this.groupId}
          >
            <div className='WindowGroupContent' id={'WindowGroupContent__' + this.groupId}
              ref={(wc) => { this.ref_wc = wc; } }>
              <div className={'WindowGroupHandle__' + this.groupId + ' WindowGroupHandle'}
                ref={(wh) => { this.ref_wh = wh; } }>
              </div>
            </div>
          </Rnd>
        </ContextMenuTrigger>
        <div className='WindowGroupWrapper' ref={(e) => { this.wrapper = e; }}>
          <ContextMenu id={'WindowGroupContextMenu__' + this.groupId}
            className={'WindowGroupContextMenu'}
            onShow={() => this.correctContextMenuPosition()}
            onHide={() => this.hideContextMenu()}>
            <MenuItem data={{ action: 'minimize' }} onClick={this.handleContextMenuClick}>
              Minimize
            </MenuItem>
            <MenuItem data={{ action: 'ungroup' }} onClick={this.handleContextMenuClick}>
              Ungroup
            </MenuItem>
            <MenuItem data={{ action: 'close' }} onClick={this.handleContextMenuClick}>
              Close All
            </MenuItem>
          </ContextMenu>
        </div>
      </div>
    );
  }
}

export default WindowGroup;
