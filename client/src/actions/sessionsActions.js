import * as types from "constants/actionTypes";
import * as utils from "utils/utils";

export function saveSession(sessionName) {
    const { req } = utils.makeSimpleRequest({
        routine: "save_session",
        session_name: sessionName
    });
    req.then(data => {
        console.log("Session saved.");
    });
}

export function loadSession(sessionName) {
    return dispatch => {
        dispatch({ type: types.CLOSE_ALL_WINDOWS });
        const { req } = utils.makeSimpleRequest({
            routine: "load_session",
            session_name: sessionName
        });
        req.then(data => {
            dispatch({
                type: types.FILE_LOAD,
                data: data.session_data.features,
                filename: ""
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
