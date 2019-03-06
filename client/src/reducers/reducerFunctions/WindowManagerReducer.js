import Immutable from "immutable";

export default class WindowManagerReducer {
    static openNewWindow(state, action) {
        // Add an ID to the window
        action.info.id = Math.random()
            .toString(36)
            .substring(7);
        return state.set("windows", state.get("windows").push(action.info));
    }

    static closeWindow(state, action) {
        return state.set("windows", state.get("windows").filter(f => f.id !== action.id));
    }

    static closeAllWindows(state, action) {
        return state.set("windows", Immutable.fromJS([]));
    }

    static setWindowTileActionPending(state, action) {
        return state.set("tileActionPending", action.isPending);
    }

    static updateWindows(state, action) {
        return state.set("windows", action.windows);
    }
}
