import * as actionTypes from "constants/actionTypes";
import WorkerSocket from "worker-loader!workers/socket.worker";
import * as utils from "utils/utils";

export function saveCurrentSelection() {
    return (dispatch, getState) => {
        const name = `Selection ${getState().selections.savedSelections.length + 1}`;
        const selectionVector = getState().selections.currentSelection.reduce((acc, idx) => {
            acc[idx] = 1;
            return acc;
        }, Array(getState().data.get("dataLength")).fill(0));

        const socketWorker = new WorkerSocket();
        const request = {
            routine: "arrange",
            hashType: "selection",
            sessionkey: utils.getGlobalSessionKey(),
            activity: "add",
            data: selectionVector,
            name,
            metadata: { color: "some color" }
        };

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.SIMPLE_REQUEST,
                request
            })
        );

        dispatch({ type: actionTypes.SAVE_CURRENT_SELECTION, name });
    };
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
    return { type: actionTypes.SAVE_NEW_SELECTION, name, rowIndices, groupID };
}

export function removeAllSelections() {
    return { type: actionTypes.REMOVE_ALL_SELECTIONS };
}

export function deleteSelection(id) {
    const socketWorker = new WorkerSocket();
    const request = {
        routine: "arrange",
        hashType: "selection",
        sessionkey: utils.getGlobalSessionKey(),
        activity: "delete",
        name: [id]
    };

    socketWorker.postMessage(
        JSON.stringify({
            action: actionTypes.SIMPLE_REQUEST,
            request
        })
    );

    return { type: actionTypes.DELETE_SELECTION, id };
}

export function renameSelection(id, name) {
    return { type: actionTypes.RENAME_SELECTION, id, name };
}

export function hoverSelection(id) {
    return { type: actionTypes.HOVER_SELECTION, id };
}

export function setSelectionGroup(id, groupID) {
    return { type: actionTypes.SET_SELECTION_GROUP, id, groupID };
}

export function createSelectionGroup(id) {
    return { type: actionTypes.CREATE_SELECTION_GROUP, id };
}

export function toggleGroupActive(id) {
    return { type: actionTypes.TOGGLE_GROUP_ACTIVE, id };
}

export function toggleGroupHidden(id) {
    return { type: actionTypes.TOGGLE_GROUP_HIDDEN, id };
}
