import "components/WindowManager/WindowManagerStyles.scss";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import React, { useState, useLayoutEffect, useEffect, useRef } from "react";
import ShelfPack from "@mapbox/shelf-pack";

import Cristal from "react-cristal/src";
import * as windowContentFunctions from "components/WindowManager/windowContentFunctions";
import * as windowManagerActions from "actions/windowManagerActions";
import * as windowSettings from "constants/windowSettings";

function tileWindowsFromPackedObject(refAry, packed) {
    refAry.forEach(([key], idx) => {
        const { x, y } = packed[idx];
        const [_, win] = refAry[idx];
        win.snapToPosition({ x, y });
    });
}

function createPackingObject(refAry) {
    return refAry.map(([key, cristalObj], idx) => {
        return {
            id: idx,
            width: cristalObj.state.width,
            height: cristalObj.state.height,
            winId: key,
            x: cristalObj.state.x,
            y: cristalObj.state.y
        };
    });
}

function tileWindows(props, refs) {
    const windowContainer = document.getElementById("Container");
    const bounds = windowContainer.getBoundingClientRect();
    let sprite = new ShelfPack(bounds.width, bounds.height, { autoResize: false });

    const oldWindows = props.windows;

    // Treat the window ref list as an array so we can use numeric IDs, which are faster with ShelfPack
    const refAry = Object.entries(refs.current);

    // First try tiling windows at their current size.
    let packReqs = createPackingObject(refAry);
    let packed = sprite.pack(packReqs);

    // In all cases, if the number of packed windows doesn't match the number of existing windows,
    // we know we can't tile all the windows in the available space and have to try something else.
    if (packed.length === refAry.length) return tileWindowsFromPackedObject(refAry, packed);

    // Shrink windows to their initial size and try tiling again
    refAry.forEach(([key, cristalObj]) => {
        const windowType = props.windows.find(win => win.id === key).windowType;
        const { width, height } = windowSettings.initialSizes[windowType];
        cristalObj.state.width = width;
        cristalObj.state.height = height;
    });

    packReqs = createPackingObject(refAry);
    sprite = new ShelfPack(bounds.width, bounds.height, { autoResize: false }); // For some reason the clear() method doesn't work with batch packing
    packed = sprite.pack(packReqs);
    if (packed.length === refAry.length) return tileWindowsFromPackedObject(refAry, packed);

    console.log("Can't tile windows! Not enough space!");
}

// Adapted from: https://www.youtube.com/watch?v=g8bSdXCG-lA
function getNewWindowPosition(props, refs, width, height) {
    const windowContainer = document.getElementById("Container");
    const bounds = windowContainer.getBoundingClientRect();

    // Build a matrix of occupied and unoccupied space
    const matrix = Array(bounds.height)
        .fill()
        .map((_, y) =>
            Array(bounds.width)
                .fill(0)
                .map((_, x) => true)
        );

    const windows = createPackingObject(Object.entries(refs.current));
    windows.forEach(win => {
        if (win.width && win.height) {
            for (let y = win.y; y < win.height + win.y + 10; y++) {
                for (let x = win.x; x < win.width + win.x + 10; x++) {
                    matrix[y][x] = false;
                }
            }
        }
    });

    let cache = Array(bounds.width).fill(0);
    const stack = [];

    for (let row = 0; row < bounds.height; row++) {
        cache = cache.map((col, idx) => (matrix[row][idx] ? col + 1 : 0));

        let currentWidth = 0;
        for (let col = 0; col < bounds.width; col++) {
            if (cache[col] >= height) {
                // We've found the start of a box that's tall enough
                currentWidth = cache[col] >= height ? currentWidth + 1 : 0;
            }

            if (currentWidth === width) {
                // And now we have one that's wide enough
                return { y: row - height + 1, x: col - width + 1 };
            }
        }
    }
}

function makeMinimizedBar(props) {
    return (
        <div className="minimizedBar">
            {props.windows
                .filter(win => win.minimized)
                .map(win => (
                    <div
                        key={win.id}
                        onClick={_ => {
                            if (!win.minimizedOnly) props.toggleMinimizeWindow(win.id);
                        }}
                        onMouseOver={_ => props.setWindowHover(win.id, true)}
                        onMouseOut={_ => props.setWindowHover(win.id, false)}
                        className="minimizedWindow"
                    >
                        <div className="title">{windowContentFunctions.getWindowTitle(win)}</div>
                    </div>
                ))}
        </div>
    );
}

function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

function WindowManager(props) {
    const refs = useRef({}); // Store refs to all the open windows so we can do global window operations
    // Each time the windows list gets updated, delete old refs.
    const [activeWindow, setActiveWindow] = useState(null);

    const oldWindows = usePrevious(props.windows);
    useEffect(
        _ => {
            Object.keys(refs.current).forEach(key => {
                if (!refs.current[key]) delete refs.current[key];
            });

            // If there's a new window since the previous render, set it to be the active window.
            const newWindow =
                oldWindows && props.windows.find(win => !oldWindows.find(w => w.id === win.id));
            if (newWindow) setActiveWindow(newWindow.id);
        },
        [props.windows]
    );

    // This function sets the window tiling action pending state to "off" once the component has rendered and the
    // windows have been tiled.
    useLayoutEffect(
        _ => {
            if (!props.tileActionPending) return;
            tileWindows(props, refs);
            props.setWindowTileAction(false);
        },
        [props.tileActionPending]
    );

    console.log(props.windows);

    const windows = props.windows
        .filter(win => !win.minimizedOnly)
        .map((win, idx) => {
            const { width, height, resizeable, minSize } = windowSettings.initialSizes[
                win.windowType
            ];

            // If we can't find a ref for this window, it's new, and we calculate an initial position for it
            const initialPos = refs.current[win.id]
                ? "top-left"
                : getNewWindowPosition(props, refs, width, height);

            const settings = win.settings || {
                title: windowContentFunctions.getWindowTitle(win),
                children: null,
                isResizable: resizeable,
                isDraggable: true,
                initialPosition: initialPos,
                restrictToParentDiv: true,
                initialSize: { width, height },
                minSize
            };

            // This is a bit of an odd return fragment, but we want to avoid re-rendering the window's content.
            // If the window is minimized, we retain the Cristal (draggable window) reference, but keep it hidden.
            // If the window is in preview mode, we display the window content in preview mode.
            const hiddenStyle = {
                display: "none"
            };

            return (
                <Cristal
                    key={win.id}
                    className="newWindow"
                    style={win.minimized && !win.hover ? hiddenStyle : null}
                    onClose={_ => props.closeWindow(win.id)}
                    ref={r => (refs.current[win.id] = r)}
                    onMinimize={_ => props.toggleMinimizeWindow(win.id)}
                    hideHeader={win.minimized}
                    isActive={activeWindow === win.id}
                    onClick={_ => setActiveWindow(win.id)}
                    {...settings}
                >
                    <div className="windowBody">{windowContentFunctions.getWindowContent(win)}</div>
                </Cristal>
            );
        });

    return (
        <React.Fragment>
            {windows}
            {makeMinimizedBar(props)}
        </React.Fragment>
    );
}

function mapStateToProps(state) {
    return {
        windows: state.windowManager.get("windows"),
        tileActionPending: state.windowManager.get("tileActionPending")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        openNewWindow: bindActionCreators(windowManagerActions.openNewWindow, dispatch),
        closeWindow: bindActionCreators(windowManagerActions.closeWindow, dispatch),
        setWindowTileAction: bindActionCreators(windowManagerActions.setWindowTileAction, dispatch),
        toggleMinimizeWindow: bindActionCreators(
            windowManagerActions.toggleMinimizeWindow,
            dispatch
        ),
        setWindowHover: bindActionCreators(windowManagerActions.setWindowHover, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WindowManager);
