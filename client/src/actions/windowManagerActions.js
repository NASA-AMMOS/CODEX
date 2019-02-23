import * as actionTypes from "constants/actionTypes";

export function openNewWindow(info) {
    return { type: actionTypes.OPEN_NEW_WINDOW, info };
}

export function closeWindow(id) {
    return { type: actionTypes.CLOSE_WINDOW, id };
}
