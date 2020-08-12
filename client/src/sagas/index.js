import { all } from "redux-saga/effects";

import watchFeatureRequests from "./features";
import watchFeatureStatRequests from "./metrics";
import watchDownsampleRequests from "./windows";
import watchDefermentRequests from "./deferment";

export default function* rootSaga() {
    yield all([
        watchFeatureStatRequests(),
        watchFeatureRequests(),
        watchDownsampleRequests(),
        watchDefermentRequests()
    ]);
}
