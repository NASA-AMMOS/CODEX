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
 */
function* interceptDownsampleRequest(action) {
    // Downsample request contains:
    // id : id of active window (will close the window)
    // downsample: downsample ID

    const get_window = state =>
        state.windowManager.get("windows").find(win => win.get("id") === action.id);

    const get_selected_features = state =>
        state.data.get("featureList").filter(f => f.get("selected"));

    const win = yield select(get_window);
    const features_to_restore = yield select(get_selected_features);

    const features_to_select = win.getIn(["data", "features"]);
    console.log("features_to_select", features_to_select);

    console.log("dispatching batch actions", win.toJS());

    let win_info = {
        ...win.toJS()
    };
    win_info.data.downsample = action.downsample;
    const old_id = win_info.id;
    win_info.id = Math.random()
        .toString(36)
        .substring(7);

    // investigate consolidating this into the next one
    //yield put( closeWindow( win_info.id ) );

    // unselect all, select our features, then create a new window in one go
    yield put(
        batchActions([
            featuresUnselectAll(),
            ...features_to_select.map(f => featureSelect(f)),
            openNewWindow(win_info),
            closeWindow(old_id)
        ])
    );

    // HORRIBLE
    yield delay(100);
}

function* watchDownsampleRequests() {
    yield takeEvery(WINDOW_SET_DATA_DOWNSAMPLE, interceptDownsampleRequest);
}

export default watchDownsampleRequests;
