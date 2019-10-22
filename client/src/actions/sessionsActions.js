import * as types from "constants/actionTypes";
import * as utils from "utils/utils";
import * as uiTypes from "constants/uiTypes";
import { createGraph } from "actions/graphActions";

function serializeClientState(state) {
    return {
        filename: state.data.get("filename"),
        windows: state.windowManager.get("windows").map(win => {
            return {
                data: win.get("data"),
                height: win.get("height"),
                width: win.get("width"),
                x: win.get("x"),
                y: win.get("y"),
                windowType: win.get("windowType")
            };
        })
    };
}

export function saveSession(sessionName) {
    return (dispatch, getState) => {
        const { req } = utils.makeSimpleRequest({
            routine: "save_session",
            session_name: sessionName,
            filename: getState().data.get("filename"),
            state: serializeClientState(getState())
        });
        req.then(data => {
            console.log("Session saved.");
        });
    };
}

export function loadSession(sessionName) {
    return dispatch => {
        dispatch({ type: types.CLOSE_ALL_WINDOWS });
        const { req } = utils.makeSimpleRequest({
            routine: "load_session",
            session_name: sessionName
        });

        req.then(data => {
            console.log(data);
            dispatch({
                type: types.FILE_LOAD,
                data: data.session_data.features,
                filename: data.session_data.state.filename
            });

            data.session_data.state.windows.map(windowData => {
                dispatch({
                    type: types.OPEN_NEW_WINDOW,
                    info: windowData
                });
            });
        });
    };
}

export function openSessionsWindow() {
    return dispatch => {
        dispatch({
            type: types.OPEN_NEW_WINDOW,
            info: {
                windowType: "SESSIONS_WINDOW"
            }
        });
    };
}
