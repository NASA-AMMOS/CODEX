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

function loadColumnFromServer(feature) {
    return new Promise(resolve => {
        const socketWorker = new WorkerSocket();

        socketWorker.addEventListener("message", e => {
            const data = JSON.parse(e.data).data.map(ary => ary[0]);
            resolve(data);
        });

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.GET_GRAPH_DATA,
                selectedFeatures: [feature]
            })
        );
    });
}

function getStoredColumn(feature, getState) {
    const col = getState()
        .data.get("loadedData")
        .find(dataset => feature === dataset.feature);
    if (col) return col.data;
}

// If we've already gotten and saved this column from the server, this function gets it from the state.
// If not, it requests it from the server, saves it to the state, and tries again.
function getColumn(feature, dispatch, getState) {
    return new Promise(resolve => {
        let column = getStoredColumn(feature, getState);
        if (column) {
            column = [feature, ...column];
            return resolve(column);
        }

        loadColumnFromServer(feature).then(data => {
            dispatch({
                type: actionTypes.ADD_DATASET,
                feature,
                data
            });
            column = getStoredColumn(feature, getState);
            column = [feature, ...column];
            return resolve(column);
        });
    });
}

export function createGraph(graphMode) {
    return (dispatch, getState) => {
        const selectedFeatures = getState()
            .data.get("featureList")
            .filter(f => f.get("selected"))
            .map(f => f.get("name"))
            .toJS();

        if (!canBuildGraph(graphMode, getState().data)) return { type: actionTypes.NO_ACTION };

        Promise.all(selectedFeatures.map(feature => getColumn(feature, dispatch, getState))).then(
            cols => {
                const graphData = cols.reduce((acc, col) => {
                    col.forEach((val, idx) => {
                        acc[idx] = acc[idx] || [];
                        acc[idx].push(val);
                    });
                    return acc;
                }, []);

                dispatch({
                    type: actionTypes.OPEN_NEW_WINDOW,
                    info: {
                        windowType: graphMode,
                        data: getState().data.set("data", graphData)
                    }
                });
            }
        );
    };
}
