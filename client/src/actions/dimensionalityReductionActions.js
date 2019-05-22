import * as actionTypes from "constants/actionTypes";
import * as dimensionalityReductionTypes from "constants/dimensionalityReductionTypes";
import * as dimensionalityReductionFunctions from "components/DimensionalityReduction/dimensionalityReductionFunctions";
import * as utils from "utils/utils";

export function openDimensionalityReductionWindow() {
    return (dispatch, getState) => {
        const selectedFeatures = getState()
            .data.get("featureList")
            .filter(f => f.get("selected"))
            .map(f => f.get("name"))
            .toJS();

        const requests = dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_TYPES.map(dr => {
            return {
                name: dr,
                paramData: dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_PARAMS[dr].map(
                    param =>
                        Object.assign(param, {
                            subParams: param.subParams.map(subParam =>
                                Object.assign(subParam, {
                                    value: selectedFeatures.length
                                })
                            )
                        })
                )
            };
        })
            .map(drstate =>
                createDrRequest(getState().data.get("filename"), selectedFeatures, drstate)
            )
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
