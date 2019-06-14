import React, { useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as wmActions from "actions/windowManagerActions";
import { defaultInitialSettings } from "constants/windowSettings";

/*
 * Basically, this hook:
 *      1) checks if an ID was passed down from the window manager
 *      2) if so, sets the initial window settings on the store
 *      3) if so, exports a wrapped reference. Otherwise, exports a dummy ref (so as not to wreck things depending on it)
 */

const wrapWindow = (win, dispatch) => {
    return {
        resizeX: width => dispatch(wmActions.resizeWindow(win.id, { width })),
        resizeY: height => dispatch(wmActions.resizeWindow(win.id, { height })),
        resize: (width, height) => dispatch(wmActions.resizeWindow(win.id, { width, height })),
        setTitle: title => dispatch(wmActions.setTitle(win.id, title)),
        setResizable: isResizable => dispatch(wmActions.setWindowResizable(win.id, isResizable)),
        ...win
    };
};

const wrapDummy = () => {
    const warn = () => console.warn("Window not mounted from window manager!");
    return {
        resizeX: warn,
        resizeY: warn,
        resize: warn,
        setTitle: warn,
        setResizable: warn,
        ...defaultInitialSettings
    };
};

function useWindowManager(props, initialSettings) {
    const dispatch = useDispatch();
    const domain = useSelector(state => state.windowManager);
    console.log(domain);
    let window_obj = {};

    if (props.__wm_parent_id) {
        console.log(props.__wm_parent_id);
        window_obj = domain.windows.filter(win => win.id === props.__wm_parent_id)[0];
        window_obj = wrapWindow(window_obj, dispatch);
    } else {
        window_obj = wrapDummy();
    }

    // set our initial settings
    useLayoutEffect(() => {
        if (props.__wm_parent_id && initialSettings !== undefined) {
            // apply our initial settings to the ref
            dispatch(wmActions.updateWindowInfo(props.__wm_parent_id, initialSettings));
        }
    }, []); // <- only run on first render

    return window_obj;
}

export default useWindowManager;
