import { all } from "redux-saga/effects";

import watchFeatureRequests from "./features";
import watchFeatureStatRequests from "./metrics";

export default function* rootSaga() {
    yield all([watchFeatureStatRequests()]);
}
