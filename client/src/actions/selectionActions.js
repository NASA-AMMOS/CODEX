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

export function saveNewSelection(name, rowIndices) {
    return { type: actionTypes.SAVE_NEW_SELECTION, name, rowIndices };
}

export function deleteSelection(name) {
    return { type: actionTypes.DELETE_SELECTION, name };
}
