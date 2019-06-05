import { uiState } from "reducers/models/ui";
import UiReducer from "reducers/reducerFunctions/UiReducer";
import * as actionTypes from "constants/actionTypes";

export default function ui(state = uiState, action, opt_reducer = UiReducer) {
    switch (action.type) {
        case actionTypes.OPEN_GRAPH:
            return opt_reducer.openGraph(state, action);
        case actionTypes.OPEN_ALGORITHM:
            return opt_reducer.openAlgorithm(state, action);
        case actionTypes.OPEN_REPORT:
            return opt_reducer.openReport(state, action);
        case actionTypes.OPEN_DEVELOPMENT:
            return opt_reducer.openDevelopment(state, action);
        case actionTypes.OPEN_WORKFLOW:
            return opt_reducer.openWorkflow(state, action);
        // case actionTypes.BRUSHTYPE_SET:
        //     return opt_reducer.brushtypeSet(state, action);
        // case actionTypes.BRUSHID_SET:
        //     return opt_reducer.brushIdSet(state, action);
        case actionTypes.MODE_SET:
            return opt_reducer.modeSet(state, action);
        case actionTypes.ADD_TO_HISTORY:
            return opt_reducer.addToHistory(state, action);
        case actionTypes.CHANGE_GLOBAL_CHART_STATE:
            return opt_reducer.changeGlobalChartState(state, action);
        default:
            return state;
    }
}
