/**
 * Data action creators, see docs/redux_docs.md
 * @author Patrick Kage
 */

import * as types from "./dataTypes";

// file data
export const fileLoad = (data, filename) => ({
    type: types.FILE_LOAD,
    data,
    filename
});

// feature mgmt

/**
 * Add a feature
 * @param {string} feature feature name
 * @return {object} non-dispatched action object
 */
export const featureAdd = (featureName, featureData) => ({
    type: types.FEATURE_ADD,
    featureName,
    featureData
});

/**
 * Select a feature
 * @param {string} feature feature name
 * @param {bool} shifted - whether shift key was held
 * @return {object} non-dispatched action object
 */
export const featureSelect = (feature, shifted) => ({
    type: types.FEATURE_SELECT,
    feature,
    shifted
});

/**
 * Unselect a feature
 * @param {string} feature feature name
 * @param {bool} shifted - whether shift key was held
 * @return {object} non-dispatched action object
 */
export const featureUnselect = (feature, shifted) => ({
    type: types.FEATURE_UNSELECT,
    feature,
    shifted
});

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
