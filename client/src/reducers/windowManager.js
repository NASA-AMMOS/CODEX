import { windowManagerState } from "./models/windowManager";
import WindowManagerReducer from "./reducerFunctions/WindowManagerReducer";
import * as actionTypes from "../constants/actionTypes";

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
        case actionTypes.WINDOW_SET_DATA_BOUNDS:
            return opt_reducer.setWindowDataBounds(state, action);
        case actionTypes.WINDOW_SET_BIN_SIZE:
            return opt_reducer.setWindowBinSize(state, action);
        case actionTypes.WINDOW_SET_NEEDS_RESET_TO_DEFAULT:
            return opt_reducer.setWindowNeedsResetToDefault(state, action);
        case actionTypes.WINDOW_SET_AXIS_LABELS:
            return opt_reducer.setWindowAxisLabels(state, action);
        case actionTypes.WINDOW_SET_AXIS_FEATURE:
            return opt_reducer.setWindowAxisFeature(state, action);
        case actionTypes.WINDOW_SET_FEATURE_INFO:
            return opt_reducer.setWindowFeatureInfo(state, action);
        case actionTypes.WINDOW_SHOW_GRID_LINES:
            return opt_reducer.setWindowShowGridLines(state, action);
        case actionTypes.WINDOW_SET_DATA_SCALE:
            return opt_reducer.setWindowDataScale(state, action);
        case actionTypes.WINDOW_SET_DATA_MAP_TYPE:
            return opt_reducer.setWindowDataMapType(state, action);
        case actionTypes.WINDOW_SET_DATA_TREND_LINE_VISIBLE:
            return opt_reducer.setWindowTrendLineVisible(state, action);
        case actionTypes.WINDOW_SET_DATA_TREND_LINE_STYLE:
            return opt_reducer.setWindowTrendLineStyle(state, action);
        case actionTypes.WINDOW_SET_DATA_DOT_SIZE:
            return opt_reducer.setWindowDotSize(state, action);
        case actionTypes.WINDOW_SET_DATA_DOT_OPACITY:
            return opt_reducer.setWindowDotOpacity(state, action);
        case actionTypes.WINDOW_SET_DATA_DOT_SHAPE:
            return opt_reducer.setWindowDotShape(state, action);
        case actionTypes.WINDOW_SET_NEEDS_AUTOSCALE:
            return opt_reducer.setWindowNeedsAutoscale(state, action);
        case actionTypes.WINDOW_SET_NEEDS_PLOT_IMAGE:
            return opt_reducer.setWindowNeedsPlotImage(state, action);
        default:
            return state;
    }
}
