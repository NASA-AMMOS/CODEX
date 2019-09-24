import "components/WindowManager/WindowManagerStyles.scss";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import React, { useState, useLayoutEffect, useEffect, useRef } from "react";
import ShelfPack from "@mapbox/shelf-pack";
import { useActiveWindow } from "hooks/WindowHooks";
import { batchActions } from "redux-batched-actions";

import Cristal from "react-cristal/src";
import * as windowContentFunctions from "components/WindowManager/windowContentFunctions";
import * as windowManagerActions from "actions/windowManagerActions";
import * as selectionActions from "actions/selectionActions";
import * as windowSettings from "constants/windowSettings";
import WindowErrorBoundary from "components/WindowHelpers/WindowErrorBoundary";

/**
 * Binary space partition
 */
function BSPTile(windows) {
    // helper to divide into integer components
    const divide = num => [Math.floor(num / 2), Math.ceil(num / 2)];
    // helper to make partitions
    const makePart = (x, y, width, height, depth = -1) => ({ x, y, width, height, depth });
    // add margins to a partition
    const addMargin = margin => part =>
        makePart(
            part.x + margin,
            part.y + margin,
            part.width - 2 * margin,
            part.height - 2 * margin,
            part.depth
        );

    /**
     * Make a list of partitions the length of the space
     */
    function makePartitions(bounding, remaining, depth = 0) {
        // base case: zero remaining
        if (remaining === 0) {
            return [];
        } else if (remaining === 1) {
            // base case: one remaining
            return [bounding];
        }

        // here we have 2+ remaining partitions
        let part1 = {};
        let part2 = {};
        if (bounding.width > bounding.height) {
            // split horizontally
            let [left, right] = divide(bounding.width);

            part1 = makePart(bounding.x, bounding.y, left, bounding.height, depth);
            part2 = makePart(bounding.x + left, bounding.y, right, bounding.height, depth);
        } else {
            // split vertically
            let [top, bottom] = divide(bounding.height);
            part1 = makePart(bounding.x, bounding.y, bounding.width, top, depth);
            part2 = makePart(bounding.x, bounding.y + top, bounding.width, bottom, depth);
        }

        // recursive step: calculate child partitions
        let [part1_remaining, part2_remaining] = divide(remaining);
        return [
            ...makePartitions(part1, part1_remaining, depth + 1),
            ...makePartitions(part2, part2_remaining, depth + 1)
        ];
    }

    // determine the bounds of the window
    const windowContainer = document.getElementById("Container");
    const containerBoundingRect = windowContainer.getBoundingClientRect();
    // make partitions, taking care to respect the window container area's padding
    const bounds = makePart(
        10,
        10,
        containerBoundingRect.width - 20,
        containerBoundingRect.height - 50
    );

    // next, create N partitions (to match the # of windows)
    const partitions = makePartitions(bounds, windows.length).map(addMargin(1));

    // in-place sort the partitions by size. it's important that the partitions
    // are sorted so that the windows do not shuffle around when you try
    // to re+tile multiple times.
    partitions.sort(part => part.width * part.height);

    console.log(partitions);

    // sort the windows by size as well
    const windows_sorted = windows
        .sort(win => win.get("width") * win.get("height"))
        .map(win => win.get("id"));

    // reduce the windows together with the partitions to create action objects (undispatched)
    return partitions.reduce(
        (acc, val, idx) => [
            ...acc,
            windowManagerActions.resizeWindow(windows_sorted[idx], {
                width: val.width,
                height: val.height
            }),
            windowManagerActions.moveWindow(windows_sorted[idx], { x: val.x, y: val.y })
        ],
        []
    );
}

function makeMinimizedBar(props) {
    return (
        <div className="minimizedBar">
            {props.windows
                .filter(win => win.get("minimized"))
                .map(win => (
                    <div
                        key={win.get("id")}
                        onClick={_ => {
                            if (!win.get("minimizedOnly"))
                                props.toggleMinimizeWindow(win.get("id"));
                        }}
                        onMouseOver={_ => props.setWindowHover(win.get("id"), true)}
                        onMouseOut={_ => props.setWindowHover(win.get("id"), false)}
                        className="minimizedWindow"
                    >
                        <div className="title">{win.get("title")}</div>
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
    const [activeWindow, setActiveWindow] = useActiveWindow();

    //clear out current selection when all windows are closed
    if (props.windows.length == 0) {
        props.setCurrentSelection([]);
    }

    const oldWindows = usePrevious(props.windows);
    useEffect(
        _ => {
            Object.keys(refs.current).forEach(key => {
                if (!refs.current[key]) delete refs.current[key];
            });
        },
        [props.windows]
    );

    // This function sets the window tiling action pending state to "off" once the component has rendered and the
    // windows have been tiled.
    useLayoutEffect(
        _ => {
            if (!props.tileActionPending) return;
            //tileWindows(props, refs);
            const actions = BSPTile([...props.windows]);

            // hacky, but the windows need to be directly notified of their new positions
            for (let action of actions) {
                if ("position" in action) {
                    refs.current[action.id].snapToPosition(action.position);
                }
            }

            props.executeTilingAction(actions);
            props.setWindowTileAction(false);
        },
        [props.tileActionPending]
    );

    const windows = props.windows
        .filter(win => !win.get("minimizedOnly"))
        .map((win, idx) => {
            const initialPos = { x: win.get("x"), y: win.get("y") };

            const settings = {
                title: win.get("title"),
                children: null,
                isResizable: win.get("isResizable"),
                isDraggable: true,
                initialPosition: initialPos,
                restrictToParentDiv: true,
                initialSize: { width: win.get("width"), height: win.get("height") },
                minSize: win.get("minSize").toJS() || { width: 100, height: 100 },
                width: win.get("width"),
                height: win.get("height"),
                x: win.get("x", 0),
                y: win.get("y", 0)
            };

            // This is a bit of an odd return fragment, but we want to avoid re-rendering the window's content.
            // If the window is minimized, we retain the Cristal (draggable window) reference, but keep it hidden.
            // If the window is in preview mode, we display the window content in preview mode.
            const hiddenStyle = {
                display: "none"
            };

            return (
                <Cristal
                    key={win.get("id")}
                    className="newWindow"
                    style={win.get("minimized") && !win.get("hover") ? hiddenStyle : null}
                    onClose={_ => props.closeWindow(win.get("id"))}
                    ref={r => (refs.current[win.get("id")] = r)}
                    onMinimize={_ => props.toggleMinimizeWindow(win.get("id"))}
                    hideHeader={win.get("minimized")}
                    onResizeEnd={state =>
                        props.resizeWindow(win.get("id"), {
                            width: state.width,
                            height: state.height
                        })
                    }
                    onMoveEnd={state => props.moveWindow(win.get("id"), { x: state.x, y: state.y })}
                    isActive={activeWindow === win.get("id")}
                    onClick={_ => setActiveWindow(win.get("id"))}
                    {...settings}
                >
                    <div className="windowBody">
                        <WindowErrorBoundary verbose={true}>
                            {React.cloneElement(windowContentFunctions.getWindowContent(win), {
                                __wm_parent_id: win.get("id")
                            })}
                        </WindowErrorBoundary>
                    </div>
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
        setWindowHover: bindActionCreators(windowManagerActions.setWindowHover, dispatch),
        resizeWindow: bindActionCreators(windowManagerActions.resizeWindow, dispatch),
        moveWindow: bindActionCreators(windowManagerActions.moveWindow, dispatch),
        setCurrentSelection: bindActionCreators(selectionActions.setCurrentSelection, dispatch),
        executeTilingAction: actions => dispatch(batchActions(actions))
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WindowManager);
