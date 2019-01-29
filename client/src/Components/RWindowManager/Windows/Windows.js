import React, { Component } from "react";
import "./Windows.css";

import { manager } from "../manager/manager";

import Window from "../Window/Window";
import WindowGroup from "../WindowGroup/WindowGroup";

class Windows extends Component {
    constructor(props) {
        super(props);
        this.wmId = this.props.wmId;

        manager.subscribeWindows(this);
    }

    addWindow(config) {
        this.forceUpdate();
    }
    refresh() {
        //this.forceUpdate();
    }

    makeWindows() {
        let windows = [];
        for (let w in manager.wms[this.wmId].windows) {
            if (manager.wms[this.wmId].windows[w]._.state === "normal") {
                let id = manager.wms[this.wmId].windows[w]._.id;

                let rect = manager.getRect();
                let gap = 5,
                    across = 5;
                let width = rect.width / across - gap * 2;
                let height = width;

                width = manager.wms[this.wmId].windows[w].initialWidth || width || 768;
                height = manager.wms[this.wmId].windows[w].initialHeight || height || 512;

                //Null these so they're not read again
                manager.wms[this.wmId].windows[w].initialWidth = null;
                manager.wms[this.wmId].windows[w].initialHeight = null;

                let x = w * 50;
                if (width >= rect.width) x = 0;
                else while (x + width > rect.width) x = x - rect.width + width;
                let y = (w * 50) % (rect.height - height - 24);

                let sv = manager.wms[this.wmId].windows[w]._.stateVars;
                if (sv) {
                    x = sv.x !== undefined ? sv.x : x;
                    y = sv.y !== undefined ? sv.y : y;
                    width = sv.width || width;
                    height = sv.height || height;
                }

                //If snapped match snap parent
                let s = manager.wms[this.wmId].windows[w]._.snap;
                if (s.isSnapped && manager.wms[this.wmId].windows[s.parentId]) {
                    let psv = manager.wms[this.wmId].windows[s.parentId]._.stateVars;
                    switch (s.edge + "" + s.parentEdge) {
                        case "leftright":
                            height = psv.height || height;
                            y = psv.y !== undefined ? psv.y : y;
                            x = psv.x + psv.width;
                            break;
                        case "rightleft":
                            height = psv.height || height;
                            y = psv.y !== undefined ? psv.y : y;
                            x = psv.x - width;
                            break;
                        case "topbottom":
                            width = psv.width || width;
                            x = psv.x !== undefined ? psv.x : x;
                            y = psv.y + psv.height;
                            break;
                        case "bottomtop":
                            width = psv.width || width;
                            x = psv.x !== undefined ? psv.x : x;
                            y = psv.y - height;
                            break;
                        case "leftleft":
                        case "rightright":
                        case "toptop":
                        case "bottombottom":
                            height = psv.height || height;
                            width = psv.width || width;
                            x = psv.x !== undefined ? psv.x : x;
                            y = psv.y !== undefined ? psv.y : y;
                            break;
                        default:
                            break;
                    }
                }

                manager.wms[this.wmId].windows[w]._.stateVars.x = x;
                manager.wms[this.wmId].windows[w]._.stateVars.y = y;
                manager.wms[this.wmId].windows[w]._.stateVars.width = width;
                manager.wms[this.wmId].windows[w]._.stateVars.height = height;
                manager.refreshWindow(w, this.wmId);

                windows.push(
                    <Window
                        wmId={this.wmId}
                        key={id}
                        id={id}
                        config={manager.wms[this.wmId].windows[w]}
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        snapped={manager.snap.on}
                    />
                );
            }
        }

        //Groups
        for (let w in manager.wms[this.wmId].groups) {
            windows.push(
                <WindowGroup
                    wmId={this.wmId}
                    key={"group_" + manager.wms[this.wmId].groups[w].groupId}
                    groupId={manager.wms[this.wmId].groups[w].groupId}
                    x={manager.wms[this.wmId].groups[w].x}
                    y={manager.wms[this.wmId].groups[w].y}
                />
            );
        }
        return windows;
    }

    render() {
        return <div className="Windows">{this.makeWindows()}</div>;
    }
}

export default Windows;
