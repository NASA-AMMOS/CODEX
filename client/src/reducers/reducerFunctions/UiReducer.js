import Immutable from "immutable";

export default class UiReducer {
    static changeGlobalChartState(state, action) {
        return state.set("globalChartState", action.chartState);
    }
}
