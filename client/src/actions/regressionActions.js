import * as actionTypes from "constants/actionTypes";
import * as regressionTypes from "constants/regressionTypes";
import * as actionFunctions from "actions/actionFunctions";
import * as utils from "utils/utils";
import * as regressionFunctions from "components/regressions/regressionFunctions";

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

// Creates a request object for a regression run that can be converted to JSON and sent to the server.
function createRegressionRequest(
    filename,
    selectedFeatures,
    crossVal,
    labelName,
    searchType,
    scoring,
    regressionState
) {
    return {
        routine: "algorithm",
        algorithmName: regressionState.name,
        algorithmType: "regression",
        dataFeatures: selectedFeatures.filter(f => f !== labelName),
        filename,
        identification: { id: "dev0" },
        parameters:
            regressionState.paramData.mode === "range"
                ? {
                      [regressionState.paramData.name]: regressionFunctions.createRange(
                          regressionState.paramData.params
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

/* Function to run a set of selected regressions and their user-selected inputs.
Creates a server request for each chosen regression, sends that request to the server,
closes the regression select window and opens a new one while handing off the server requests (as Promises)
to the regressionResults window. */

export function createRegressionOutput(
    regressionStates,
    selectedFeatures,
    crossVal,
    labelName,
    searchType,
    scoring,
    winId
) {
    return (dispatch, getState) => {
        // Close regression options window and open a loading window
        dispatch({ type: actionTypes.CLOSE_WINDOW, id: winId });

        const regressionsToRun = regressionStates
            .filter(regressionState => regressionState.paramData)
            .filter(regressionState => regressionState.selected);

        const filename = getState().data.get("filename");
        const requests = regressionsToRun
            .map(regressionState =>
                createRegressionRequest(
                    filename,
                    selectedFeatures,
                    crossVal,
                    labelName,
                    searchType,
                    scoring,
                    regressionState
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
