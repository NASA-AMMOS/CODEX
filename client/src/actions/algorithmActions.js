import * as actionTypes from "constants/actionTypes";
import { getSubAlgorithmData } from "components/Algorithms/algorithmFunctions";
import * as algorithmTypes from "constants/algorithmTypes";
import * as graphActions from "actions/graphActions";
import * as uiTypes from "constants/uiTypes";

export function createAlgorithm(algoMode) {
    return (dispatch, getState) => {
        dispatch({
            type: actionTypes.OPEN_NEW_WINDOW,
            info: {
                windowType: algoMode,
                selectedFeatures: getState()
                    .data.get("featureList")
                    .filter(f => f.get("selected"))
                    .map(f => f.get("name")),
                filename: getState().data.get("filename")
            }
        });
    };
}

function handleAlgorithmReturn(inMsg, subalgoState, dispatch) {
    console.log(inMsg);
    console.log(subalgoState);

    // Update data store with new feature columns
    const basename = subalgoState.outputParams.find(param => param.name === "name").value;
    const featureList = [];
    for (let i = 0; i < inMsg.data[0].length; i++) {
        const feature = `${basename}_pca${i + 1}`;
        featureList.push(feature);
        dispatch({ type: actionTypes.ADD_FEATURE, feature });
        dispatch({
            type: actionTypes.ADD_DATASET,
            feature,
            data: inMsg.data.map(row => row[i])
        });
    }

    // Spawn graph window if requested
    if (subalgoState.outputParams.find(param => param.name === "graph").value) {
        dispatch(graphActions.createGraph(uiTypes.SCATTER_GRAPH, featureList));
    }
}

export function runAlgorithm(subalgoState, selectedFeatures, winId) {
    return (dispatch, getState) => {
        dispatch({ type: actionTypes.CLOSE_WINDOW, id: winId });

        // Give our new loading "window" an ID
        const loadingWindowId = Math.random()
            .toString(36)
            .substring(7);

        dispatch({
            type: actionTypes.OPEN_NEW_WINDOW,
            info: {
                windowType: algorithmTypes.ALGO_LOADING_WINDOW,
                minimized: true,
                minimizedOnly: true,
                id: loadingWindowId
            }
        });

        // Right now, the only metric we have of algorithm processing time is the ETA we got from
        // the preview run, so we set a timer. The "window" object contains the latest ETA for the algo run.
        const expectedEndTime = Date.now() + subalgoState.serverData.eta * 1000;
        const loadingTimerInterval = setInterval(_ => {
            const secRemaining = (expectedEndTime - Date.now()) / 1000;
            if (secRemaining > 0) {
                dispatch({
                    type: actionTypes.UPDATE_WINDOW_INFO,
                    id: loadingWindowId,
                    info: { loadingSecRemaining: secRemaining | 0 }
                });
                return;
            }
            clearInterval(loadingTimerInterval);
        }, 1000);

        getSubAlgorithmData(
            subalgoState,
            selectedFeatures,
            getState().data.get("filename"),
            inMsg => {
                clearInterval(loadingTimerInterval);
                dispatch({ type: actionTypes.CLOSE_WINDOW, id: loadingWindowId });
                handleAlgorithmReturn(inMsg, subalgoState, dispatch);
            },
            false
        );
    };
}
