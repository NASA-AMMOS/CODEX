import * as actionTypes from "constants/actionTypes";
import * as workflowType from "constants/workflowTypes";
import * as uiActions from "actions/ui";
import * as uiTypes from "constants/uiTypes";
import * as utils from "utils/utils";
import * as windowManagerActions from "actions/windowManagerActions";
import * as actionFunctions from "actions/actionFunctions";


export function getExplainThisWindowAction(request) {
    return {
        type: actionTypes.OPEN_NEW_WINDOW,
        info: {
            windowType: workflowType.EXPLAIN_THIS_WINDOW,
            request:request
        }
    };
}

function createExplainThisRequest(
    filename,
    labelName,
    dataFeatures) {

    return {
        routine: 'workflow',
        dataSelections: [],
        labelName: labelName,
        workflow: "explain_this",
        dataFeatures: dataFeatures,
        file: filename,
        cid: "8ksjk",
        identification: {id: 'dev0'}
    };
}

export function createWorkflow(workflowType, selectedFeatures) {
    //right now this assumes that the workflow type is the explain this page
    return (dispatch, getState) => {
        // Get selected feature list from current state if none specified
        let selectedFeatures =
                getState()
                    .data.get("featureList")
                    .filter(f => f.get("selected"))
                    .map(f => f.get("name"))
                    .toJS();

        const filename = getState().data.get("filename");

        //todo actually setup a form for selecting a feature that gets sent to 
        //the user as a label
        const labelName = "labels";
        
        const request = createExplainThisRequest(
            filename,
            labelName,
            selectedFeatures
        );

        const requestMade = utils.makeSimpleRequest(request);
        request.requestObject = request;

        //pass the request to the workflow
        dispatch(getExplainThisWindowAction(requestMade));
    };
}
