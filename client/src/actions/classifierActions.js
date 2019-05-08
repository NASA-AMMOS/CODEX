import * as actionTypes from "constants/actionTypes";
import * as classifierTypes from "constants/classifierTypes";
import * as actionFunctions from "actions/actionFunctions";
import * as utils from "utils/utils";
import * as classifierFunctions from "components/Classifiers/classifierFunctions";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

export function openClassifierWindow() {
    return {
        type: actionTypes.OPEN_NEW_WINDOW,
        info: {
            windowType: classifierTypes.CLASSIFIER_WINDOW
        }
    };
}

function createClassifierRequest(
    filename,
    selectedFeatures,
    crossVal,
    labelName,
    searchType,
    scoring,
    classifierState
) {
    return {
        routine: "algorithm",
        algorithmName: classifierState.name,
        algorithmType: "classification",
        dataFeatures: selectedFeatures.filter(f => f !== labelName),
        filename,
        identification: { id: "dev0" },
        parameters:
            classifierState.paramData.mode === "range"
                ? {
                      [classifierState.paramData.name]: classifierFunctions.createRange(
                          classifierState.paramData.params
                      )
                  }
                : {},
        dataSelections: [],
        downsampled: false,
        cross_val: parseInt(crossVal),
        labelName,
        search_type: searchType,
        scoring
    };
}

export function createClassifierOutput(
    classifierStates,
    selectedFeatures,
    crossVal,
    labelName,
    searchType,
    scoring,
    winId
) {
    return (dispatch, getState) => {
        // Close classifier options window and open a loading window
        dispatch({ type: actionTypes.CLOSE_WINDOW, id: winId });

        // Give our new loading "window" an ID
        const loadingWindowId = Math.random()
            .toString(36)
            .substring(7);

        dispatch({
            type: actionTypes.OPEN_NEW_WINDOW,
            info: {
                windowType: classifierTypes.CLASSIFIER_LOADING_WINDOW,
                minimized: true,
                minimizedOnly: true,
                id: loadingWindowId
            }
        });

        const classifiersToRun = classifierStates
            .filter(classifierState => classifierState.paramData)
            .filter(classifierState => classifierState.selected);

        const totalEta = classifiersToRun.every(classifierState => classifierState.eta === null)
            ? null
            : classifiersToRun.reduce((acc, classifierState) => acc + classifierState.eta, 0);

        const filename = getState().data.get("filename");
        const requests = classifiersToRun
            .map(classifierState =>
                createClassifierRequest(
                    filename,
                    selectedFeatures,
                    crossVal,
                    labelName,
                    searchType,
                    scoring,
                    classifierState
                )
            )
            .map(request => {
                const { req, _ } = utils.makeSimpleRequest(request);
                return req;
            });

        Promise.all(requests).then(requests => {
            dispatch({ type: actionTypes.CLOSE_WINDOW, id: loadingWindowId });
            dispatch({
                type: actionTypes.OPEN_NEW_WINDOW,
                info: {
                    windowType: classifierTypes.CLASSIFIER_RESULTS_WINDOW,
                    data: requests,
                    runParams: { selectedFeatures, crossVal, labelName }
                }
            });
        });
    };
}
