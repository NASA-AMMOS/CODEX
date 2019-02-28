import * as uiTypes from "constants/uiTypes";
import selectionModel from "reducers/models/selections";

export default class SelectionsReducer {
    static createSelection(state, action) {
        state.selections.push(
            Object.assign(selectionModel, { name: action.name, rowIndex: action.rowIndex })
        );
    }
}
