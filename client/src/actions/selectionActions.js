import * as actionTypes from "constants/actionTypes";

export function saveCurrentSelection(rowIndices) {
    return { type: actionTypes.SAVE_CURRENT_SELECTION };
}

export function setCurrentSelection(rowIndices) {
    return { type: actionTypes.SET_CURRENT_SELECTION, rowIndices };
}

export function toggleSelectionActive(name) {
    return { type: actionTypes.TOGGLE_SELECTION_ACTIVE, name };
}
