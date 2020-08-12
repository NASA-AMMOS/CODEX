import { put, takeEvery, select, take } from "redux-saga/effects";
import { DEFER_UNTIL_AVAILABLE } from "../constants/actionTypes";

// adapted from https://stackoverflow.com/a/52044336
function* waitForFeatures(features) {
    const selector = state => state.data.get("featureList");

    const containsFeatures = resolved => {
        const relevant = resolved.filter(f => features.includes(f.get("name")));

        return relevant.size === features.length;
    };
    if (containsFeatures(yield select(selector))) return;

    while (true) {
        yield take("*");
        if (containsFeatures(yield select(selector))) return;
    }
}

function* interceptDefermentRequest(action) {
    // wait until we've got features in the store...
    yield waitForFeatures(action.features);

    // ... then dispatch the action
    yield put(action.action);
}

function* watchDefermentRequests() {
    yield takeEvery(DEFER_UNTIL_AVAILABLE, interceptDefermentRequest);
}

export default watchDefermentRequests;
