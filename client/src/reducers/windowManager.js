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
        default:
            return state;
    }
}
