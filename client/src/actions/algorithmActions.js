import * as actionTypes from "constants/actionTypes";
import { getSubAlgorithmData } from "components/Algorithms/algorithmFunctions";
import * as algorithmTypes from "constants/algorithmTypes";

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

export function runAlgorithm(subalgoState, selectedFeatures, winId) {
    return (dispatch, getState) => {
        console.log(subalgoState);
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
                dispatch({ type: actionTypes.CLOSE_WINDOW, id: loadingWindowId });
                clearInterval(loadingTimerInterval);
                console.log(inMsg);
            },
            false
        );
    };
}
