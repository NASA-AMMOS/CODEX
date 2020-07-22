import { put, select, takeEvery, call } from "redux-saga/effects";
import { batchActions } from "redux-batched-actions";
import { FEATURE_REQUEST } from "../constants/actionTypes";
import StreamWorker from "worker-loader!../workers/stream.worker";
import {
    statSetFeatureLoading,
    statSetFeatureFailed,
    statSetFeatureResolved
} from "../actions/data";
import { getGlobalSessionKey } from "../utils/utils";

import { bcache } from "../index";
import { store } from "../index"; // i am so sorry

const CODEX_URL = "http://localhost:8888";

const get_feature = query => {
    const params = new URLSearchParams();

    for (let key in query) {
        if (query[key] !== null) {
            params.append(key, query[key]);
        }
    }

    const url = `${CODEX_URL}/api/feature?${params.toString()}`;

    return fetch(url);
};

function* interceptFeatureRequest(action) {
    // check if we've got the key already
    const key = bcache.make_key("feature", action.feature, action.downsample);

    if (bcache.has(key)) {
        return;
    }

    // resolve a feature
    const res = yield call(get_feature, {
        name: action.feature,
        downsample: action.downsample !== undefined ? null : action.downsample
    });

    const dtype = this.str_to_type(res.headers.get("X-Data-Type"));

    const buf = yield call(res.arrayBuffer);

    bcache.add(key, buf, dtype);

    // todo: plug key into store
}

function* watchFeatureRequests() {
    yield takeEvery(FEATURE_REQUEST, interceptFeatureRequest);
}

export default watchFeatureRequests;
