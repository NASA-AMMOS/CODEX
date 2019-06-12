import * as actionTypes from "constants/actionTypes";
import * as workflowTypes from "constants/workflowTypes";
import * as uiActions from "actions/ui";
import * as uiTypes from "constants/uiTypes";
import * as utils from "utils/utils";
import * as windowManagerActions from "actions/windowManagerActions";
import * as actionFunctions from "actions/actionFunctions";

export function getExplainThisWindowAction() {
    return {
        type: actionTypes.OPEN_NEW_WINDOW,
        info: {
            windowType: workflowTypes.EXPLAIN_THIS_WINDOW
        }
    };
}

export const getFilterWindowAction = request => ({
    type: actionTypes.OPEN_NEW_WINDOW,
    info: {
        windowType: workflowTypes.FILTER_WINDOW
    }
});

export function createWorkflow(workflowType, selectedFeatures) {
    //right now this assumes that the workflow type is the explain this page
    switch (workflowType) {
        case workflowTypes.EXPLAIN_THIS:
            return (dispatch, getState) => {
                dispatch(getExplainThisWindowAction());
            };
        case workflowTypes.FILTER:
            console.log("dispatching filter window action");
            return (dispatch, getState) => {
                dispatch(getFilterWindowAction());
            };
        default:
            return (dispatch, getState) => {};
    }
}
