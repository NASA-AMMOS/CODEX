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

        const info = {
            ...defaultInitialSettings,
            ...action.info,
            id
        };
        return state.set("windows", state.get("windows").concat([info]));
    }

    static closeWindow(state, action) {
        return state.set("windows", state.get("windows").filter(f => f.id !== action.id));
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
                    win.id === action.id
                        ? Object.assign(win, { minimized: !win.minimized, hover: false })
                        : win
                )
        );
    }

    static setWindowHover(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.id === action.id ? Object.assign(win, { hover: action.hover }) : win
                )
        );
    }

    static updateWindowInfo(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win => (win.id === action.id ? Object.assign(win, action.info) : win))
        );
    }

    static resizeWindow(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win => (win.id === action.id ? Object.assign(win, action.size) : win))
        );
    }

    static moveWindow(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win => (win.id === action.id ? Object.assign(win, action.position) : win))
        );
    }

    static setWindowTitle(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.id === action.id ? Object.assign(win, { title: action.title }) : win
                )
        );
    }
    static setWindowResizable(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.id === action.id
                        ? Object.assign(win, { isResizable: action.isResizable })
                        : win
                )
        );
    }
    static setWindowData(state, action) {
        return state.set(
            "windows",
            state
                .get("windows")
                .map(win =>
                    win.id === action.id ? Object.assign(win, { data: action.data }) : win
                )
        );
    }
}
