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
    scoring
) {
    return (dispatch, getState) => {
        const filename = getState().data.get("filename");
        const requests = classifierStates
            .filter(classifierState => classifierState.paramData)
            .filter(classifierState => classifierState.selected)
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
            .map(req => utils.makeSimpleRequest(req, data => console.log(data)));
    };
}
