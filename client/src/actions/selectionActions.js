import * as actionTypes from "constants/actionTypes";

export function createSelection(name, rowIndices) {
    return { type: actionTypes.CREATE_SELECTION, name, rowIndices };
}
