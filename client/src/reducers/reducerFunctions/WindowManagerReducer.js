export default class WindowManagerReducer {
    static openNewWindow(state, action) {
        return state.set("windows", state.get("windows").push(action.info));
    }

    static closeWindow(state, action) {
        return state.set("windows", state.get("windows").splice(action.idx, 1));
    }
}
