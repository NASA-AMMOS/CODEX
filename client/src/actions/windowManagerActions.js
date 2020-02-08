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

export function setWindowHover(id, hover) {
    return { type: actionTypes.SET_WINDOW_HOVER, id, hover };
}

export function resizeWindow(id, size) {
    return { type: actionTypes.WINDOW_RESIZE, id, size };
}

export function setWindowTitle(id, title) {
    return { type: actionTypes.WINDOW_SET_TITLE, id, title };
}

export function setWindowResizable(id, isResizable) {
    return { type: actionTypes.WINDOW_SET_RESIZABLE, id, isResizable };
}

export function updateWindowInfo(id, info) {
    return { type: actionTypes.UPDATE_WINDOW_INFO, id, info };
}

export function setWindowData(id, data) {
    return { type: actionTypes.WINDOW_SET_DATA, id, data };
}

export function setActiveWindow(id) {
    return { type: actionTypes.WINDOW_SET_ACTIVE, id };
}

export function moveWindow(id, position) {
    return { type: actionTypes.WINDOW_MOVE, id, position };
}

export function setWindowType(id, windowType) {
    return { type: actionTypes.WINDOW_SET_TYPE, id, windowType };
}
