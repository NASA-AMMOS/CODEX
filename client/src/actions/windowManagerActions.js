import * as actionTypes from "constants/actionTypes";
import ShelfPack from "@mapbox/shelf-pack";
import * as windowSettings from "constants/windowSettings";

export function openNewWindow(info) {
    return { type: actionTypes.OPEN_NEW_WINDOW, info };
}

export function closeWindow(id) {
    return { type: actionTypes.CLOSE_WINDOW, id };
}

export function setWindowTileAction(isPending) {
    return { type: actionTypes.SET_WINDOW_TILE_ACTION_PENDING, isPending };
}

export function toggleMinimizeWindow(id) {
    return { type: actionTypes.TOGGLE_MINIMIZE_WINDOW, id };
}
