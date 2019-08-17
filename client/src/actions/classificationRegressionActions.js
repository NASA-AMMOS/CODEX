import * as actionTypes from "constants/actionTypes";
import * as classificationTypes from "constants/classificationRegressionTypes";
import * as actionFunctions from "actions/actionFunctions";
import * as utils from "utils/utils";
import * as classificationFunctions from "components/Classification/classificationFunctions";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

function formatClassificationParam(param) {
    switch (param.mode) {
        case "range":
            return classificationFunctions.createRange(param.subParams);
        case "rangeWithNull":
            return classificationFunctions.createRange(param.subParams, true);
    }
}

// Creates a request object for a classification run that can be converted to JSON and sent to the server.
function createClassificationRequest(
    algorithmType,
    filename,
    selectedFeatures,
    crossVal,
    labelName,
    searchType,
    scoring,
    classificationState
) {
    const parameters = classificationState.paramData.map(param => {
        return { [param.name]: formatClassificationParam(param) };
    });

    return {
        routine: "algorithm",
        algorithmName: classificationState.name,
        algorithmType,
        dataFeatures: selectedFeatures.filter(f => f !== labelName),
        filename,
        identification: { id: "dev0" },
        parameters,
        dataSelections: [],
        downsampled: false,
        cross_val: parseInt(crossVal),
        labelName,
        search_type: searchType,
        scoring
    };
}

/* Function to run a set of selected classifications and their user-selected inputs.
Creates a server request for each chosen classification, sends that request to the server,
closes the classification select window and opens a new one while handing off the server requests (as Promises)
to the ClassificationResults window. */

export function createAlgoOutput(
    algorithmType,
    classificationStates,
    selectedFeatures,
    crossVal,
    labelName,
    searchType,
    scoring,
    winId,
    resultsWindowType
) {
    return (dispatch, getState) => {
        // Close classification options window and open a loading window
        dispatch({ type: actionTypes.CLOSE_WINDOW, id: winId });

        const classificationsToRun = classificationStates
            .filter(classificationState => classificationState.paramData)
            .filter(classificationState => classificationState.selected);

        const filename = getState().data.get("filename");

        const requests = classificationsToRun
            .map(classificationState =>
                createClassificationRequest(
                    algorithmType,
                    filename,
                    selectedFeatures,
                    crossVal,
                    labelName,
                    searchType,
                    scoring,
                    classificationState
                )
            )
            .map(request => {
                const { req, cancel } = utils.makeSimpleRequest(request);
                return { req, cancel, requestObj: request };
            });
        console.log(
            classificationsToRun.map(classificationState =>
                createClassificationRequest(
                    algorithmType,
                    filename,
                    selectedFeatures,
                    crossVal,
                    labelName,
                    searchType,
                    scoring,
                    classificationState
                )
            )
        );
        dispatch({
            type: actionTypes.OPEN_NEW_WINDOW,
            info: {
                windowType: resultsWindowType,
                requests,
                runParams: { selectedFeatures, crossVal, labelName, scoring, searchType }
            }
        });
    };
}
