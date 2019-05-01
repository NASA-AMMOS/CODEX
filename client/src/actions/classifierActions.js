import * as actionTypes from "constants/actionTypes";
import * as classifierTypes from "constants/classifierTypes";
import * as actionFunctions from "actions/actionFunctions";
import * as utils from "utils/utils";
import * as classifierFunctions from "components/Classifiers/classifierFunctions";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

export function openClassifierWindow() {
    return (dispatch, getState) => {
        const colName = getState()
            .data.get("featureList")
            .filter(f => f.get("selected"))
            .map(f => f.get("name"))
            .get(0);

        actionFunctions.getColumn(colName, dispatch, getState).then(col =>
            dispatch({
                type: actionTypes.OPEN_NEW_WINDOW,
                info: {
                    windowType: classifierTypes.CLASSIFIER_WINDOW,
                    selectedFeatures: getState()
                        .data.get("featureList")
                        .filter(f => f.get("selected"))
                        .map(f => f.get("name")),
                    selectedFeatureLength: col.length
                }
            })
        );
    };
}

function createClassifierRequest(filename, classifierState) {
    return {
        routine: "algorithm",
        algorithmName: classifierState.name,
        algorithmType: "classification",
        dataFeatures:
            classifierState.params[0].mode === "range"
                ? classifierFunctions.createRange(classifierState.params[0])
                : [],
        filename,
        identification: { id: "dev0" },
        parameters: { downsampled: true, eps: [0.7], k: [1, 2, 3, 4, 5] },
        dataSelections: []
    };
}

export function createClassifierOutput(classifierStates) {
    return (dispatch, getState) => {
        const filename = getState().data.get("filename");
        const requests = classifierStates
            .filter(classifierState => classifierState.params.length)
            .map(classifierState => createClassifierRequest(filename, classifierState))
            .map(utils.makeSimpleRequest);
    };
}
