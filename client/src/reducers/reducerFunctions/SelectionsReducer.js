import * as uiTypes from "constants/uiTypes";
import * as selectionState from "reducers/models/selections";

export default class SelectionsReducer {
    static createSelection(state, action) {
        const newSelection = Object.assign(selectionState.selectionModel, {
            name: action.name,
            rowIndices: action.rowIndices
        });
        return {
            ...state,
            selections: state.selections.concat([newSelection])
        };
    }
}
