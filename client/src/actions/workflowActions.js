import * as actionTypes from "constants/actionTypes";
import * as uiActions from "actions/ui";
import * as uiTypes from "constants/uiTypes";
import * as windowManagerActions from "actions/windowManagerActions";
import * as actionFunctions from "actions/actionFunctions";

export function createWorkflow(workflowType, selectedFeatures) {
    return (dispatch, getState) => {
        // Get selected feature list from current state if none specified
        selectedFeatures =
            selectedFeatures ||
            getState()
                .data.get("featureList")
                .filter(f => f.get("selected"))
                .map(f => f.get("name"))
                .toJS();
        console.log(workflowType);

        Promise.all(
            selectedFeatures.map(feature => actionFunctions.getColumn(feature, dispatch, getState))
        ).then(cols => {
            const workflowData = cols.reduce((acc, col) => {
                col.forEach((val, idx) => {
                    acc[idx] = acc[idx] || [];
                    acc[idx].push(val);
                });
                return acc;
            }, []);

            dispatch({
                type: actionTypes.OPEN_NEW_WINDOW,
                info: {
                    windowType: workflowType,
                    data: getState().data.set("data", workflowData)
                }
            });
        });
    };
}
