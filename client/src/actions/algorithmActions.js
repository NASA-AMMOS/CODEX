import * as actionTypes from "constants/actionTypes";

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
