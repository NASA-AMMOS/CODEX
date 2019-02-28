import * as actionTypes from "constants/actionTypes";

export function createSelection(rowIndex, name) {
    return { type: actionTypes.CREATE_SELECTION, rowIndex, name };
}
