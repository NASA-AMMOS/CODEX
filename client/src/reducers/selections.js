import { selectionsState } from "reducers/models/selections";
import SelectionsReducer from "reducers/reducerFunctions/SelectionsReducer";
import * as actionTypes from "constants/actionTypes";

export default function selections(
    state = selectionsState,
    action,
    opt_reducer = SelectionsReducer
) {
    switch (action.type) {
        case actionTypes.SET_CURRENT_SELECTION:
            return opt_reducer.setCurrentSelection(state, action);
        case actionTypes.SAVE_CURRENT_SELECTION:
            return opt_reducer.saveCurrentSelection(state, action);
        case actionTypes.TOGGLE_SELECTION_ACTIVE:
            return opt_reducer.toggleSelectionActive(state, action);
        case actionTypes.SAVE_NEW_SELECTION:
            return opt_reducer.saveNewSelection(state, action);
        default:
            return state;
    }
}
