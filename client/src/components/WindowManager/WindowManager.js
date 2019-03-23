import "components/WindowManager/WindowManagerStyles.scss";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import React, { useState, useLayoutEffect, useEffect, useRef } from "react";

import ClusterAlgorithm from "components/Algorithms/ClusterAlgorithm";
import Cristal from "react-cristal/src";
import HeatmapGraph from "components/Graphs/HeatmapGraph";
import ScatterGraph from "components/Graphs/ScatterGraph";
import * as algorithmTypes from "constants/algorithmTypes";
import * as uiTypes from "constants/uiTypes";
import * as windowManagerActions from "actions/windowManagerActions";
import * as windowSettings from "constants/windowSettings";
import ShelfPack from "@mapbox/shelf-pack";
import classnames from "classnames";

function getTwoAxisGraphTitle(win) {
    const selectedFeatures = win.data.get("featureList").filter(f => f.get("selected"));
    return `${selectedFeatures.get(0).get("name")} vs ${selectedFeatures.get(1).get("name")}`;
}

function previewAllowed(win) {
    switch (win.windowType) {
        case algorithmTypes.CLUSTER_ALGORITHM:
        case algorithmTypes.ALGO_LOADING_WINDOW:
            return false;
        default:
            return true;
    }
}

function getWindowTitle(win) {
    switch (win.windowType) {
        case uiTypes.SCATTER_GRAPH:
        case uiTypes.HEATMAP_GRAPH:
            return getTwoAxisGraphTitle(win);
        case algorithmTypes.CLUSTER_ALGORITHM:
            return `Algorithm: ${win.windowType}`;
        case algorithmTypes.ALGO_LOADING_WINDOW:
            return `Loading Algorithm ${
                win.loadingSecRemaining ? "(" + win.loadingSecRemaining + "s)" : ""
            }`;
        default:
            return "";
    }
}

function getWindowContent(win) {
    switch (win.windowType) {
        case uiTypes.SCATTER_GRAPH:
            return <ScatterGraph data={win.data} />;
        case uiTypes.HEATMAP_GRAPH:
            return <HeatmapGraph data={win.data} />;
        case algorithmTypes.CLUSTER_ALGORITHM:
            return (
                <ClusterAlgorithm
                    selectedFeatures={win.selectedFeatures}
                    filename={win.filename}
                    winId={win.id}
                />
            );
    }
}

function tileWindows(props, refs) {
    const windowContainer = document.getElementById("Container");
    const bounds = windowContainer.getBoundingClientRect();
    const sprite = new ShelfPack(bounds.width, bounds.height, { autoResize: true });

    const oldWindows = props.windows;
    const packReqs = oldWindows
        .map(win => {
            const { width, height } = windowSettings.initialSizes[win.windowType];
            return { id: win.id, width: width + 5, height: height + 5 }; // Add some buffer
        })
        .toJS();

    const packed = sprite.pack(packReqs);

    Object.keys(refs.current).forEach(key => {
        const { x, y } = packed.find(p => p.id === key);
        refs.current[key].snapToPosition({ x, y });
    });
}

function makeMinimizedBar(props) {
    return (
        <div className="minimizedBar">
            {props.windows
                .filter(win => win.minimized)
                .map(win => (
                    <div
                        key={win.id}
                        onClick={_ => props.toggleMinimizeWindow(win.id)}
                        onMouseOver={_ => props.setWindowHover(win.id, true)}
                        onMouseOut={_ => props.setWindowHover(win.id, false)}
                        className="minimizedWindow"
                    >
                        <div className="title">{getWindowTitle(win)}</div>
                    </div>
                ))}
        </div>
    );
}

function WindowManager(props) {
    const refs = useRef({}); // Store refs to all the open windows so we can do global window operations
    // Each time the windows list gets updated, delete old refs.
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
            tileWindows(props, refs);
            props.setWindowTileAction(false);
        },
        [props.tileActionPending]
    );

    const windows = props.windows
        .filter(win => !win.minimizedOnly)
        .map((win, idx) => {
            const { width, height, resizeable } = windowSettings.initialSizes[win.windowType];
            const settings = win.settings || {
                title: getWindowTitle(win),
                children: null,
                isResizeable: resizeable,
                isDraggable: true,
                initialPosition: "top-left",
                restrictToParentDiv: true,
                initialSize: { width, height }
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
                    style={
                        win.minimized
                            ? win.hover && previewAllowed(win)
                                ? previewStyle
                                : hiddenStyle
                            : null
                    }
                    onClose={_ => props.closeWindow(win.id)}
                    ref={r => (refs.current[win.id] = r)}
                    onMinimize={_ => props.toggleMinimizeWindow(win.id)}
                    isFixed={win.minimized}
                    hideHeader={win.minimized}
                    {...settings}
                >
                    <div className="windowBody">{getWindowContent(win)}</div>
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
