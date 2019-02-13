import React, { Component } from "react";
import "./Taskbar.css";

import { manager } from "../manager/manager";

import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";

class Taskbar extends Component {
    constructor(props) {
        super(props);
        this.wmId = this.props.wmId;

        this.ref_thumbnail = {};
        this.ref_thumbnails = {};
        this.ref_thumbnailPreviewCanvas = {};
        this.ref_thumbnailBar = {};
        this.ref_thumbnailBarState = {};

        manager.subscribeTaskbar(this);
    }

    refresh(timeout) {
        setTimeout(() => {
            this.forceUpdate();
        }, timeout || 0);
    }

    normalize(id) {
        manager.focusWindow(id, this.wmId);
        manager.normalizeWindow(id, this.wmId);
    }

    popupTask(id) {
        if (this.ref_thumbnails[id]) {
            this.ref_thumbnails[id].style.bottom = "24px";
        }
    }
    popdownTask(id) {
        if (this.ref_thumbnails[id]) {
            this.ref_thumbnails[id].style.bottom = "-150px";
        }
    }

    componentDidUpdate() {
        for (let w in manager.wms[this.wmId].windows) {
            if (manager.wms[this.wmId].windows[w]._.taskBarUpdatesNeeded.thumbnail) {
                let success = this.setThumbnailPreview(manager.wms[this.wmId].windows[w]._.id);
                if (success)
                    manager.wms[this.wmId].windows[w]._.taskBarUpdatesNeeded.thumbnail = false;
            }
            if (manager.wms[this.wmId].windows[w]._.taskBarUpdatesNeeded.state) {
                this.setThumbnailState(manager.wms[this.wmId].windows[w]._.id);
                manager.wms[this.wmId].windows[w]._.taskBarUpdatesNeeded.state = false;
            }
        }
    }

    setThumbnailPreview(id) {
        if (document.getElementById("Window__" + id)) {
            var canvases = document.getElementById("Window__" + id).getElementsByTagName("canvas");

            if (canvases.length > 0) {
                let canvas = this.ref_thumbnailPreviewCanvas[id];
                let ctx = canvas.getContext("2d");
                ctx.imageSmoothingEnabled = false;

                canvas.id = "rwm_thumbnail_" + id;
                canvas.height = 150;
                canvas.width = 150 * (canvases[0].width / canvases[0].height);
                for (let i = 0; i < canvases.length; i++) {
                    if (canvases[i].height !== 0 && canvases[i].height !== 0)
                        ctx.drawImage(canvases[i], 0, 0, canvas.width, canvas.height);
                }
                return true;
            }
        }
        return false;
    }
    setThumbnailState(id) {
        let stateBackground = "white";
        let g = manager.wms[this.wmId].windows[id]._.embrace.group;
        if (g !== -1) stateBackground = manager.colorPalette[g];

        let stateOpacity = 1;
        if (manager.wms[this.wmId].windows[id]._.state === "minimize") {
            stateOpacity = 0.4;
        }

        this.ref_thumbnailBarState[id].style.background = stateBackground;
        this.ref_thumbnail[id].style.opacity = stateOpacity;
    }

    highlightThumbnail(id) {
        //All default color
        for (let t in this.ref_thumbnailBar) {
            if (this.ref_thumbnailBar[t]) this.ref_thumbnailBar[t].style.background = "black";
        }
        //Then highlight
        this.ref_thumbnailBar[id].style.background = "#335de6";
    }

    handleContextMenuClick(e, data, id) {
        e.stopPropagation();
        switch (data.action) {
            case "center":
                manager.centerWindow(id, this.wmId);
                break;
            case "unsnap":
                manager.unsnapWindow(id, this.wmId);
                break;
            case "maximize":
                manager.maxmizeWindow(id, this.wmId);
                break;
            case "minimize":
                manager.minimizeWindow(id, null, this.wmId);
                break;
            case "close":
                manager.removeWindow(id, this.wmId);
                break;
            default:
                console.warn("Unknown context menu action.");
        }
    }

    shouldComponentUpdate(nextProps) {
        return true;
    }
    makeThumbnails() {
        let thumbnails = [];
        for (let w in manager.wms[this.wmId].windows) {
            let id = manager.wms[this.wmId].windows[w]._.id;

            thumbnails.push(
                <div
                    key={id}
                    className="rwm_thumbnail"
                    onMouseEnter={() => this.popupTask(id)}
                    onMouseLeave={() => this.popdownTask(id)}
                    ref={r => {
                        this.ref_thumbnail[id] = r;
                    }}
                >
                    <div
                        className="rwm_thumbnail_preview"
                        ref={r => {
                            this.ref_thumbnails[id] = r;
                        }}
                        onClick={() => this.normalize(id)}
                    >
                        <canvas
                            ref={r => {
                                this.ref_thumbnailPreviewCanvas[id] = r;
                            }}
                        />
                    </div>

                    <ContextMenuTrigger id={"rwm_taskBarContext_" + id} holdToDisplay={-1}>
                        <div
                            className="rwm_thumbnail_bar"
                            ref={r => {
                                this.ref_thumbnailBar[id] = r;
                            }}
                            onClick={() => this.normalize(id)}
                        >
                            <div>{manager.wms[this.wmId].windows[w].title}</div>
                            <div
                                className="rwm_thumbnail_bar_state"
                                ref={r => {
                                    this.ref_thumbnailBarState[id] = r;
                                }}
                            />
                        </div>
                    </ContextMenuTrigger>
                    <div>
                        <ContextMenu id={"rwm_taskBarContext_" + id}>
                            <MenuItem
                                data={{ action: "unsnap" }}
                                onClick={(e, data) => {
                                    this.handleContextMenuClick(e, data, id);
                                }}
                            >
                                Unsnap
                            </MenuItem>

                            <MenuItem
                                data={{ action: "close" }}
                                onClick={(e, data) => {
                                    this.handleContextMenuClick(e, data, id);
                                }}
                            >
                                Close
                            </MenuItem>
                        </ContextMenu>
                    </div>
                </div>
            );
        }
        return thumbnails;
    }

    render() {
        return <div className="Taskbar">{this.makeThumbnails()}</div>;
    }
}

export default Taskbar;
