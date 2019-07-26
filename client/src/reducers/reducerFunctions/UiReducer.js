import Immutable from "immutable";

export default class UiReducer {
    static changeGlobalChartState(state, action) {
        return state.set("globalChartState", action.chartState);
    }

    static setUploadStatusUploading(state, action) {
        return state.set("uploadStatus", action.percentage);
    }

    static setUploadStatusProcessing(state, action) {
        return state.set("uploadStatus", "PROCESSING");
    }

    static setUploadStatusDone(state, action) {
        return state.set("uploadStatus", null);
    }
}
