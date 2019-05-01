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

function createClassifierRequest(filename, selectedFeatures, classifierState) {
    return {
        routine: "algorithm",
        algorithmName: classifierState.name,
        algorithmType: "classification",
        dataFeatures: selectedFeatures.toJS(),
        filename,
        identification: { id: "dev0" },
        parameters:
            classifierState.params[0].mode === "range"
                ? {
                      [classifierState.params[0].name]: classifierFunctions.createRange(
                          classifierState.params[0]
                      )
                  }
                : {},
        dataSelections: [],
        downsampled: false
    };
}

export function createClassifierOutput(classifierStates, selectedFeatures) {
    return (dispatch, getState) => {
        const filename = getState().data.get("filename");
        const requests = classifierStates
            .filter(classifierState => classifierState.params.length)
            .map(classifierState =>
                createClassifierRequest(filename, selectedFeatures, classifierState)
            )
            .map(req => utils.makeSimpleRequest(req, data => console.log(data)));
    };
}
