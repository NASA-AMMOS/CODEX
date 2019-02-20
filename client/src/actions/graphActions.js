import * as actionTypes from "constants/actionTypes";
import * as uiActions from "actions/ui";
import * as uiTypes from "constants/uiTypes";
import * as windowManagerActions from "actions/windowManagerActions";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

function alertNotEnoughFeatures() {
    alert("Please select 2 features in the features list to create this graph.");
}

function canBuildGraph(graphMode, dataState) {
    switch (graphMode) {
        case uiTypes.SCATTER_GRAPH:
        case uiTypes.HEATMAP_GRAPH:
            if (dataState.get("featureList").filter(f => f.get("selected")).size < 2) {
                alertNotEnoughFeatures();
                return false;
            }
            break;
    }
    return true;
}

export function createGraph(graphMode) {
    return (dispatch, getState) => {
        const selectedFeatures = getState()
            .data.get("featureList")
            .filter(f => f.get("selected"))
            .map(f => f.get("name"))
            .toJS();

        if (!canBuildGraph(graphMode, getState().data)) return { type: actionTypes.NO_ACTION };

        const socketWorker = new WorkerSocket();

        socketWorker.addEventListener("message", e => {
            const data = JSON.parse(e.data).data;

            // This is a bit of a hack to make the data structure look like it used to when we were parsing whole files.
            data.unshift(selectedFeatures);
            dispatch({ type: actionTypes.UPDATE_DATA, data });
            dispatch({
                type: actionTypes.OPEN_NEW_WINDOW,
                info: {
                    windowType: graphMode,
                    data: getState().data
                }
            });
        });

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.GET_GRAPH_DATA,
                selectedFeatures
            })
        );
    };
}
