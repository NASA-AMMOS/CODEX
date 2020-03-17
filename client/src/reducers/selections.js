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
        case actionTypes.TOGGLE_SELECTION_HIDDEN:
            return opt_reducer.toggleSelectionHidden(state, action);
        case actionTypes.SAVE_NEW_SELECTION:
            return opt_reducer.saveNewSelection(state, action);
        case actionTypes.DELETE_SELECTION:
            return opt_reducer.deleteSelection(state, action);
        case actionTypes.RENAME_SELECTION:
            return opt_reducer.renameSelection(state, action);
        case actionTypes.HOVER_SELECTION:
            return opt_reducer.hoverSelection(state, action);
        case actionTypes.CREATE_SELECTION_GROUP:
            return opt_reducer.createSelectionGroup(state, action);
        case actionTypes.TOGGLE_GROUP_HIDDEN:
            return opt_reducer.toggleGroupHidden(state, action);
        case actionTypes.TOGGLE_GROUP_ACTIVE:
            return opt_reducer.toggleGroupActive(state, action);
        case actionTypes.REMOVE_ALL_SELECTIONS:
            return opt_reducer.removeAllSelections(state, action);
        case actionTypes.DELETE_SELECTION_GROUP:
            return opt_reducer.deleteSectionGroup(state, action);
        case actionTypes.RENAME_SELECTION_GROUP:
            return opt_reducer.renameSectionGroup(state, action);
        case actionTypes.SET_SELECTION_ACTIVE:
            return opt_reducer.setSelectionActive(state, action);
        case actionTypes.SET_SELECTION_GROUP:
            return opt_reducer.setSelectionGroup(state, action);
        case actionTypes.SET_SELECTION_HIDDEN:
            return opt_reducer.setSelectionHidden(state, action);
        case actionTypes.SET_GROUP_ACTIVE:
            return opt_reducer.setGroupActive(state, action);
        case actionTypes.SET_GROUP_HIDDEN:
            return opt_reducer.setGroupHidden(state, action);
        default:
            return state;
    }
}
