import React, { Component } from "react";
import Cristal from "react-cristal/src";
import { connect } from "react-redux";
import * as windowManagerActions from "actions/windowManagerActions";
import { bindActionCreators } from "redux";
import ScatterGraph from "components/Graphs/ScatterGraph";
import HeatmapGraph from "components/Graphs/HeatmapGraph";
import ClusterAlgorithm from "components/Algorithms/ClusterAlgorithm";
import * as uiTypes from "constants/uiTypes";
import "components/WindowManager/WindowManagerStyles.css";
import * as algorithmTypes from "constants/algorithmTypes";

function getTwoAxisGraphTitle(win) {
    const selectedFeatures = win.data.get("featureList").filter(f => f.get("selected"));
    return `${selectedFeatures.get(0).get("name")} vs ${selectedFeatures.get(1).get("name")}`;
}

function getWindowTitle(win) {
    switch (win.windowType) {
        case uiTypes.SCATTER_GRAPH:
        case uiTypes.HEATMAP_GRAPH:
            return getTwoAxisGraphTitle(win);
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
                <ClusterAlgorithm selectedFeatures={win.selectedFeatures} filename={win.filename} />
            );
    }
}

function WindowManager(props) {
    return props.windows.map((win, idx) => {
        const settings = win.settings || {
            title: getWindowTitle(win),
            children: null,
            isResizeable: true,
            isDraggable: true,
            initialPosition: "top-left",
            restrictToParentDiv: true
        };
        return (
            <Cristal
                key={idx}
                className="newWindow"
                onClose={_ => props.closeWindow(idx)}
                {...settings}
            >
                <div className="windowBody">{getWindowContent(win)}</div>
            </Cristal>
        );
    });
}

function mapStateToProps(state) {
    return {
        windows: state.windowManager.get("windows")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        openNewWindow: bindActionCreators(windowManagerActions.openNewWindow, dispatch),
        closeWindow: bindActionCreators(windowManagerActions.closeWindow, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(WindowManager);
