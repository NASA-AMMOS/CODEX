import * as actionTypes from "../constants/actionTypes";
import * as workflowTypes from "../constants/workflowTypes";

export function getExplainThisWindowAction() {
    return {
        type: actionTypes.OPEN_NEW_WINDOW,
        info: {
            windowType: workflowTypes.EXPLAIN_THIS_WINDOW
        }
    };
}

export function getGeneralClassifierWindowAction() {
    return {
        type: actionTypes.OPEN_NEW_WINDOW,
        info: {
            windowType: workflowTypes.GENERAL_CLASSIFIER_WINDOW
        }
    };
}

export function getFindMoreLikeThisWindowAction() {
    return {
        type: actionTypes.OPEN_NEW_WINDOW,
        info: {
            windowType: workflowTypes.FIND_MORE_LIKE_THIS_WINDOW
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
        case workflowTypes.FIND_MORE_LIKE_THIS:
            return (dispatch, getState) => {
                dispatch(getFindMoreLikeThisWindowAction());
            };
        case workflowTypes.GENERAL_CLASSIFIER:
            return (dispatch, getState) => {
                dispatch(getGeneralClassifierWindowAction());
            };
        default:
            return (dispatch, getState) => {};
    }
}
