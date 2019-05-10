import * as actionTypes from "constants/actionTypes";
import * as regressionTypes from "constants/regressionTypes";
import * as actionFunctions from "actions/actionFunctions";
import * as utils from "utils/utils";
import * as classifierFunctions from "components/Classifiers/classifierFunctions";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

export function openRegressionWindow() {
    return {
        type: actionTypes.OPEN_NEW_WINDOW,
        info: {
            windowType: regressionTypes.REGRESSION_WINDOW
        }
    };
}

// Creates a request object for a classifier run that can be converted to JSON and sent to the server.
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

/* Function to run a set of selected classifiers and their user-selected inputs.
Creates a server request for each chosen classifier, sends that request to the server,
closes the classifier select window and opens a new one while handing off the server requests (as Promises)
to the ClassifierResults window. */

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

        const classifiersToRun = classifierStates
            .filter(classifierState => classifierState.paramData)
            .filter(classifierState => classifierState.selected);

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
                const { req, cancel } = utils.makeSimpleRequest(request);
                return { req, cancel, requestObj: request };
            });

        dispatch({
            type: actionTypes.OPEN_NEW_WINDOW,
            info: {
                windowType: regressionTypes.REGRESSION_RESULTS_WINDOW,
                requests,
                runParams: { selectedFeatures, crossVal, labelName, scoring, searchType }
            }
        });
    };
}
