import React, { Component } from "react";
import "./Window.css";

import { manager } from "../manager/manager";

import { ContextMenu, MenuItem, SubMenu, ContextMenuTrigger } from "react-contextmenu";

import Rnd from "react-rnd";
import { FaCheck } from "react-icons/lib/fa";

class Window extends Component {
    constructor(props) {
        super(props);

        this.wmId = this.props.wmId;
        //vars
        this.id = this.props.id;
        this.config = this.props.config;
        this.x = this.props.x !== undefined ? this.props.x : 0;
        this.y = this.props.y !== undefined ? this.props.y : 0;
        this.width = this.props.width || 200;
        this.height = this.props.height || 200;
        this.title = this.config.title || "New Window";

        this.isMaximized = false;
        this.justMaximized = false;
        this.lastWHTrans = [0, 0, 0, 0];

        this.embraced = manager.wms[this.wmId].windows[this.id]._.embrace.embraced || false;
        this.groupId = manager.wms[this.wmId].windows[this.id]._.embrace.group;

        this.snaps = {
            top: true,
            right: true,
            bottom: true,
            left: true
        };
        //main ref
        this._ref = null;

        this.grid = manager.gridSize || [1, 1];

        this.mounted = false;

        // handler bindings
        this.refresh = this.refresh.bind(this);
        this.setGridSize = this.setGridSize.bind(this);
        this.tweenTo = this.tweenTo.bind(this);
        this.shiftPosition = this.shiftPosition.bind(this);
        this.unfocus = this.unfocus.bind(this);
        this.focus = this.focus.bind(this);
        this.embrace = this.embrace.bind(this);
        this.center = this.center.bind(this);
        this.maximize = this.maximize.bind(this);
        this.handleContextMenuClick = this.handleContextMenuClick.bind(this);

        manager.subscribeWindow(this);
    }

    refresh() {
        if (this.mounted) {
            this.x = manager.wms[this.wmId].windows[this.id]._.stateVars.x;
            this.y = manager.wms[this.wmId].windows[this.id]._.stateVars.y;
            this.width = manager.wms[this.wmId].windows[this.id]._.stateVars.width;
            this.height = manager.wms[this.wmId].windows[this.id]._.stateVars.height;

            if (this.ref_rnd && !this.justMaximized) {
                this.ref_rnd.updateSize({
                    width: this.gridClose(this.width, 0),
                    height: this.gridClose(this.height, 1)
                });
                this.ref_rnd.updatePosition({
                    x: this.gridClose(this.x, 0),
                    y: this.gridClose(this.y, 1)
                });
            }
            this.justMaximized = false;
            if (this.ref_embrace_parent) {
                this.groupId = manager.wms[this.wmId].windows[this.id]._.embrace.group;
                if (this.groupId !== -1)
                    this.ref_embrace_parent.style.background = manager.colorPalette[this.groupId];
                else this.ref_embrace_parent.style.background = "#c7c7c7";
            }
        }
    }

    setGridSize(gridSize) {
        this.grid = gridSize;
        this.forceUpdate();
    }

    tweenTo(mode, arrangement) {
        let rect = manager.getRect();
        rect.height -= 28; //taskbar
        let gap = 5,
            across = 5;
        let w = rect.width / across - gap * 2;
        let h = w;
        let x = 0;
        let y = 0;

        if (mode === "focusorder") {
            let fo = manager.getFocusOrder(this.id, false, this.wmId);
            let numW = manager.getNumberOfWindows(this.wmId);

            switch (arrangement) {
                case "tile":
                    x = (fo % across) * (w + gap) + gap;
                    y = parseInt(fo / across, 10) * (h + gap) + gap;
                    break;
                case "cascade":
                    fo = numW - fo - 1;
                    x = fo * 50;
                    y = (fo * 50) % (rect.height - h - 24);
                    break;
                case "horizontal":
                    w = (rect.width - gap) / numW - gap;
                    h = rect.height - gap;
                    x = fo * (w + gap) + gap;
                    y = 0;
                    break;
                case "vertical":
                    w = rect.width - gap;
                    h = rect.height / numW - gap;
                    if (h < 250) h = 250;
                    x = 0;
                    y = fo * (h + gap) + gap;
                    break;
                default:
                    console.warn("Warning - Unknown tweenTo arrangment: " + arrangement);
            }
            this.x = x;
            this.y = y;
            this.width = w;
            this.height = h;
            this.quickStateVarsXYWHUpdate(x, y, w, h);

            if (this.ref_rnd) {
                this.ref_rnd.updateSize({
                    width: this.gridClose(w, 0),
                    height: this.gridClose(h, 1)
                });
                this.ref_rnd.updatePosition({ x: x, y: y });
            }
        }
    }

    shiftPosition(shiftX, shiftY) {
        manager.wms[this.wmId].windows[this.id]._.stateVars.x -= shiftX;
        manager.wms[this.wmId].windows[this.id]._.stateVars.y -= shiftY;
        if (manager.wms[this.wmId].windows[this.id]._.state !== "minimize") {
            this.ref_rnd.updatePosition({
                x: manager.wms[this.wmId].windows[this.id]._.stateVars.x,
                y: manager.wms[this.wmId].windows[this.id]._.stateVars.y
            });
        }
    }

    quickStateVarsXYWHUpdate(x, y, w, h) {
        manager.wms[this.wmId].windows[this.id]._.stateVars.x = x;
        manager.wms[this.wmId].windows[this.id]._.stateVars.y = y;
        manager.wms[this.wmId].windows[this.id]._.stateVars.width = w;
        manager.wms[this.wmId].windows[this.id]._.stateVars.height = h;
    }

    //Fade header
    unfocus() {
        if (this.ref_wh) {
            this.ref_wh.style.opacity = 0.9;
            this.ref_wh.style.color = "#999";
            this.ref_wh.style.background = "#061427";
            this.ref_wh.style.borderBottom = "none";

            if (this.ref_embrace_parent)
                this.ref_embrace_parent.style.borderLeft = "1px solid black";
        }
    }
    //Bring z-index to top
    focus(isGroup) {
        if (!isGroup && this.ref_wh) {
            this.ref_wh.style.opacity = 1;
            this.ref_wh.style.color = "black";
            this.ref_wh.style.background = "#e6e6e6";
            this.ref_wh.style.borderBottom = "1px solid darkgrey";
            if (this.ref_embrace_parent)
                this.ref_embrace_parent.style.borderLeft = "1px solid darkgrey";
        }
        let highestZ = manager.findHighestZIndex(this.wmId);
        manager.wms[this.wmId].windows[this.id]._.zIndex = highestZ + 1;
        this.refreshZIndex();
    }

    embrace(on) {
        this.embraced = !this.embraced;
        if (typeof on === "boolean") this.embraced = on;
        if (this.ref_embrace) {
            if (this.embraced) this.ref_embrace.style.opacity = 1;
            else this.ref_embrace.style.opacity = 0;
        }

        //Update context menu
        let ce = document.getElementById("windowcontextembrace_" + this.id);
        if (ce) ce.innerText = this.embraced ? "Deselect" : "Select";

        manager.embraced(this.embraced, this.id, this.wmId);
    }

    updateXYWH() {
        if (this.ref_rnd && this.ref_wc) {
            let p = this.ref_wc.parentElement;
            let rect = p.getBoundingClientRect();
            let transform = p.style.transform
                .replace("px", "")
                .split("(")[1]
                .split(")")[0]
                .split(",");

            this.x = parseInt(transform[0], 10);
            this.y = parseInt(transform[1], 10);
            this.width = rect.width;
            this.height = rect.height;
        }
    }

    snap(sp, edge) {
        if (!manager.snap.path.on) {
            let r = sp.getBoundingClientRect();
            let w = manager.getWMS()._ref.getBoundingClientRect();
            manager.startPath(
                r.x - w.x + r.width / 2,
                r.y - w.y + r.height / 2,
                this.props.wmId,
                this.props.id,
                edge
            );
        } else {
            manager.endPath(this.props.wmId, this.props.id, edge);
        }
    }

    minimize() {
        this.updateXYWH();
        manager.minimizeWindow(
            this.id,
            {
                x: this.gridClose(this.x, 0),
                y: this.gridClose(this.y, 1),
                width: this.gridClose(this.width, 0),
                height: this.gridClose(this.height, 1)
            },
            this.wmId
        );
    }

    center() {
        if (this._ref && this.ref_rnd) {
            if (this.isMaximized) this.maximize();

            let w = this._ref.getBoundingClientRect().width;
            let h = this._ref.getBoundingClientRect().height;

            this.x = Math.floor(w / 2 - this.width / 2);
            this.y = Math.floor(h / 2 - this.height / 2);

            manager.setWindowState(
                this.id,
                null,
                {
                    x: this.gridClose(this.x, 0),
                    y: this.gridClose(this.y, 1),
                    width: this.gridClose(this.width, 0),
                    height: this.gridClose(this.height, 1)
                },
                this.wmId
            );
        }
    }

    maximize() {
        if (this.ref_rnd && this.ref_wc) {
            let p = this.ref_wc.parentElement;
            if (!this.isMaximized) {
                let rect = p.getBoundingClientRect();
                let transform = p.style.transform
                    .replace("px", "")
                    .split("(")[1]
                    .split(")")[0]
                    .split(",");
                this.lastWHTrans = [
                    rect.width,
                    rect.height,
                    parseInt(transform[0], 10),
                    parseInt(transform[1], 10)
                ];

                this.x = 0;
                this.y = 0;
                this.width = "100%";
                this.height = this._ref.getBoundingClientRect().height - 30;

                this.ref_rnd.updateSize({ width: this.width, height: this.height });
                this.ref_rnd.updatePosition({ x: 0, y: 0 });
            } else {
                this.x = this.lastWHTrans[2];
                this.y = this.lastWHTrans[3];
                this.width = this.lastWHTrans[0];
                this.height = this.lastWHTrans[1];

                this.ref_rnd.updateSize({
                    width: this.gridClose(this.width, 0),
                    height: this.gridClose(this.height, 1)
                });
                this.ref_rnd.updatePosition({
                    x: this.gridClose(this.x, 0),
                    y: this.gridClose(this.y, 1)
                });
            }

            this.isMaximized = !this.isMaximized;
            this.justMaximized = true;
        }
    }

    dragStart(e, d) {
        this.x = e.clientX;
        this.y = e.clientY;
    }
    drag(e, d) {
        let shiftX = this.x - e.clientX;
        let shiftY = this.y - e.clientY;
        if (e.shiftKey === false) manager.shiftGroup(this.groupId, shiftX, shiftY, this.wmId);
        this.x = e.clientX;
        this.y = e.clientY;
    }
    dragEnd(e, d) {
        manager.setWindowState(
            this.id,
            null,
            { x: this.gridClose(d.x, 0), y: Math.max(this.gridClose(d.y, 1), 0) },
            this.wmId
        );
    }
    resizeEnd(e, d) {
        if (this.ref_wc) {
            let rect = this.ref_wc.parentElement.getBoundingClientRect();
            manager.setWindowState(
                this.id,
                null,
                { width: rect.width, height: rect.height },
                this.wmId
            );
        }
    }

    gridClose(v, i) {
        if (typeof v === "string") return v;
        return Math.round(v / this.grid[i]) * this.grid[i];
    }

    close() {
        manager.removeWindow(this.id, this.wmId);
    }

    refreshZIndex() {
        if (this._ref) this._ref.style.zIndex = manager.wms[this.wmId].windows[this.id]._.zIndex;
    }

    handleContextMenuClick(e, data) {
        switch (data.action) {
            case "embrace":
                this.embrace();
                break;
            case "group":
                manager.groupEmbraced(this.wmId);
                break;
            case "ungroup":
                manager.removeFromGroup(this.id, this.wmId);
                break;
            case "ungroupall":
                manager.removeGroupHandle(this.groupId, this.wmId);
                break;
            case "minimizegroup":
                manager.minimizeGroup(this.groupId, this.wmId);
                break;
            case "closegroup":
                manager.removeGroupWithWindows(this.groupId, this.wmId);
                break;

            case "minimize":
                this.minimize();
                break;
            case "maximize":
                this.maximize();
                break;
            case "close":
                this.close();
                break;

            default:
                console.warn("Unknown context menu action.");
        }
    }
    //hackiness
    correctContextMenuPosition() {
        setTimeout(() => {
            if (
                this._ref &&
                this._ref.parentElement &&
                this._ref.parentElement.parentElement &&
                this._ref.parentElement.parentElement.parentElement
            ) {
                let coords = this._ref.parentElement.parentElement.parentElement.getBoundingClientRect();
                let top = -coords.y + "px";
                let left = -coords.x + "px";

                this.wrapper.children[0].style.display = "inherit";
                this.wrapper.style.top = top;
                this.wrapper.style.left = left;
            }
        }, 50);
    }
    hideContextMenu() {
        if (this.wrapper) this.wrapper.children[0].style.display = "none";
    }

    componentDidMount() {
        this.mounted = true;
        this.embrace(this.embraced);
        this.refreshZIndex();
        manager.focusWindow(this.id, -1, this.wmId);
    }
    shouldComponentUpdate(nextProps) {
        return !manager.orderedObjectComparison(this.props, nextProps);
    }

    _showHideStyle(show) {
        return show
            ? { opacity: "1", pointerEvents: "auto" }
            : { opacity: "0", pointerEvents: "none" };
    }

    render() {
        //Get config component
        let DynamicComponent = manager.getComponent(this.config.component);
        let content = <DynamicComponent {...this.config.props} />;

        return (
            <div
                className="Window"
                id={"Window__" + this.id}
                ref={r => {
                    this._ref = r;
                }}
            >
                <Rnd
                    ref={r => {
                        this.ref_rnd = r;
                    }}
                    className="WindowRnd"
                    default={{
                        x: this.x,
                        y: this.y,
                        width: this.width,
                        height: this.height
                    }}
                    enableResizing={{
                        top: false,
                        right: true,
                        bottom: true,
                        left: true,
                        topRight: false,
                        bottomRight: true,
                        bottomLeft: true,
                        topLeft: false
                    }}
                    resizeGrid={this.grid}
                    dragGrid={this.grid}
                    minWidth={200}
                    minHeight={200}
                    style={{
                        background: "white",
                        boxShadow: "0px 2px 15px rgba(0,0,0,0.2)"
                    }}
                    onDragStart={(e, d) => {
                        this.dragStart(e, d);
                    }}
                    onDrag={(e, d) => {
                        this.drag(e, d);
                    }}
                    onDragStop={(e, d) => {
                        this.dragEnd(e, d);
                    }}
                    onResizeStop={(e, d) => {
                        this.resizeEnd(e, d);
                    }}
                    dragHandleClassName={".WindowHandle__" + this.id}
                >
                    <div
                        className="WindowContent"
                        id={"WindowContent__" + this.id}
                        ref={wc => {
                            this.ref_wc = wc;
                        }}
                        onMouseDown={e => {
                            if (e.shiftKey === true) manager.focusWindow(this.id, -1, this.wmId);
                            else manager.focusWindow(this.id, this.groupId, this.wmId);
                        }}
                    >
                        <ContextMenuTrigger
                            id={"WindowContextMenuHeader__" + this.id}
                            holdToDisplay={-1}
                        >
                            <div
                                className={"WindowHandle__" + this.id + " WindowHandle"}
                                ref={wh => {
                                    this.ref_wh = wh;
                                }}
                            >
                                <div className="WindowHandleLeft">
                                    <div className="WindowHandleButtons">
                                        <div
                                            className="WindowHandleButtonsClose"
                                            title="close"
                                            onClick={() => this.close()}
                                        />
                                        <div
                                            className="WindowHandleButtonsMaximize"
                                            title="maximize"
                                            onClick={() => this.maximize()}
                                        />
                                        <div
                                            className="WindowHandleButtonsMinimize"
                                            title="minimize"
                                            onClick={() => this.minimize()}
                                        />
                                    </div>
                                    <div className="WindowHandleTitle">{this.title}</div>
                                </div>
                                <ContextMenuTrigger
                                    id={"WindowContextMenuEmbrace__" + this.id}
                                    holdToDisplay={-1}
                                >
                                    <div
                                        className="WindowHandleEmbrace"
                                        ref={e => {
                                            this.ref_embrace_parent = e;
                                        }}
                                        onClick={() => this.embrace()}
                                    >
                                        <div
                                            ref={e => {
                                                this.ref_embrace = e;
                                            }}
                                        >
                                            <FaCheck />
                                        </div>
                                    </div>
                                </ContextMenuTrigger>
                            </div>
                        </ContextMenuTrigger>
                        <div className="WindowContentInner">{content}</div>
                        <span className="SnapCont" style={this._showHideStyle(this.props.snapped)}>
                            <div
                                className="SnapPortTop snap"
                                style={this._showHideStyle(this.snaps.top)}
                                ref={sp => {
                                    this.ref_spt = sp;
                                }}
                                onClick={() => this.snap(this.ref_spt, "top")}
                            />
                            <div
                                className="SnapPortRight snap"
                                style={this._showHideStyle(this.snaps.right)}
                                ref={sp => {
                                    this.ref_spr = sp;
                                }}
                                onClick={() => this.snap(this.ref_spr, "right")}
                            />
                            <div
                                className="SnapPortBottom snap"
                                style={this._showHideStyle(this.snaps.bottom)}
                                ref={sp => {
                                    this.ref_spb = sp;
                                }}
                                onClick={() => this.snap(this.ref_spb, "bottom")}
                            />
                            <div
                                className="SnapPortLeft snap"
                                style={this._showHideStyle(this.snaps.left)}
                                ref={sp => {
                                    this.ref_spl = sp;
                                }}
                                onClick={() => this.snap(this.ref_spl, "left")}
                            />
                        </span>
                    </div>
                </Rnd>
                <div
                    className="WindowWrapper"
                    ref={e => {
                        this.wrapper = e;
                    }}
                >
                    <ContextMenu
                        id={"WindowContextMenuEmbrace__" + this.id}
                        className={"WindowContextMenuEmbrace"}
                        onShow={() => this.correctContextMenuPosition()}
                        onHide={() => this.hideContextMenu()}
                    >
                        <MenuItem
                            data={{ action: "embrace" }}
                            onClick={this.handleContextMenuClick}
                        >
                            <span id={"windowcontextembrace_" + this.id}>
                                {this.embraced ? "Deselect" : "Select"}
                            </span>
                        </MenuItem>
                        <MenuItem data={{ action: "group" }} onClick={this.handleContextMenuClick}>
                            Group
                        </MenuItem>
                        <MenuItem
                            data={{ action: "ungroup" }}
                            onClick={this.handleContextMenuClick}
                        >
                            Ungroup
                        </MenuItem>
                        <MenuItem
                            data={{ action: "ungroupall" }}
                            onClick={this.handleContextMenuClick}
                        >
                            Ungroup All
                        </MenuItem>
                        <MenuItem
                            data={{ action: "minimizegroup" }}
                            onClick={this.handleContextMenuClick}
                        >
                            Minimize Group
                        </MenuItem>
                        <MenuItem
                            data={{ action: "closegroup" }}
                            onClick={this.handleContextMenuClick}
                        >
                            Close Group
                        </MenuItem>
                    </ContextMenu>
                    <ContextMenu
                        id={"WindowContextMenuHeader__" + this.id}
                        className={"WindowContextMenuHeader"}
                        onShow={() => this.correctContextMenuPosition()}
                        onHide={() => this.hideContextMenu()}
                    >
                        <MenuItem
                            data={{ action: "minimize" }}
                            onClick={this.handleContextMenuClick}
                        >
                            Minimize
                        </MenuItem>
                        <MenuItem
                            data={{ action: "maximize" }}
                            onClick={this.handleContextMenuClick}
                        >
                            Maximize
                        </MenuItem>
                        <MenuItem data={{ action: "close" }} onClick={this.handleContextMenuClick}>
                            Close
                        </MenuItem>
                    </ContextMenu>
                </div>
            </div>
        );
    }
}

export default Window;
