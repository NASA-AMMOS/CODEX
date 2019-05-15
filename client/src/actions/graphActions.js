import * as actionTypes from "constants/actionTypes";
import * as uiActions from "actions/ui";
import * as uiTypes from "constants/uiTypes";
import * as windowManagerActions from "actions/windowManagerActions";
import * as actionFunctions from "actions/actionFunctions";

function alertNotEnoughFeatures() {
    alert("Please select 2 features in the features list to create this graph.");
}

function canBuildGraph(graphMode, dataState) {
    switch (graphMode) {
        case uiTypes.SCATTER_GRAPH:
        case uiTypes.CONTOUR_GRAPH:
            if (dataState.get("featureList").filter(f => f.get("selected")).size < 2) {
                alertNotEnoughFeatures();
                return false;
            }
            break;
    }
    return true;
}

export function createGraph(graphMode, selectedFeatures) {
    return (dispatch, getState) => {
        // Get selected feature list from current state if none specified
        selectedFeatures =
            selectedFeatures ||
            getState()
                .data.get("featureList")
                .filter(f => f.get("selected"))
                .map(f => f.get("name"))
                .toJS();

        if (!canBuildGraph(graphMode, getState().data)) return { type: actionTypes.NO_ACTION };

        Promise.all(
            selectedFeatures.map(feature => actionFunctions.getColumn(feature, dispatch, getState))
        ).then(cols => {
            const graphData = cols.reduce((acc, col) => {
                col.forEach((val, idx) => {
                    acc[idx] = acc[idx] || [];
                    acc[idx].push(val);
                });
                return acc;
            }, []);

            dispatch({
                type: actionTypes.OPEN_NEW_WINDOW,
                info: {
                    windowType: graphMode,
                    data: getState().data.set("data", graphData)
                }
            });
        });
    };
}
