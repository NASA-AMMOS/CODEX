import "components/WindowManager/WindowManagerStyles.css";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import React from "react";

import ClusterAlgorithm from "components/Algorithms/ClusterAlgorithm";
import Cristal from "react-cristal/src";
import HeatmapGraph from "components/Graphs/HeatmapGraph";
import ScatterGraph from "components/Graphs/ScatterGraph";
import * as algorithmTypes from "constants/algorithmTypes";
import * as uiTypes from "constants/uiTypes";
import * as windowManagerActions from "actions/windowManagerActions";
import * as windowSettings from "constants/windowSettings";

function getTwoAxisGraphTitle(win) {
    const selectedFeatures = win.data.get("featureList").filter(f => f.get("selected"));
    return `${selectedFeatures.get(0).get("name")} vs ${selectedFeatures.get(1).get("name")}`;
}

function getWindowTitle(win) {
    switch (win.windowType) {
        case uiTypes.SCATTER_GRAPH:
        case uiTypes.HEATMAP_GRAPH:
            return getTwoAxisGraphTitle(win);
        case algorithmTypes.CLUSTER_ALGORITHM:
            return `Algorithm: ${win.windowType}`;
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
            restrictToParentDiv: true,
            initialSize: windowSettings.initialSizes[win.windowType] || null
        };
        return (
            <Cristal
                key={win.id}
                className="newWindow"
                onClose={_ => props.closeWindow(win.id)}
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
