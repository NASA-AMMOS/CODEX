import * as actionTypes from "constants/actionTypes";
import * as dimensionalityReductionTypes from "constants/dimensionalityReductionTypes";
import * as dimensionalityReductionFunctions from "components/DimensionalityReduction/dimensionalityReductionFunctions";
import * as utils from "utils/utils";

export function openDimensionalityReductionWindow() {
    return {
        type: actionTypes.OPEN_NEW_WINDOW,
        info: {
            windowType: dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_WINDOW
        }
    };
}

// Creates a request object for a regression run that can be converted to JSON and sent to the server.
function createDrRequest(filename, selectedFeatures, drstate) {
    return {
        routine: "algorithm",
        algorithmName: drstate.name,
        algorithmType: "dimensionality_reduction",
        dataFeatures: selectedFeatures,
        filename,
        identification: { id: "dev0" },
        parameters: { [drstate.paramData[0].name]: drstate.paramData[0].subParams[0].value }, // UGH! This is really hacky and should be fixed when we refactor all these algo functions.
        dataSelections: [],
        downsampled: false
    };
}

export function createDrOutput(drstates, selectedFeatures, winId) {
    return (dispatch, getState) => {
        dispatch({ type: actionTypes.CLOSE_WINDOW, id: winId });

        const drsToRun = drstates
            .filter(drstate => drstate.paramData)
            .filter(drstate => drstate.selected);

        const filename = getState().data.get("filename");
        const requests = drsToRun
            .map(drstate => createDrRequest(filename, selectedFeatures, drstate))
            .map(request => {
                const { req, cancel } = utils.makeSimpleRequest(request);
                return { req, cancel, requestObj: request };
            });

        dispatch({
            type: actionTypes.OPEN_NEW_WINDOW,
            info: {
                windowType: dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_RESULTS_WINDOW,
                requests,
                runParams: { selectedFeatures }
            }
        });
    };
}
