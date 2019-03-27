import * as actionTypes from "constants/actionTypes";

export function createSelection(rowIndices) {
    return { type: actionTypes.CREATE_SELECTION, rowIndices };
}

export function setCurrentSelection(rowIndices) {
    return { type: actionTypes.SET_CURRENT_SELECTION, rowIndices };
}
