import { put, takeEvery, delay, select } from "redux-saga/effects";
import { WINDOW_SET_DATA_DOWNSAMPLE } from "../constants/actionTypes";
import { featureSelect, featuresUnselectAll } from "../actions/data";
import { setCurrentSelection } from "../actions/selectionActions";
import { openNewWindow, closeWindow } from "../actions/windowManagerActions";
import { batchActions } from "redux-batched-actions";

/*
 * MEGA HACKS
 *
 * Because I can't get live data swapping working on each graph in a reasonable
 * timeframe, this will instead attempt to create a new window with the requested
 * settings
 *
 * Turns out it works pretty well.
 */
function* interceptDownsampleRequest(action) {
    // Downsample request contains:
    // id : id of active window (will close the window)
    // downsample: downsample ID

    const get_window = state =>
        state.windowManager.get("windows").find(win => win.get("id") === action.id);

    const win = yield select(get_window);

    let win_info = {
        ...win.toJS()
    };
    win_info.data.downsample = action.downsample;
    const old_id = win_info.id;
    win_info.id = Math.random()
        .toString(36)
        .substring(7);

    yield put(batchActions([openNewWindow(win_info), closeWindow(old_id)]));
}

function* watchDownsampleRequests() {
    yield takeEvery(WINDOW_SET_DATA_DOWNSAMPLE, interceptDownsampleRequest);
}

export default watchDownsampleRequests;
