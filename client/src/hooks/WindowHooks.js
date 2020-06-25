import { fromJS } from "immutable";
import { useDispatch, useSelector } from "react-redux";
import { useLayoutEffect } from "react";

import { defaultInitialSettings } from "../constants/windowSettings";
import {
    setWindowAxisFeature,
    setWindowAxisLabels,
    setWindowDataBinSize,
    setWindowDataBounds,
    setWindowDataDotOpacity,
    setWindowDataDotShape,
    setWindowDataDotSize,
    setWindowDataMapType,
    setWindowDataNeedsResetToDefault,
    setWindowDataScale,
    setWindowDataTrendLineStyle,
    setWindowFeatureInfo,
    setWindowNeedsAutoscale,
    setWindowNeedsPlotImage,
    setWindowShowGridLines
} from "../actions/windowDataActions";
import * as wmActions from "../actions/windowManagerActions";

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
    const activeWindowId = useSelector(state => state.windowManager.get("activeWindow"));
    const windowList = useWindowList();

    const setActiveWindow = id => {
        if (id !== activeWindowId) dispatch(wmActions.setActiveWindow(id));
        const activeWindow = windowList.find(win => win.get("id") === id);
    };

    return [activeWindowId, setActiveWindow];
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
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "featureInfo"])
        ),
        newInfo => dispatch(setWindowFeatureInfo(id, newInfo))
    ];
}

/**
 * Getter/setter for a specific graph window x axis
 * @return {tuple} value/setter function
 */
export function useWindowXAxis(id) {
    const dispatch = useDispatch();
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "xAxis"])
        ),
        featureName => dispatch(setWindowAxisFeature(id, "xAxis", featureName))
    ];
}

/**
 * Getter/setter for a specific graph window y axis
 * @return {tuple} value/setter function
 */
export function useWindowYAxis(id) {
    const dispatch = useDispatch();
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "yAxis"])
        ),
        featureName => dispatch(setWindowAxisFeature(id, "yAxis", featureName))
    ];
}

/**
 * Getter/setter for a specific graph window z axis
 * @return {tuple} value/setter function
 */
export function useWindowZAxis(id) {
    const dispatch = useDispatch();
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "zAxis"])
        ),
        featureName => {
            dispatch(setWindowAxisFeature(id, "zAxis", featureName));
        }
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
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "mapType"])
        ),
        mapType => dispatch(setWindowDataMapType(id, mapType))
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

/**
 * Getter/setter for a specific graph window bin size
 * @return {tuple} value/setter function
 */
export function useWindowGraphBinSize(id) {
    const dispatch = useDispatch();

    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "binSize"])
        ),
        binSize => dispatch(setWindowDataBinSize(id, binSize))
    ];
}

export function useWindowGraphBounds(id) {
    const dispatch = useDispatch();

    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "bounds"])
        ),
        bounds => dispatch(setWindowDataBounds(id, bounds))
    ];
}

export function useWindowAxisLabels(id) {
    const dispatch = useDispatch();

    const labels = useSelector(state =>
        state.windowManager
            .get("windows")
            .find(win => win.get("id") === id)
            .getIn(["data", "axisLabels"])
    );

    return [labels, axisLabels => dispatch(setWindowAxisLabels(id, axisLabels))];
}

/**
 * Attempt to calculate the maximum height of the axis labels
 * and clip them so they fit, and provide a method for injecting
 * the styles into the chart
 *
 * @param {str} id window id
 * @return {function} axis label clipper
 */
export function useWindowAwareLabelShortener(id) {
    const winHeight = useSelector(state =>
        state.windowManager
            .get("windows")
            .find(win => win.get("id") === id)
            .get("height", 1)
    );

    const winFeatureCount = useSelector(
        state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "features"], { size: 1 }).size // HACK
    );

    // if the window is not attached, return identity functions
    if (winHeight === 1 || winFeatureCount === 1) {
        return [x => x, (x, y, z) => undefined];
    }

    const shortener = (label, heightOverride) => {
        if (typeof label !== "string") {
            label = label.text;
        }

        const fullheight = heightOverride || winHeight;

        // get the maximum width of the label (plot height / number of labels), in pixels
        // this is somewhat magic, but we're subtracting ~50px of padding and then splitting
        // by the number of pads
        const max_label_width = Math.max(0, winHeight - 50) / winFeatureCount;

        // labels are Open Sans 14px, meaning an em width of ~10px
        // this is a conservative estimate, but resizing each requires rendering
        // to a <canvas> and using measureText, and then doing a search over that
        // to find the maximum compliant length. This is slow, especially on a resize.

        // Future work: potentially memoize?

        // ellipsis HTML: &hellip;, \u2026 in JS

        let target_length = Math.floor(max_label_width / 12); // characters

        if (label.length <= target_length) {
            return label;
        } else {
            // drop the center, leaving the ends as context
            let slicelen = Math.floor((target_length - 1) / 2);

            if (slicelen === 0) {
                return `${label[0]}.${label[label.length - 1]}`; // in extremely space-constrained layouts, just use the 1st and last char
            }

            // beginning slice + ellipsis + ending slice
            return `${label.slice(0, slicelen)}\u2026${label.slice(-1 * slicelen)}`;
        }
    };

    // updater for axis labels--sets the labels for the elements directly
    // to circumvent issues with plotly's state management (if you tie a post-
    // action to change the resize event, then the updaters begin an infinite
    // loop).
    //
    // This is bad.
    const injector = (chart_el, layouts, axis) => {
        const newheight = chart_el.getBoundingClientRect().height;

        for (let key of Object.keys(layouts)) {
            let name = shortener(layouts[key].title, newheight);

            // return if the name is the empty string--this will not be rendered
            // anyways and the svg text will not be placed by plotly
            if (name === "") {
                continue;
            }

            // create the query
            let query = key.replace("axis", "");

            // identify and shorten the axis
            let text_el = chart_el.querySelector(`text.${query}title`);
            if (text_el) {
                text_el.textContent = name;
            } else {
                console.warn(`could not locate text.${query}title`);
            }
        }
    };

    return [shortener, injector];
}

export function useWindowType(id) {
    const dispatch = useDispatch();
    const win = useSelector(state =>
        state.windowManager.get("windows").find(win => win.get("id") === id)
    );

    return [win.get("windowType"), windowType => dispatch(wmActions.setWindowType(id, windowType))];
}

export function useWindowDotSize(id) {
    const dispatch = useDispatch();
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "dotSize"])
        ),
        dotSize => dispatch(setWindowDataDotSize(id, dotSize))
    ];
}

export function useWindowDotOpacity(id) {
    const dispatch = useDispatch();
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "dotOpacity"])
        ),
        dotOpacity => dispatch(setWindowDataDotOpacity(id, dotOpacity))
    ];
}

export function useWindowDotShape(id) {
    const dispatch = useDispatch();
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "dotShape"])
        ),
        dotShape => dispatch(setWindowDataDotShape(id, dotShape))
    ];
}

export function useCloseWindow(win) {
    const dispatch = useDispatch();
    return id => dispatch(wmActions.closeWindow(win.id));
}

export function useWindowAxisScale(id) {
    const dispatch = useDispatch();
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "scaleOptions"])
        ),
        scaleOptions => dispatch(setWindowDataScale(id, scaleOptions))
    ];
}

export function useWindowTrendLineStyle(id) {
    const dispatch = useDispatch();
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "trendLineStyle"])
        ),
        trendLineStyle => dispatch(setWindowDataTrendLineStyle(id, trendLineStyle))
    ];
}

export function useWindowShowGridLines(id) {
    const dispatch = useDispatch();
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "showGridLines"])
        ),
        showGridLines => dispatch(setWindowShowGridLines(id, showGridLines))
    ];
}

export function useWindowNeedsResetToDefault(id) {
    const dispatch = useDispatch();
    return [
        useSelector(state =>
            state.windowManager
                .get("windows")
                .find(win => win.get("id") === id)
                .getIn(["data", "needsResetToDefault"])
        ),
        needsResetToDefault => dispatch(setWindowDataNeedsResetToDefault(id, needsResetToDefault))
    ];
}

export function useSetWindowNeedsAutoscale(id) {
    const dispatch = useDispatch();
    return [
        id &&
            useSelector(state =>
                state.windowManager
                    .get("windows")
                    .find(win => win.get("id") === id)
                    .getIn(["data", "needsAutoscale"])
            ),
        scale => dispatch(setWindowNeedsAutoscale(id, scale))
    ];
}

export function useSetWindowNeedsAutoscaleById() {
    const dispatch = useDispatch();
    return (id, scale) => dispatch(setWindowNeedsAutoscale(id, scale));
}

export function useSetWindowNeedsPlotImage(id) {
    const dispatch = useDispatch();
    return [
        id &&
            useSelector(state =>
                state.windowManager
                    .get("windows")
                    .find(win => win.get("id") === id)
                    .getIn(["data", "needsPlotImage"])
            ),
        needs => dispatch(setWindowNeedsPlotImage(id, needs))
    ];
}

export function useSetWindowNeedsPlotImageById() {
    const dispatch = useDispatch();
    return (id, needs) => dispatch(setWindowNeedsPlotImage(id, needs));
}

export function useOpenNewWindow() {
    const dispatch = useDispatch();
    return newWindow => dispatch(wmActions.openNewWindow(newWindow));
}

export default useWindowManager;
