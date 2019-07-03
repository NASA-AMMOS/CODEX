import * as actionTypes from "constants/actionTypes";

export function saveCurrentSelection(rowIndices) {
    return { type: actionTypes.SAVE_CURRENT_SELECTION };
}

export function setCurrentSelection(rowIndices) {
    return { type: actionTypes.SET_CURRENT_SELECTION, rowIndices };
}

export function toggleSelectionActive(id) {
    return { type: actionTypes.TOGGLE_SELECTION_ACTIVE, id };
}

export function toggleSelectionHidden(id) {
    return { type: actionTypes.TOGGLE_SELECTION_HIDDEN, id };
}

export function saveNewSelection(id, rowIndices) {
    return { type: actionTypes.SAVE_NEW_SELECTION, id, rowIndices };
}

export function deleteSelection(id) {
    return { type: actionTypes.DELETE_SELECTION, id };
}

export function renameSelection(id, name) {
    return { type: actionTypes.RENAME_SELECTION, id, name };
}

export function hoverSelection(id) {
    return { type: actionTypes.HOVER_SELECTION, id };
}
