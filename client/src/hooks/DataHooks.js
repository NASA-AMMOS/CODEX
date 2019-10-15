import React, { useState, useRef, useEffect } from "react";
import { useSelector, useStore, useDispatch } from "react-redux";
import WorkerSocket from "worker-loader!workers/socket.worker";
import * as actionTypes from "constants/actionTypes";
import {
    addDataset,
    featureRetain,
    featureRelease,
    featureSelect,
    featureUnselect,
    featureAdd,
    fileLoad,
    statSetFeatureLoading,
    statSetFeatureFailed,
    statSetFeatureResolved,
    featureDelete,
    featureRename
} from "actions/data";
import { fromJS, Set } from "immutable";
import { batchActions } from "redux-batched-actions";
import * as selectionActions from "actions/selectionActions";
import * as wmActions from "actions/windowManagerActions";
import * as utils from "utils/utils";
import * as uiActions from "actions/ui";
import * as uiTypes from "constants/uiTypes";

function loadColumnFromServer(feature) {
    return new Promise(resolve => {
        const socketWorker = new WorkerSocket();

        socketWorker.addEventListener("message", e => {
            //console.log("server column");
            //console.log(JSON.parse(e.data));
            const data = JSON.parse(e.data).data.map(ary => ary[0]);
            resolve(data);
        });

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.GET_GRAPH_DATA,
                sessionkey: utils.getGlobalSessionKey(),
                selectedFeatures: [feature]
            })
        );
    });
}

async function resolveFeature(feature) {
    return addDataset(feature, await loadColumnFromServer(feature)); // autoref
}

/**
 * Previous value state hook, used to
 */
function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

/**
 * Get (and lock) a set of features
 * @param {array} features list of feature names
 * @return {array} feature state
 */
export function useFeatures(features, windowHandle = undefined) {
    features = Set(features);

    // know what we had before
    let oldFeatures = usePrevious(features);
    if (oldFeatures === undefined) {
        oldFeatures = Set([]);
    }

    /*
     * HOW THIS WORKS
     *
     * Figure out what actions are needed to sync the previous features with these features
     * Batch those actions at the end
     */

    const domain = useSelector(state => state.data);
    const dispatch = useDispatch();

    // make sure we keep the list of features to release at the end up to date
    const cleanupFeatureList = useRef();
    cleanupFeatureList.current = features;

    // final cleanup
    useEffect(() => {
        return () => {
            let out = [];
            for (let feature of cleanupFeatureList.current) {
                //console.log("releasing " + feature);
                out.push(featureRelease(feature));
            }
            dispatch(batchActions(out));
        };
    }, []);

    // batching actions to dispatch all at once (so as to only notify subscribers once, and to avoid race conditions)
    const actionsToDispatch = [];

    const loadedData = domain.get("loadedData");
    const loadedFeatures = Set(loadedData.map(f => f.get("feature")));

    //console.log("new vs old features: ", features.toJS(), oldFeatures.toJS());

    // final cleanup

    let outgoing = oldFeatures.subtract(features); // features that have been added since last call
    let incoming = features.subtract(oldFeatures);

    //console.log("features incoming / outgoing: ", incoming.toJS(), outgoing.toJS());

    // deal with incoming features
    let needsload = incoming.subtract(loadedFeatures);
    for (let feature of needsload) {
        actionsToDispatch.push(resolveFeature(feature));
    }

    for (let feature of incoming) {
        actionsToDispatch.push(featureRetain(feature));
    }

    // outgoing
    for (let feature of outgoing) {
        actionsToDispatch.push(featureRelease(feature));
    }

    //console.log('batched promises (pre-resolve): ', actionsToDispatch);
    Promise.all(actionsToDispatch).then(actions => {
        // don't dispatch an empty batched action
        if (actions.length > 0) {
            if (windowHandle !== undefined) {
                let data = { ...windowHandle.data, features: features.toJS() };
                actions.push(wmActions.setWindowData(windowHandle.id, data));
            }

            dispatch(batchActions(actions));
        }
    });

    // if this is the case, then we're probably done resolving
    if (incoming.size === 0 && outgoing.size === 0) {
        const lockedFeatures = loadedData.filter(f => features.find(fo => fo == f.get("feature")));

        // Ensure that we only return the features when they're locked
        if (features.size !== lockedFeatures.size) {
            return null;
        } else {
            return lockedFeatures;
        }
    } else {
        // we haven't finished loading
        return null;
    }
}

/**
 * Get features that are selected, live updating as features are selected or unselected
 */
export function useLiveFeatures(windowHandle = undefined) {
    const domain = useSelector(state => state.data);
    const selectedFeatures = domain
        .get("featureList")
        .filter(f => f.get("selected"))
        .map(f => f.get("name"));

    return useFeatures(selectedFeatures, windowHandle);
}

/**
 * Get features that are selected, WITHOUT live updating as features are selected or unselected
 */
export function usePinnedFeatures(windowHandle = undefined) {
    const domain = useSelector(state => state.data);
    const selectedFeatures = domain
        .get("featureList")
        .filter(f => f.get("selected"))
        .map(f => f.get("name"));

    // pin the selected features to the state on the first run
    const [pinned, setPinned] = useState(null);

    useEffect(() => {
        if (
            windowHandle !== undefined &&
            windowHandle.data !== undefined &&
            windowHandle.data.features !== undefined
        ) {
            setPinned(windowHandle.data.features);
        } else {
            setPinned(selectedFeatures);
        }
    }, [windowHandle]); // We want this to update whenever we change the window datasets externally.

    return useFeatures(pinned, windowHandle);
}

/**
 * function that gives the next selection color index
 * @return state.nextColorIndex
 */
export function useNextColorIndex() {
    const nextColorIndex = useSelector(state => {
        return state.selections.nextColorIndex;
    });

    return nextColorIndex;
}

/**
 * Get saved selections
 * @return {array} saved selections array + setter function
 */
export function useSavedSelections() {
    const dispatch = useDispatch();
    const savedSelections = useSelector(state => state.selections.savedSelections);

    return [
        savedSelections,
        (name, indices, groupID) =>
            dispatch(selectionActions.saveNewSelection(name, indices, groupID))
    ];
}

/**
 * Get the list of existing groups
 * @return {array} current list of groups from the selections state
 */
export function useSelectionGroups() {
    const dispatch = useDispatch();
    const groups = useSelector(state => {
        return state.selections.groups;
    });

    return [groups, groupID => dispatch(selectionActions.createSelectionGroup(groupID))];
}

/**
 * Get current selection
 * @return {array} current lasso selection + setter function
 */
export function useCurrentSelection() {
    const dispatch = useDispatch();
    const currentSelection = useSelector(state => state.selections.currentSelection);

    return [currentSelection, indices => dispatch(selectionActions.setCurrentSelection(indices))];
}

/**
 * Get all feature names.
 */
export function useFeatureNames() {
    const features = useSelector(state => state.data.get("featureList")).map(f => f.get("name"));

    return features;
}

/**
 * Get all feature metadata
 * @returns {Map} a reference to the store's featurelist metadata
 */
export function useFeatureMetadata() {
    const features = useSelector(state => state.data.get("featureList"));
    return features;
}

/**
 * Get the names of the currently selected features
 * @return {array} currently selected names + setter function
 */
export function useSelectedFeatureNames() {
    const dispatch = useDispatch();
    const currentFeatures = useSelector(state => state.data.get("featureList"))
        .filter(f => f.get("selected"))
        .map(f => f.get("name"));

    const setCurrentFeatures = sels => {
        // Here, perform a diff to figure out the minimum number of switches we need
        sels = Set(sels);
        const current = Set(currentFeatures);

        // first, figure out what features are leaving the set
        const removalActions = current
            .subtract(sels)
            .toJS()
            .map(n => featureUnselect(n));

        // now, all that's left is to add all the other actions
        const additionActions = sels.toJS().map(n => featureSelect(n));

        // dispatch all at once to avoid multiple rerenders
        dispatch(batchActions([...removalActions, ...additionActions]));
    };

    return [currentFeatures, setCurrentFeatures];
}

/**
 * Get the current filename
 * @return {string} current file name
 */
export function useFilename() {
    return useSelector(state => state.data.get("filename"));
}

/**
 * Get id of the selection that's currently being hovered over in the left-hand column.
 * @return {string} id of active selection
 */
export function useHoveredSelection() {
    const dispatch = useDispatch();
    const currentHover = useSelector(state => state.selections.hoverSelection);

    return [currentHover, indices => dispatch(selectionActions.setHoverSelection(indices))];
}

/**
 * Create a new feature
 * @return {function} Setter for a new feature
 */
export function useNewFeature(dispatch) {
    dispatch = dispatch || useDispatch(); // May be called by another action.

    return (name, data) => {
        // manually form request, see codex_data_manager.py for more
        let data_encoded = btoa(data);
        const req = {
            routine: "arrange",
            activity: "add",
            hashType: "feature",
            name,
            data: data,
            length: data.length
        };

        utils.makeSimpleRequest(req).req.then(r => {
            dispatch(featureAdd(name, data));
        });
    };
}

/**
 * File upload hook
 * @return {function} file load helper
 */
export function useFileUpload() {
    const dispatch = useDispatch();
    return files => fileLoad(files)(dispatch);
}

/**
 * Load feature statistics
 * This manages a stream socket and ensures that the features are properly in the store.
 */
export function useFeatureStatisticsLoader() {
    const dispatch = useDispatch();
    // get the features and the existing statistics
    const features = useSelector(store => store.data.get("featureList"));
    const existing = useSelector(store => store.data.get("featureStats"));

    // hold the socket's close method
    const socket = useRef(null);

    // callback for when the socket gives us data
    const sock_cb = msg => {
        if (msg.message !== "success" || msg.status !== "success") {
            dispatch(statSetFeatureFailed(msg.name));
        }
        dispatch(statSetFeatureResolved(msg.name, msg));
    };

    // figure out the diff between the features that we need
    // and the ones we have
    useEffect(() => {
        const fnames = features.map(f => f.get("name"));

        let actions = fnames.filter(n => !existing.has(n)).toJS();

        if (actions.length > 0) {
            if (socket.current !== null) {
                socket.current(); // call the cancel function
                socket.current = null;
            }

            // create the request
            const request = {
                routine: "arrange",
                hashType: "feature",
                activity: "metrics",
                name: actions,
                sessionkey: utils.getGlobalSessionKey()
            };

            // dispatch, save the cancel function
            socket.current = utils.makeStreamRequest(request, sock_cb);

            // dispatch onto the store
            actions = actions.map(n => statSetFeatureLoading(n));
            dispatch(batchActions(actions));
        }
    }, [features]);

    // Clean up the socket if this gets unmounted
    useEffect(() => {
        return () => {
            if (socket.current !== null) {
                socket.current(); // call the cancel function
            }
        };
    }, []);
}

/**
 * Get the feature statistics from the store
 * @see useFeatureStatisticsLoader
 * @param {string} feature feature name
 * @return {threeple} [loading, failed, stats]. stats will be null until loaded
 */
export function useFeatureStatistics(feature) {
    const existing = useSelector(store => store.data.get("featureStats"));

    if (!existing.has(feature)) {
        return [true, false, null];
    }

    const stats_entry = existing.get(feature);

    return [stats_entry.get("loading"), stats_entry.get("failed"), stats_entry.get("stats", null)];
}

/**
 * Gets file information (name, NaN/inf/ninf) sentinel values from the store
 *
 */
export function useFileInfo() {
    return {
        filename: useSelector(store => store.data.get("filename")),
        nan: useSelector(store => store.data.get("nan")),
        inf: useSelector(store => store.data.get("inf")),
        ninf: useSelector(store => store.data.get("ninf"))
    };
}

/**
 * Returns a function that deletes a feature from the app. If there's currently a window open that's using the
 * feature, we open a confirmation window.
 */
export function useFeatureDelete() {
    const dispatch = useDispatch();
    const openWindows = useSelector(store => store.windowManager.get("windows"));
    return featureName => {
        const windowsUsingFeature = openWindows.filter(win =>
            win.getIn(["data", "features"]).includes(featureName)
        );

        let snackbarMessage = `Feature "${featureName}" deleted`;
        // We attach a batch of actions to this function that will be dispatched by the confirmation modal if the user confirms.
        if (windowsUsingFeature.length) {
            return dispatch(
                uiActions.showConfirmationModal(uiTypes.CLOSE_GRAPH_WHEN_DELETE_FEATURE, _ => {
                    const windowActions = windowsUsingFeature.map(win =>
                        wmActions.closeWindow(win.get("id"))
                    );

                    const featureActions = [
                        featureRelease(featureName),
                        featureDelete(featureName)
                    ];

                    snackbarMessage = [
                        snackbarMessage,
                        ...windowsUsingFeature.map(win => `Closing window "${win.get("title")}"`)
                    ];
                    console.log(snackbarMessage);

                    return batchActions([
                        ...windowActions,
                        ...featureActions,
                        uiActions.showSnackbar(snackbarMessage)
                    ]);
                })
            );
        }

        // If no windows are using this feature, just delete it.
        dispatch(featureRelease(featureName));
        dispatch(featureDelete(featureName));
        dispatch(uiActions.showSnackbar(snackbarMessage));
    };
}

/**
 * Returns a function that renames a feature.
 */
export function useFeatureRename() {
    const dispatch = useDispatch();
    const openWindows = useSelector(store => store.windowManager.get("windows"));

    return (oldFeatureName, newFeatureName) => {
        // Update the store and loaded data list with the new feature name
        dispatch(featureRename(oldFeatureName, newFeatureName));

        // Now update any windows that use this feature. We want to do this after we update the store
        // so the window doesn't try to reload the data from the server.
        const actions = openWindows
            .filter(win => win.getIn(["data", "features"], []).includes(oldFeatureName))
            .map(win =>
                win.setIn(
                    ["data", "features"],
                    win
                        .getIn(["data", "features"])
                        .map(f => (f === oldFeatureName ? newFeatureName : f))
                )
            )
            .map(win => wmActions.setWindowData(win.get("id"), win.get("data")));
        dispatch(batchActions(actions));
    };
}
