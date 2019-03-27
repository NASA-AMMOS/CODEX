import * as uiTypes from "constants/uiTypes";
import * as selectionState from "reducers/models/selections";

export default class SelectionsReducer {
    static setCurrentSelection(state, action) {
        return { ...state, currentSelection: action.rowIndices };
    }

    static createSelection(state, action) {
        return {
            ...state,
            selections: state.selections.concat([action.rowIndices])
        };
    }
}
