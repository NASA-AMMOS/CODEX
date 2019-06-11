import Immutable from "immutable";

export default class WindowManagerReducer {
    static openNewWindow(state, action) {
        // Add an ID to the window
        action.info.id =
            action.info.id ||
            Math.random()
                .toString(36)
                .substring(7);
        return { ...state, windows: [...state.windows, action.info] };
    }

    static closeWindow(state, action) {
        return { ...state, windows: state.windows.filter(f => f.id !== action.id) };
    }

    static closeAllWindows(state, action) {
        return { ...state, windows: [] };
    }

    static setWindowTileActionPending(state, action) {
        return { ...state, tileActionPending: action.isPending };
    }

    static updateWindows(state, action) {
        return { ...state, windows: action.windows };
    }

    static toggleMinimizeWindow(state, action) {
        return {
            ...state,
            windows: state.windows.map(win =>
                win.id === action.id
                    ? Object.assign(win, { minimized: !win.minimized, hover: false })
                    : win
            )
        };
    }

    static setWindowHover(state, action) {
        return {
            ...state,
            windows: state.windows.map(win =>
                win.id === action.id ? Object.assign(win, { hover: action.hover }) : win
            )
        };
    }

    static updateWindowInfo(state, action) {
        return {
            ...state,
            windows: state.windows.map(win =>
                win.id === action.id ? Object.assign(win, action.info) : win
            )
        };
    }
}
