import Immutable from "immutable";
import {
    defaultInitialSettings,
    initialSettingsByWindowType
} from "../../constants/windowSettings";
import * as utils from "../../utils/utils";

export default class WindowManagerReducer {
    static openNewWindow(state, action) {
        // Add an ID to the window
        let id =
            action.info && "id" in action.info
                ? action.info.id
                : Math.random()
                      .toString(36)
                      .substring(7);

        const perWindowSettings = initialSettingsByWindowType[action.info.windowType];
        const baseInfo = Immutable.fromJS({
            ...defaultInitialSettings,
            ...action.info,
            ...perWindowSettings,
            id
        });

        // Set new window position
        const info = baseInfo.merge(utils.getNewWindowPosition(baseInfo, state.get("windows")));

        state = state.set("activeWindow", id);
        return state.set("windows", state.get("windows").concat([info]));
    }

    static closeWindow(state, action) {
        return state.set("windows", state.get("windows").filter(f => f.get("id") !== action.id));
    }

    static closeAllWindows(state, action) {
        return state.set("windows", []);
    }

    static tileWindows(state, action) {
        return state.set("windows", utils.tileWindows(state.get("windows")));
    }

    static updateWindows(state, action) {
        return state.set("windows", action.windows);
    }

    static toggleMinimizeWindow(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.set("minimized", !win.get("minimized")).set("hover", false)
                        : win
                )
        );
    }

    static setWindowHover(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win => (win.get("id") === action.id ? win.set("hover", action.hover) : win))
        );
    }

    static updateWindowInfo(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win => (win.get("id") === action.id ? win.merge(action.info) : win))
        );
    }

    static resizeWindow(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win => (win.get("id") === action.id ? win.merge(action.size) : win))
        );
    }

    static moveWindow(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win => (win.get("id") === action.id ? win.merge(action.position) : win))
        );
    }

    static setWindowTitle(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win => (win.get("id") === action.id ? win.set("title", action.title) : win))
        );
    }
    static setWindowResizable(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id ? win.set("isResizable", action.isResizable) : win
                )
        );
    }
    static setWindowData(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.set("data", Immutable.fromJS(action.data))
                        : win
                )
        );
    }
    static setWindowActive(state, action) {
        return state.set("activeWindow", action.id);
    }

    static setWindowType(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id ? win.set("windowType", action.windowType) : win
                )
        );
    }

    static setWindowDataBounds(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "bounds"], Immutable.fromJS(action.bounds))
                        : win
                )
        );
    }

    static setWindowBinSize(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "binSize"], Immutable.fromJS(action.binSize))
                        : win
                )
        );
    }

    static setWindowAxisLabels(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "axisLabels"], Immutable.fromJS(action.axisLabels))
                        : win
                )
        );
    }

    static setWindowNeedsResetToDefault(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "needsResetToDefault"], action.needsResetToDefault)
                        : win
                )
        );
    }

    static setWindowAxisFeature(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", action.axis], action.featureName)
                        : win
                )
        );
    }

    static setWindowFeatureInfo(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "featureInfo"], Immutable.fromJS(action.featureInfo))
                        : win
                )
        );
    }

    static setWindowShowGridLines(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "showGridLines"], action.showGridLines)
                        : win
                )
        );
    }

    static setWindowDataScale(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "scaleOptions"], Immutable.fromJS(action.scaleOptions))
                        : win
                )
        );
    }

    static setWindowDataMapType(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "mapType"], action.mapType)
                        : win
                )
        );
    }

    static setWindowTrendLineStyle(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "trendLineStyle"], action.trendLineStyle)
                        : win
                )
        );
    }

    static setWindowDotSize(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "dotSize"], action.dotSize)
                        : win
                )
        );
    }

    static setWindowDotOpacity(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "dotOpacity"], action.dotOpacity)
                        : win
                )
        );
    }

    static setWindowDotShape(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "dotShape"], action.dotShape)
                        : win
                )
        );
    }

    static setWindowNeedsAutoscale(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "needsAutoscale"], action.needsAutoscale)
                        : win
                )
        );
    }

    static setWindowNeedsPlotImage(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id
                        ? win.setIn(["data", "needsPlotImage"], action.needs)
                        : win
                )
        );
    }
}
