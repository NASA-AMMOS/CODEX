import Immutable from "immutable";
import { defaultInitialSettings, initialSettingsByWindowType } from "constants/windowSettings";
import * as utils from "utils/utils";

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

    static setWindowNeedsAutoscale(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.get("id") === action.id ? win.set("needsAutoscale", action.scale) : win
                )
        );
    }
}
