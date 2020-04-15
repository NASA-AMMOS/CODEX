/**
 * Data action creators, see docs/redux_docs.md
 * @author Patrick Kage
 */

import { getGlobalSessionKey } from "utils/utils";
import WorkerSocket from "worker-loader!workers/socket.worker";
import WorkerUpload from "worker-loader!workers/upload.worker";
import * as types from "constants/actionTypes";
import * as uiActions from "actions/ui";

export function fileLoad(fileList) {
    return dispatch => {
        // Clear out list of feature names while we handle new file
        dispatch({ type: types.FILE_LOAD, data: [], filename: "" });
        dispatch({ type: types.FEATURE_LIST_LOADING, isLoading: true });
        dispatch({ type: types.CLOSE_ALL_WINDOWS });

        let workerUpload = new WorkerUpload();
        workerUpload.addEventListener("message", msg => {
            const res = JSON.parse(msg.data);
            if (res.status !== "complete") {
                if (res.percent + 0.1 > 1) {
                    dispatch(uiActions.setUploadStateProcessing());
                } else {
                    dispatch(uiActions.setUploadStateUploading(res.percent));
                }
                return;
            }
            dispatch(uiActions.setUploadStateDone());
            dispatch({
                type: types.FILE_LOAD,
                data: res.feature_names,
                filename: res.filename,
                nan: res.nan,
                inf: res.inf,
                ninf: res.ninf
            });
            dispatch({ type: types.FEATURE_LIST_LOADING, isLoading: false });
            workerUpload = null;
        });

        workerUpload.postMessage({
            files: fileList,
            sessionkey: getGlobalSessionKey(),
            NODE_ENV: process.env.NODE_ENV
        });
    };
}

// feature mgmt
export function featureListLoading(isLoading) {
    return { type: types.FEATURE_LIST_LOADING, isLoading };
}

/**
 * Add a feature
 * @param {string} feature feature name
 * @return {object} non-dispatched action object
 */
export const featureAdd = (featureName, featureData) => ({
    type: types.ADD_FEATURE,
    featureName,
    featureData
});

/**
 * Select a feature
 * @param {string} feature feature name
 * @param {bool} shifted - whether shift key was held
 * @return {object} non-dispatched action object
 */
export function featureSelect(feature, shifted) {
    return {
        type: types.FEATURE_SELECT,
        feature,
        shifted
    };
}

/**
 * Unselect a feature
 * @param {string} feature feature name
 * @param {bool} shifted - whether shift key was held
 * @return {object} non-dispatched action object
 */
export function featureUnselect(feature, shifted) {
    return {
        type: types.FEATURE_UNSELECT,
        feature,
        shifted
    };
}

/**
 * Unselect all features
 * @return {object} non-dispatched action object
 */
export const featuresUnselectAll = () => ({
    type: types.FEATURES_UNSELECTALL
});

// selection mgmt

/**
 * Create a selection
 * @param {string} name - name of the selection
 * @param {array} mask - array of true/false values
 *        {string} mask - 'brush' to copy brush's mask into it
 * @param {bool} visible - set initial visibility
 * @param {string} color - color of points
 * @return {object} non-dispatched action object
 */
export const selectionCreate = (name, mask, visible = false, color = "", meta) => ({
    type: types.SELECTION_CREATE,
    name,
    mask,
    color,
    visible: visible,
    emphasis: false,
    meta
});

/**
 * Reorder the list of selections
 * @param {array} order array of indices, in new order
 * @return {object} non-dispatched action object
 */
export const selectionReorder = order => ({
    type: types.SELECTION_REORDER,
    order
});

/**
 * Recolor the selection at index N
 * @param {number} index index to replace color of
 * @param {string} color the new color of index N
 * @return {object} non-dispatched action object
 */
export const selectionRecolor = (index, color) => ({
    type: types.SELECTION_RECOLOR,
    index,
    color
});

/**
 * Rename the selection at index N
 * @param {number} index index to replace name of
 * @param {string} name the new name of index N
 * @return {object} non-dispatched action object
 */
export const selectionRename = (index, name) => ({
    type: types.SELECTION_RENAME,
    index,
    name
});

/**
 * Toggle the visibility of a selection
 * @param {number} index index of selection to toggle
 * @return {object} non-dispatched action object
 */
export const selectionToggle = index => ({
    type: types.SELECTION_TOGGLE,
    index
});

/**
 * Unselect all selections
 * @return {object} non-dispatched action object
 */
export const selectionsUnselectAll = () => ({
    type: types.SELECTIONS_UNSELECTALL
});

/**
 * Toggle the emphasis of a selection
 * @param {number} index index of selection to toggle
 * @return {object} non-dispatched action object
 */
export const selectionEmphasisToggle = index => ({
    type: types.SELECTION_EMPHASIZE,
    index
});

/**
 * Remove a selection
 * @param {index} index index of selection to remove
 * @return {object} non-dispatched action object
 */
export const selectionRemove = index => ({
    type: types.SELECTION_REMOVE,
    index
});

/**
 * Update brush's mask
 * @param {mask} the mask to assign to brush
 * @return {object} non-dispatched action object
 */
export const brushUpdate = mask => ({
    type: types.BRUSH_UPDATE,
    mask
});

/**
 * Update brush's mask by an area
 * @param {Map} state current state
 *
 * @param {string} mode - 'rectangle' | 'freehand' | !
 * @param {array} area - of x, y objects with format dependent on mode
 *              //Freehand is [{x: 1, y: 1},{x: 1, y: 1}]
 *              //Rectangle is { x: [min, max], y: [min, max]}
 * @param {string} xAxisFeature
 * @param {string} yAxisFeature
 *
 * @return {Map} new state
 */
export const brushUpdateArea = (mode, area, xAxisFeature, yAxisFeature) => ({
    type: types.BRUSH_UPDATE_AREA,
    mode,
    area,
    xAxisFeature,
    yAxisFeature
});

/**
 * Clear brush's mask
 * @param {mask} the mask to assign to brush
 * @return {object} non-dispatched action object
 */
export const brushClear = () => ({
    type: types.BRUSH_CLEAR
});

/**
 * Retain a feature (for reference counting)
 * @param {string} featureName
 * @return {object} non-dispatched action object
 */
export const featureRetain = featureName => ({
    type: types.FEATURE_LIFETIME_RETAIN,
    feature: featureName
});

/**
 * Release a feature (for reference counting)
 * @param {string} featureName
 * @return {object} non-dispatched action object
 */
export const featureRelease = featureName => ({
    type: types.FEATURE_LIFETIME_RELEASE,
    feature: featureName
});

/**
 * Rename a feature
 * @param {string} oldFeatureName
 * @param {string} newFeatureName
 * @return {object} non-dispatched action object
 */
export const featureRename = (baseName, newName) => {
    return {
        type: types.RENAME_FEATURE,
        baseName,
        newName
    };
};

/**
 * Add a dataset to the store
 * @param {string} featureName
 * @param {array} data
 * @return {object} non-dispatched action object
 */
export const addDataset = (featureName, data) => ({
    type: types.ADD_DATASET,
    feature: featureName,
    data
});

/**
 * Set a feature's stat status to loading
 * @param {string} featureName
 * @return {object} non-dispatched action object
 */
export const statSetFeatureLoading = featureName => ({
    type: types.STAT_SET_FEATURE_LOADING,
    feature: featureName
});

/**
 * Set a feature's stat status to failed
 * @param {string} featureName
 * @return {object} non-dispatched action object
 */
export const statSetFeatureFailed = featureName => ({
    type: types.STAT_SET_FEATURE_FAILED,
    feature: featureName
});

/**
 * Set a feature's stats
 * @param {string} featureName
 * @param {array} data
 * @return {object} non-dispatched action object
 */
export const statSetFeatureResolved = (featureName, data) => ({
    type: types.STAT_SET_FEATURE_RESOLVED,
    feature: featureName,
    data
});

/**
 * Remove a feature
 * @param {string} featureName
 * @return {object} non-dispatched action object
 */
export const featureDelete = featureName => {
    const socketWorker = new WorkerSocket();
    const request = {
        routine: "arrange",
        hashType: "feature",
        sessionkey: getGlobalSessionKey(),
        activity: "delete",
        name: [featureName]
    };

    socketWorker.postMessage(
        JSON.stringify({
            action: types.SIMPLE_REQUEST,
            request
        })
    );

    return {
        type: types.DELETE_FEATURE,
        feature: featureName
    };
};

export function createFeatureGroup(name, featureIDs, selected) {
    return { type: types.CREATE_FEATURE_GROUP, name, featureIDs, selected };
}

export function changeFeatureGroup(featureName, id) {
    return { type: types.CHANGE_FEATURE_GROUP, featureName, id };
}

export function selectFeatureGroup(id, selected) {
    return { type: types.SELECT_FEATURE_GROUP, id, selected };
}

export function deleteFeatureGroup(id) {
    return { type: types.DELETE_FEATURE_GROUP, id };
}

export function renameFeatureGroup(id, name) {
    return { type: types.RENAME_FEATURE_GROUP, id, name };
}
