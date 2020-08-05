import { put, takeEvery, call } from "redux-saga/effects";
import { FEATURE_REQUEST } from "../constants/actionTypes";
import { addDataset } from "../actions/data";
import { resolve_feature, resolve_feature_key } from "../utils/features";

function* interceptFeatureRequest(action) {
    yield call(async () => await resolve_feature(action.feature, action.downsample));

    const key = resolve_feature_key(action.feature, action.downsample);

    yield put(addDataset(action.feature, key));
}

function* watchFeatureRequests() {
    yield takeEvery(FEATURE_REQUEST, interceptFeatureRequest);
}

export default watchFeatureRequests;
