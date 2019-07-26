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

export function saveNewSelection(name, rowIndices, groupID) {
    return { type: actionTypes.SAVE_NEW_SELECTION, name, rowIndices, groupID};
}

export function removeAllSelections() {
    return {type: actionTypes.REMOVE_ALL_SELECTIONS};
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

export function setSelectionGroup(id, groupID) {
    return {type: actionTypes.SET_SELECTION_GROUP, id, groupID};
}

export function createSelectionGroup(id) {
    return {type: actionTypes.CREATE_SELECTION_GROUP, id};
}

export function toggleGroupActive(id) {
    return {type: actionTypes.TOGGLE_GROUP_ACTIVE, id};
}

export function toggleGroupHidden(id) {
    return {type: actionTypes.TOGGLE_GROUP_HIDDEN, id};
}
