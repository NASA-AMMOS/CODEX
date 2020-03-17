import { windowManagerState } from "reducers/models/windowManager";
import WindowManagerReducer from "reducers/reducerFunctions/WindowManagerReducer";
import * as actionTypes from "constants/actionTypes";

export default function windowManager(
    state = windowManagerState,
    action,
    opt_reducer = WindowManagerReducer
) {
    switch (action.type) {
        case actionTypes.OPEN_NEW_WINDOW:
            return opt_reducer.openNewWindow(state, action);
        case actionTypes.CLOSE_WINDOW:
            return opt_reducer.closeWindow(state, action);
        case actionTypes.CLOSE_ALL_WINDOWS:
            return opt_reducer.closeAllWindows(state, action);
        case actionTypes.SET_WINDOW_TILE_ACTION_PENDING:
            return opt_reducer.tileWindows(state, action);
        case actionTypes.UPDATE_WINDOWS:
            return opt_reducer.updateWindows(state, action);
        case actionTypes.TOGGLE_MINIMIZE_WINDOW:
            return opt_reducer.toggleMinimizeWindow(state, action);
        case actionTypes.SET_WINDOW_HOVER:
            return opt_reducer.setWindowHover(state, action);
        case actionTypes.UPDATE_WINDOW_INFO:
            return opt_reducer.updateWindowInfo(state, action);
        case actionTypes.WINDOW_RESIZE:
            return opt_reducer.resizeWindow(state, action);
        case actionTypes.WINDOW_SET_RESIZABLE:
            return opt_reducer.setWindowResizable(state, action);
        case actionTypes.WINDOW_SET_TITLE:
            return opt_reducer.setWindowTitle(state, action);
        case actionTypes.WINDOW_MOVE:
            return opt_reducer.moveWindow(state, action);
        case actionTypes.WINDOW_SET_DATA:
            return opt_reducer.setWindowData(state, action);
        case actionTypes.WINDOW_SET_ACTIVE:
            return opt_reducer.setWindowActive(state, action);
        case actionTypes.WINDOW_SET_TYPE:
            return opt_reducer.setWindowType(state, action);
        case actionTypes.WINDOW_SET_NEEDS_AUTOSCALE:
            return opt_reducer.setWindowNeedsAutoscale(state, action);
        default:
            return state;
    }
}
