import WorkerSocket from "worker-loader!../workers/socket.worker";

import { getGlobalSessionKey } from "../utils/utils";
import * as actionTypes from "../constants/actionTypes";

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
                sessionkey: getGlobalSessionKey(),
                selectedFeatures: [feature]
            })
        );
    });
}

function getStoredColumn(feature, getState) {
    const col = getState()
        .data.get("loadedData")
        .find(dataset => feature === dataset.get("feature"));
    if (col) return col.get("data").toJS();
}

// If we've already gotten and saved this column from the server, this function gets it from the state.
// If not, it requests it from the server, saves it to the state, and tries again.
export function getColumn(feature, dispatch, getState) {
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
