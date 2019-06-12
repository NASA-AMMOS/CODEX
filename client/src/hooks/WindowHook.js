import React, { useLayoutEffect } from "react";

/*
 * Basically, this hook:
 *      1) checks if a ref was passed down from the window manager
 *      2) if so, sets the initial window settings
 *      3) if so, exports a wrapped reference. Otherwise, exports a dummy ref (so as not to wreck things depending on it)
 */

const wrapRef = ref => ({
    isWindow: true,

    resize: (width, height) => ref.setState({ width, height }),

    get width() {
        return ref.state.width;
    },
    get height() {
        return ref.state.height;
    },
    get isResizable() {
        return ref.state.isResizable;
    },
    get title() {
        return ref.state.title;
    },

    set width(width) {
        ref.setState({ width });
    },
    set height(height) {
        ref.setState({ height });
    },
    set title(title) {
        ref.setState({ title });
    },
    set isResizable(isResizable) {
        ref.setState({ isResizable });
    },

    close: () => ref.props.onClose()
});

const createDummyObj = () => {
    const warn = () => console.warn("Window not mounted by a window manager!");
    return {
        isWindow: false,

        resize: warn,

        get width() {
            warn();
            return 0;
        },
        get height() {
            warn();
            return 0;
        },
        get isResizable() {
            warn();
            return false;
        },
        get title() {
            warn();
            return "";
        },

        set width(v) {
            warn();
        },
        set height(v) {
            warn();
        },
        set isResizable(v) {
            warn();
        },
        set title(v) {
            warn();
        },

        close: warn()
    };
};

function useWindowManager(props, initialSettings) {
    if (props.__wm_parent_ref) {
        console.log(props.__wm_parent_ref);
    }

    // set our initial settings
    useLayoutEffect(() => {
        if (props.__wm_parent_ref && initialSettings !== undefined) {
            // apply our initial settings to the ref
            props.__wm_parent_ref.setState(initialSettings);
        }
    }); // <- only run on first render

    return props.__wm_parent_ref ? wrapRef(props.__wm_parent_ref) : createDummyObj();
}

export default useWindowManager;
