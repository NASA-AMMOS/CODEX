import React, { useLayoutEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as wmActions from "actions/windowManagerActions";
import { defaultInitialSettings } from "constants/windowSettings";
import { fromJS } from "immutable";
import * as actionTypes from "constants/actionTypes";
/*
 * Basically, this hook:
 *      1) checks if an ID was passed down from the window manager
 *      2) if so, sets the initial window settings on the store
 *      3) if so, exports a wrapped reference. Otherwise, exports a dummy ref (so as not to wreck things depending on it)
 */

const wrapWindow = (win, dispatch) => {
    // dispatchers are wrapped to avoid unnecessary rerenders by triggering actions
    // this greatly simplifies components using this, as they can simply "set and forget"
    // instead of checking that they haven't already set a value
    return {
        resizeX: width => {
            if (win.get("width") !== width) {
                dispatch(wmActions.resizeWindow(win.get("id"), { width }));
            }
        },
        resizeY: height => {
            if (win.get("height") !== height) {
                dispatch(wmActions.resizeWindow(win.get("id"), { height }));
            }
        },
        resize: (width, height) => {
            if (win.get("width") !== width || win.get("height") !== height) {
                dispatch(wmActions.resizeWindow(win.get("id"), { width, height }));
            }
        },
        setTitle: title => {
            if (win.get("title") !== title) {
                dispatch(wmActions.setWindowTitle(win.get("id"), title));
            }
        },
        setResizable: isResizable => {
            if (win.get("isResizable") === isResizable) {
                dispatch(wmActions.setWindowResizable(win.get("id"), isResizable));
            }
        },
        setData: data => {
            if (typeof data === "function") {
                data = data(win.get("data")); // Allow a callback function with the existing data as an argument
            }
            if (data && !fromJS(data).equals(win.get("data"))) {
                dispatch(wmActions.setWindowData(win.get("id"), data));
            }
        },
        ...(win ? win.toJS() : {})
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
        setData: warn,
        ...defaultInitialSettings
    };
};

/**
 * Window manager configuration hook
 * @param {object} props parent props
 * @param {object} initialSettings initial settings for WM
 * @return a reference to the window
 */
export function useWindowManager(props, initialSettings) {
    const dispatch = useDispatch();
    const domain = useSelector(state => state.windowManager);
    let window_obj = {};

    if (props.__wm_parent_id) {
        window_obj = domain.get("windows").filter(win => win.get("id") === props.__wm_parent_id)[0];
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

/**
 * Getter/setter for the active window
 * @return {tuple} value/setter function
 */
export function useActiveWindow() {
    const dispatch = useDispatch();
    const activeWindow = useSelector(state => state.windowManager.get("activeWindow"));

    const setActiveWindow = id => id !== activeWindow && dispatch(wmActions.setActiveWindow(id));

    return [activeWindow, setActiveWindow];
}

/**
 * Getter for the window list
 * @return {object} value
 */
export function useWindowList() {
    const dispatch = useDispatch();
    return useSelector(state => state.windowManager.get("windows"));
}

/**
 * Getter/setter for a specific graph window's feature list
 * @return {tuple} value/setter function
 */
export function useWindowFeatureList(id) {
    const dispatch = useDispatch();
    const win = useSelector(state =>
        state.windowManager.get("windows").find(win => win.get("id") === id)
    );
    const features = win.getIn(["data", "features"]);

    return [
        features,
        newFeatures =>
            dispatch(wmActions.setWindowData(id, win.get("data").set("features", newFeatures)))
    ];
}

/**
 * Getter/setter for a specific graph window's feature info list
 * @return {tuple} value/setter function
 */
export function useWindowFeatureInfoList(id) {
    const dispatch = useDispatch();
    const win = useSelector(state =>
        state.windowManager.get("windows").find(win => win.get("id") === id)
    );

    return [
        win.getIn(["data", "featureInfo"], []),
        newInfo =>
            dispatch(wmActions.setWindowData(id, win.get("data").set("featureInfo", newInfo)))
    ];
}

/**
 * Getter/setter for a specific graph window x axis
 * @return {tuple} value/setter function
 */
export function useWindowXAxis(id) {
    const dispatch = useDispatch();
    const win = useSelector(state =>
        state.windowManager.get("windows").find(win => win.get("id") === id)
    );

    return [
        win.getIn(["data", "xAxis"]),
        xAxis => dispatch(wmActions.setWindowData(id, win.get("data").set("xAxis", xAxis)))
    ];
}

/**
 * Getter/setter for a specific graph window y axis
 * @return {tuple} value/setter function
 */
export function useWindowYAxis(id) {
    const dispatch = useDispatch();
    const win = useSelector(state =>
        state.windowManager.get("windows").find(win => win.get("id") === id)
    );

    return [
        win.getIn(["data", "yAxis"]),
        yAxis => dispatch(wmActions.setWindowData(id, win.get("data").set("yAxis", yAxis)))
    ];
}

/**
 * Getter/setter for a specific graph window z axis
 * @return {tuple} value/setter function
 */
export function useWindowZAxis(id) {
    const dispatch = useDispatch();
    const win = useSelector(state =>
        state.windowManager.get("windows").find(win => win.get("id") === id)
    );

    return [
        win.getIn(["data", "zAxis"]),
        zAxis => dispatch(wmActions.setWindowData(id, win.get("data").set("zAxis", zAxis)))
    ];
}

/**
 * Hook to swap axes in one go -- avoids weird render conflicts when trying to swap
 * @return {function} axis swap function
 */
export function useSwapAxes(id) {
    const dispatch = useDispatch();
    const win = useSelector(state =>
        state.windowManager.get("windows").find(win => win.get("id") === id)
    );

    return _ => {
        const newXAxis = win.getIn(["data", "yAxis"]);
        const newYAxis = win.getIn(["data", "xAxis"]);
        dispatch(
            wmActions.setWindowData(
                id,
                win
                    .get("data")
                    .set("xAxis", newXAxis)
                    .set("yAxis", newYAxis)
            )
        );
    };
}

/**
 * Getter/setter for a specific graph window map type
 * @return {tuple} value/setter function
 */
export function useWindowMapType(id) {
    const dispatch = useDispatch();
    const win = useSelector(state =>
        state.windowManager.get("windows").find(win => win.get("id") === id)
    );

    return [
        win.getIn(["data", "mapType"]),
        mapType => dispatch(wmActions.setWindowData(id, win.get("data").set("mapType", mapType)))
    ];
}

/**
 * Getter/setter for a specific graph window title
 * @return {tuple} value/setter function
 */
export function useWindowTitle(id) {
    const dispatch = useDispatch();
    const win = useSelector(state =>
        state.windowManager.get("windows").find(win => win.get("id") === id)
    );
    return [win.get("title"), title => dispatch(wmActions.setWindowTitle(id, title))];
}

export default useWindowManager;
