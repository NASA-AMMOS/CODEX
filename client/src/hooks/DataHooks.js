import { batchActions } from "redux-batched-actions";
import { useSelector, useDispatch } from "react-redux";
import { useState, useRef, useEffect } from "react";
import Immutable, { Set, List } from "immutable";

import WorkerSocket from "worker-loader!../workers/socket.worker";

import {
    addDataset,
    changeFeatureGroup,
    createFeatureGroup,
    deleteFeatureGroup,
    featureAdd,
    featureDelete,
    featureListLoading,
    featureRelease,
    featureRename,
    featureRetain,
    featureSelect,
    featureUnselect,
    fileLoad,
    requestFeatureLoad,
    renameFeatureGroup,
    selectFeatureGroup,
    selectFeatureInGroup,
    statSetFeatureFailed,
    statSetFeatureLoading,
    statSetFeatureResolved
} from "../actions/data";
import * as actionTypes from "../constants/actionTypes";
import * as selectionActions from "../actions/selectionActions";
import * as uiActions from "../actions/ui";
import * as uiTypes from "../constants/uiTypes";
import * as utils from "../utils/utils";
import * as windowTypes from "../constants/windowTypes";
import * as wmActions from "../actions/windowManagerActions";
import { resolve_feature } from "../utils/features";
import { DEFAULT_DOWNSAMPLE } from "../constants/defaults";
import { useWindowDataDownsample } from "./WindowHooks";

function loadColumnFromServer(feature) {
    return new Promise(resolve => {
        const socketWorker = new WorkerSocket();

        socketWorker.addEventListener("message", e => {
            //console.log("server column");
            //console.log(JSON.parse(e.data));
            // console.log(`Received column: ${feature}`, e.data);
            const data = JSON.parse(e.data).data.map(ary => ary[0]);
            resolve(data);
        });

        console.log(`Requesting column: ${feature}`);
        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.GET_GRAPH_DATA,
                sessionkey: utils.getGlobalSessionKey(),
                selectedFeatures: [feature],
                downsample: 5000
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
    // OLD

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

    const ungroupedFeatures = useSelector(state => state.data.get("featureList"))
        .filter(f => f.get("selected"))
        .map(f => f.get("name"));

    const featuresInGroups = useSelector(state =>
        state.data.get("featureGroups").reduce((acc, group) => {
            return acc.concat(group.get("selectedFeatures"));
        }, List())
    );

    const selectedFeatures = ungroupedFeatures.concat(featuresInGroups);

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
    }, []); // run once

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

    return [
        groups,
        (name, selections) => dispatch(selectionActions.createSelectionGroup(name, selections))
    ];
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

export function useSaveCurrentSelection() {
    const dispatch = useDispatch();
    return _ => dispatch(selectionActions.saveCurrentSelection());
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

    const ungroupedFeatures = useSelector(state => state.data.get("featureList"))
        .filter(f => f.get("selected"))
        .map(f => f.get("name"));

    const featuresInGroups = useSelector(state =>
        state.data.get("featureGroups").reduce((acc, group) => {
            return acc.concat(group.get("selectedFeatures"));
        }, List())
    );

    const currentFeatures = ungroupedFeatures.concat(featuresInGroups);

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

    return [currentHover, indices => dispatch(selectionActions.hoverSelection(indices))];
}

export function useSetHoverSelection() {
    const dispatch = useDispatch();
    return sel => dispatch(selectionActions.hoverSelection(sel));
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

    const [socketCloseHandles, setSocketCloseHandles] = useState([]);
    useEffect(
        _ => {
            features
                .map(f => f.get("name"))
                .filter(n => !existing.has(n))
                .toJS()
                .forEach(feature => {
                    const request = {
                        routine: "arrange",
                        hashType: "feature",
                        activity: "metrics",
                        name: [feature],
                        sessionkey: utils.getGlobalSessionKey()
                    };
                    dispatch(statSetFeatureLoading(feature));
                    const { req, cancel } = utils.makeSimpleRequest(request);
                    setSocketCloseHandles(handles => handles.concat([cancel]));
                    req.then(msg => {
                        if (msg.status !== "success" || msg.message !== "success") {
                            dispatch(statSetFeatureFailed(msg.name));
                        }
                        dispatch(statSetFeatureResolved(msg.name, msg));
                    });
                });
        },
        [features]
    );

    useEffect(_ => {
        return _ => socketCloseHandles.forEach(close => close());
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
    const windowTypesToClose = [windowTypes.CLUSTER_ALGORITHM, windowTypes.REGRESSION_WINDOW];
    const dispatch = useDispatch();
    const openWindows = useSelector(store => store.windowManager.get("windows"));
    return featureName => {
        const windowsUsingFeature = openWindows.filter(
            win =>
                win.getIn(["data", "features"], []).includes(featureName) ||
                windowTypesToClose.includes(win.get("windowType"))
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

/** Returns the current feature name lookup object and provides an update function **/
export function useFeatureDisplayNames() {
    const dispatch = useDispatch();
    const names = useSelector(store => store.data.get("featureDisplayNames"));
    return [names, (baseName, newName) => dispatch(featureRename(baseName, newName))];
}

export function useDeleteSelection() {
    const dispatch = useDispatch();
    return id => dispatch(selectionActions.deleteSelection(id));
}

export function useRenameSelection() {
    const dispatch = useDispatch();
    return (id, name) => dispatch(selectionActions.renameSelection(id, name));
}

export function useChangeSelectionGroup() {
    const dispatch = useDispatch();
    return (id, groupID) => dispatch(selectionActions.setSelectionGroup(id, groupID));
}

export function useDeleteSelectionGroup() {
    const dispatch = useDispatch();
    return id => dispatch(selectionActions.deleteSelectionGroup(id));
}

export function useRenameSelectionGroup() {
    const dispatch = useDispatch();
    return (id, name) => dispatch(selectionActions.renameSelectionGroup(id, name));
}

export function useSetSelectionActive() {
    const dispatch = useDispatch();
    return (id, active) => dispatch(selectionActions.setSelectionActive(id, active));
}

export function useSetSelectionHidden() {
    const dispatch = useDispatch();
    return (id, hidden) => dispatch(selectionActions.setSelectionHidden(id, hidden));
}

export function useSetSelectionGroupActive() {
    const dispatch = useDispatch();
    return (id, active) => dispatch(selectionActions.setGroupActive(id, active));
}

export function useSetSelectionGroupHidden() {
    const dispatch = useDispatch();
    return (id, hidden) => dispatch(selectionActions.setGroupHidden(id, hidden));
}

export function useFeatureGroups() {
    const dispatch = useDispatch();
    const groupList = useSelector(state => state.data.get("featureGroups"));
    return [
        groupList,
        (name, featureIDs, selected) => dispatch(createFeatureGroup(name, featureIDs, selected))
    ];
}

export function useSetFeatureSelect() {
    const dispatch = useDispatch();
    return (featureName, select, shift) =>
        dispatch(select ? featureSelect(featureName, shift) : featureUnselect(featureName, shift));
}

export function useChangeFeatureGroup() {
    const dispatch = useDispatch();
    return (featureName, id) => dispatch(changeFeatureGroup(featureName, id));
}

export function useSelectFeatureGroup() {
    const dispatch = useDispatch();
    return (id, selected) => dispatch(selectFeatureGroup(id, selected));
}

export function useDeleteFeatureGroup() {
    const dispatch = useDispatch();
    return id => dispatch(deleteFeatureGroup(id));
}

export function useRenameFeatureGroup() {
    const dispatch = useDispatch();
    return (id, name) => dispatch(renameFeatureGroup(id, name));
}

export function useFeatureListLoading() {
    const dispatch = useDispatch();
    const loading = useSelector(state => state.data.get("featureListLoading"));
    return [loading, isLoading => dispatch(featureListLoading(isLoading))];
}

export function useSelectFeatureInGroup(id) {
    const dispatch = useDispatch();
    const groupSelections = useSelector(state => {
        const group = state.data.get("featureGroups").find(group => group.get("id") === id);
        if (!group) {
            console.warn(`Error in "useSelectFeatureInGroup": Group with id ${id} not found`);
            return null;
        }
        return group.get("selectedFeatures");
    });
    return [
        groupSelections,
        (featureName, remove) => dispatch(selectFeatureInGroup(id, featureName, remove))
    ];
}

export function useBlobCache() {
    return window.bcache;
}

export function useDownsampledFeatures(windowHandle = undefined) {
    const domain = useSelector(state => state.data);
    const dispatch = useDispatch();
    const bcache = useBlobCache();

    const ungroupedFeatures = useSelector(state => state.data.get("featureList"))
        .filter(f => f.get("selected"))
        .map(f => f.get("name"));

    const featuresInGroups = useSelector(state =>
        state.data.get("featureGroups").reduce((acc, group) => {
            return acc.concat(group.get("selectedFeatures"));
        }, List())
    );

    const selectedFeatures = ungroupedFeatures.concat(featuresInGroups);

    // pin the selected features to the state on the first run
    const [pinned, setPinned] = useState(null);

    useEffect(() => {
        let to_be_loaded;
        if (
            windowHandle !== undefined &&
            windowHandle.data !== undefined &&
            windowHandle.data.features !== undefined
        ) {
            to_be_loaded = windowHandle.data.features;
        } else {
            to_be_loaded = selectedFeatures;
        }
        setPinned(to_be_loaded);

        let actions = to_be_loaded.map(f => requestFeatureLoad(f)).toJS();

        if (windowHandle !== undefined) {
            let win_data = { ...windowHandle?.data, features: to_be_loaded.toJS() };
            windowHandle.setData(win_data);
        }

        dispatch(batchActions(actions));
    }, []); // run once

    if (pinned === null) {
        return null;
    }

    const loadedData = domain.get("loadedData");

    const lockedFeatures = loadedData.filter(f => pinned.includes(f.get("feature")));

    // Ensure that we only return the features when they're locked
    if (pinned.size !== lockedFeatures.size) {
        return null;
    } else {
        console.log("returning locked features: ", lockedFeatures.toJS());
        return lockedFeatures.toJS().map(f => ({ ...f, data: bcache.get(f.data) }));
    }
}

/**
 * Lock a downsampled feature from the dataset, resolving directly from the server
 *
 * Returns both the data and a pair of functions to translate indices from the downsample to the underlying dataset and vice versa
 *
 * If data isn't ready, the data will be null and the translators will return 0 for all indices
 *
 * @param {obj} windowHandle window handle from WM
 * @return {triple} triple of [data, sel_to_downsample, downsample_to_sel]
 */
export function useDirectDownsampledFeatures(windowHandle = null) {
    const dispatch = useDispatch();

    const currentSelection = useSelector(state => state.selections.currentSelection);
    const [pinnedSelection] = useState(currentSelection);

    const allMetrics = useSelector(state => state.data.get("featureStats"));

    const ungroupedFeatures = useSelector(state => state.data.get("featureList"))
        .filter(f => f.get("selected"))
        .map(f => f.get("name"));

    const featuresInGroups = useSelector(state =>
        state.data.get("featureGroups").reduce((acc, group) => {
            return acc.concat(group.get("selectedFeatures"));
        }, List())
    );

    const selectedFeatures = ungroupedFeatures.concat(featuresInGroups);

    // pin the selected features to the state on the first run
    const [pinned, setPinned] = useState(null);

    // load the feature information
    const [data, setData] = useState(null);

    // use the selection translator
    const [selectionTranslators, setSelectionTranslators] = useState([() => null, () => 0]);

    // note that this will break if other kinds of downsamples are
    // permitted
    const createTranslatorPair = (downsample, downsampleMax) => {
        // if we don't need to downsample, then return identity functions
        if (downsampleMax === downsample) {
            return [i => i, i => i];
        }
        const stride_size = Math.floor(downsampleMax / downsample);

        const sel_to_downsample = sel_index => {
            if (0 === sel_index % stride_size) {
                return sel_index / stride_size;
            } else {
                return null;
            }
        };

        const downsample_to_sel = down_index => {
            return down_index * stride_size;
        };

        return [sel_to_downsample, downsample_to_sel];
    };

    useEffect(() => {
        // avoiding IFFE pattern to avoid TypeError on destruction
        // using IFFE returns a promise rather than a function and React
        // breaks on cleanup
        const asyncResolver = async () => {
            let to_be_loaded;
            if (
                windowHandle !== undefined &&
                windowHandle.data !== undefined &&
                windowHandle.data.features !== undefined
            ) {
                to_be_loaded = windowHandle.data.features;
            } else {
                to_be_loaded = selectedFeatures;
            }
            setPinned(to_be_loaded);

            to_be_loaded = "toJS" in to_be_loaded ? to_be_loaded.toJS() : to_be_loaded;

            if (windowHandle !== undefined) {
                let window_data = { ...windowHandle?.data, features: to_be_loaded };
                windowHandle.setData(window_data);
            }

            const downsampleMax = Math.min(
                ...to_be_loaded.map(f => allMetrics.getIn([f, "stats", "length"]))
            );

            const downsample = Math.min(
                windowHandle?.data?.downsample || DEFAULT_DOWNSAMPLE,
                downsampleMax
            );

            let feature_data = to_be_loaded.map(f => resolve_feature(f, downsample));

            feature_data = await Promise.all(feature_data);

            setSelectionTranslators(createTranslatorPair(downsample, downsampleMax));
            setData(to_be_loaded.map((v, i) => ({ feature: v, data: feature_data[i] })));

            // Hacks! this forces this graph to update
            dispatch(selectionActions.setCurrentSelection([]));
            dispatch(selectionActions.setCurrentSelection(pinnedSelection));
        };

        asyncResolver();
    }, []); // should only run once--data is treated as immutable

    if (pinned === null || data === null) {
        return [null, ...selectionTranslators];
    }
    if (
        windowHandle?.data?.downsample !== undefined &&
        data[0].data.length !== windowHandle?.data?.downsample
    ) {
        console.log(
            "data not shipping due to length mismatch...",
            data[0].data.length,
            windowHandle?.data?.downsample
        );
        return [null, () => null, () => 0];
    }

    return [data, ...selectionTranslators];
}
