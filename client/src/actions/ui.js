/**
 * Interface action creators
 */

import * as types from "constants/actionTypes";

/**
 * Handle an OPEN_GRAPH
 * @return {object} non-dispatched action object
 */
export const openGraph = (dataState, name, xaxis, yaxis, selections, randomFeatures) => ({
    type: types.OPEN_GRAPH,
    dataState,
    name,
    xaxis,
    yaxis,
    selections,
    randomFeatures
});

/**
 * Handle an OPEN_ALGORITHM
 * @return {object} non-dispatched action object
 */
export const openAlgorithm = (dataState, name, width, height) => ({
    type: types.OPEN_ALGORITHM,
    dataState,
    name,
    width,
    height
});

/**
 * Handle an OPEN_REPORT
 * @return {object} non-dispatched action object
 */
export const openReport = (dataState, name, width, height) => ({
    type: types.OPEN_REPORT,
    dataState,
    name,
    width,
    height
});

/**
 * Handle an OPEN_DEVELOPMENT
 * @return {object} non-dispatched action object
 */
export const openDevelopment = (dataState, name, width, height) => ({
    type: types.OPEN_DEVELOPMENT,
    dataState,
    name,
    width,
    height
});

/**
 * Handle a BRUSHTYPE_SET
 * @param {string} brushtype - 'rectangle', 'freehand'
 * @return {object} non-dispatched action object
 */
export const brushtypeSet = brushtype => ({
    type: types.BRUSHTYPE_SET,
    brushtype
});

/**
 * Handle a BRUSHID_SET
 * @param {int} id - window id of graph brushed on
 * @return {object} non-dispatched action object
 */
export const brushIdSet = id => ({
    type: types.BRUSHID_SET,
    id
});

/**
 * Handle a MODE_SET
 * @param {string} mode - 'zoom', 'select', 'snap
 * @return {object} non-dispatched action object
 */
export const modeSet = mode => ({
    type: types.MODE_SET,
    mode
});

/**
 * Handle a ADD_TO_HISTORY
 * @param {string} status - 'success', 'warning', 'error', 'note
 * @param {string} kind - a type
 * @param {string} description
 * @return {object} non-dispatched action object
 */
export const addToHistory = (status, kind, description) => ({
    type: types.ADD_TO_HISTORY,
    status,
    kind,
    description
});
