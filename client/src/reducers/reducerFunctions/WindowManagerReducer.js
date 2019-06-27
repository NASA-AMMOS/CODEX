import Immutable from "immutable";
import { defaultInitialSettings } from "constants/windowSettings";

export default class WindowManagerReducer {
    static openNewWindow(state, action) {
        // Add an ID to the window
        let id =
            action.info && "id" in action.info
                ? action.info.id
                : Math.random()
                      .toString(36)
                      .substring(7);

        const info = Immutable.fromJS({
            ...defaultInitialSettings,
            ...action.info,
            id
        });
        return state.set("windows", state.get("windows").concat([info]));
    }

    static closeWindow(state, action) {
        return state.set("windows", state.get("windows").filter(f => f.get("id") !== action.id));
    }

    static closeAllWindows(state, action) {
        return state.set("windows", []);
    }

    static setWindowTileActionPending(state, action) {
        return state.set("tileActionPending", action.isPending);
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
        console.log(action);
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
                .map(win => (win.get("id") === action.id ? win.set("data", action.data) : win))
        );
    }
}
