/**
 * CODEX Data Store
 * @author Patrick Kage, Tariq Soliman
 * See docs/redux-docs.md file for more information
 */

import { fromJS, Set } from "immutable";
import { createReducer } from "redux-create-reducer";
import { formulas } from "formulas/formulas";

import * as sels from "selectors/data";

/**
 * Initial state, as defined by docs file
 * The reason this is a function is because we need to convert
 * 'selected_features' to a Set instead of a Map.
 */
export const getInitialState = (data, filename) => {
    const initialState = fromJS({
        data: {},
        filename: filename || null,
        master: {},
        selections: [],
        brush: {},
        selected_features: [],
        // states needed only by its reducer
        _featureSelect: {
            last_shiftless_selected_feature: null
        },
        featureList: {}
    });

    return initialState.updateIn(["selected_features"], () => Set());
};

/**
 * Color palette for newly created selections, as well as a master and brush selection
 */
const selectionsColorPalette = [
    "#7733e6",
    "#e63380",
    "#98e633",
    "#33e6c5",
    "#333be6",
    "#e63333",
    "#380f7b",
    "#7b0f3e",
    "#4c7b0f",
    "#0f7b67",
    "#0f157b",
    "#7b0f0f"
];
const selectionsMasterColor = "#335ce4";
const selectionsBrushColor = "#ff4500";

/**
 * Handle a FILE_LOAD
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const fileLoad = (state, action) => {
    return state
        .set(
            "featureList",
            fromJS(
                action.data.length
                    ? action.data[0].map(f => {
                          return { name: f, selected: false };
                      })
                    : []
            )
        )
        .set("filename", action.filename)
        .set(
            "master",
            fromJS({
                name: "Master",
                mask: action.data.length
                    ? Array.from(Array(action.data.length - 1), () => true)
                    : [],
                color: selectionsMasterColor,
                visible: true,
                emphasize: false
            })
        )
        .set("selections", fromJS([]))
        .set(
            "brush",
            fromJS({
                name: "Brush",
                mask: action.data.length
                    ? Array.from(Array(action.data.length - 1), () => false)
                    : [],
                color: selectionsBrushColor,
                visible: true,
                emphasize: false
            })
        );
};

/**
 * Handle a FEATURE_ADD
 * @param {Map} state - current state
 * @param {object} action - action
 * 			{string || array of strings} action.featureName
 * 			{array || array of arrays } action.featureData - array of feature values
 * @return {Map} new state
 */
const featureAdd = (state, action) => {
    //make sure featureName is unique
    let foundUniqueName = false;
    let uniqueNameIndex = 0;
    let testFeatureName = action.featureName;
    while (!foundUniqueName) {
        if (state.getIn(["data", 0]).includes(testFeatureName)) {
            testFeatureName = action.featureName + "_" + formulas.iToAlphabet(uniqueNameIndex);
            uniqueNameIndex++;
        } else {
            foundUniqueName = true;
        }
    }

    action.featureData.unshift(testFeatureName);
    if (action.featureData.length === state.get("data").size)
        return state.updateIn(["data"], d =>
            d.map((val, index, arr) => d.get(index).push(action.featureData[index]))
        );
    else {
        console.warn("FEATURE_ADD - Unsuccessful: new feature length differs from data length");
        return state;
    }
};

/**
 * Handle a FEATURE_SELECT
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const featureSelect = (state, action) => {
    // insert into the selected features set
    if (!action.shifted) {
        state = state.setIn(["_featureSelect", "last_shiftless_selected_feature"], action.feature);
        const newFeatureList = state
            .get("featureList")
            .map(f => (f.get("name") === action.feature ? f.set("selected", true) : f));
        return state
            .set("featureList", newFeatureList)
            .set(
                "selected_features",
                newFeatureList.filter(f => f.get("selected")).map(f => f.get("name"))
            );
    }

    // handle shift key

    // select everything between action.feature and last_shiftless
    //   (inclusive and regardless of which comes first)
    const shiftless = state.getIn(["_featureSelect", "last_shiftless_selected_feature"]);
    const firstItemIndex = state.get("featureList").findIndex(f => f.get("name") === shiftless);
    const lastItemIndex = state.get("featureList").findIndex(f => f.get("name") === action.feature);
    const range = [firstItemIndex, lastItemIndex].sort((a, b) => a - b);
    const newFeatureList = state.get("featureList").map((v, idx) => {
        if (idx >= range[0] && idx <= range[1]) {
            return v.set("selected", true);
        }
        return v;
    });
    return state
        .set("featureList", newFeatureList)
        .set(
            "selected_features",
            newFeatureList.filter(f => f.get("selected")).map(f => f.get("name"))
        );
};

/**
 * Handle a FEATURE_UNSELECT
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const featureUnselect = (state, action) => {
    // remove from the selected features set
    //if( !action.shifted ) //Ignore shift for now
    state = state.setIn(["_featureSelect", "last_shiftless_selected_feature"], action.feature);
    const newFeatureList = state
        .get("featureList")
        .map(f => (f.get("name") === action.feature ? f.set("selected", false) : f));
    return state.set("featureList", newFeatureList);
    //else {
    //TODO: handle shift key
    //	return state;
    //}
};
/**
 * Handle a FEATURES_UNSELECTALL
 * @param {Map} state current state
 * @return {Map} new state
 */
const featuresUnselectAll = state => {
    // reset the selected features set
    return state.updateIn(["selected_features"], () => Set());
};

/**
 * Handle a SELECTION_CREATE
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const selectionCreate = (state, action) => {
    let computedColor = action.color;
    if (computedColor === "") {
        // then select from our list of selection colors
        computedColor =
            selectionsColorPalette[state.get("selections").size % selectionsColorPalette.length];
    }

    // make sure name is unique
    const selNames = state.get("selections").map(sel => sel.get("name"));
    const savedActionName = action.name;
    let count = 0;
    while (selNames.includes(action.name)) {
        action.name = savedActionName + "_" + count;
        count++;
    }

    if (action.mask === "brush") action.mask = state.getIn(["brush", "mask"]);

    return state.updateIn(["selections"], sel =>
        sel.push(
            fromJS({
                name: action.name,
                mask: action.mask,
                color: computedColor,
                emphasize: false,
                visible: action.visible,
                meta: action.meta
            })
        )
    );
};

/**
 * Handle a SELECTION_REORDER
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const selectionReorder = (state, action) => {
    // complex: we're performing a map over the existing array, but for every index
    // we look up the index in the order array (from theg action) and return the
    // original value at that index. this results in a reordered array.
    return state.updateIn(["selections"], sel =>
        sel.map((val, index, arr) => arr.get(action.order[index]))
    );
};

/**
 * Handle a SELECTION_RECOLOR
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const selectionRecolor = (state, action) => {
    return state.updateIn(["selections", action.index], sel => sel.set("color", action.color));
};

/**
 * Handle a SELECTION_RENAME
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const selectionRename = (state, action) => {
    return state.updateIn(["selections", action.index], sel => sel.set("name", action.name));
};

/**
 * Handle a SELECTION_TOGGLE
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const selectionToggle = (state, action) => {
    return state.updateIn(["selections", action.index, "visible"], val => !val);
};

/**
 * Handle a SELECTIONS_UNSELECTALL
 * @param {Map} state current state
 * @return {Map} new state
 */
const selectionsUnselectAll = state => {
    // remove from the selected features set
    return state.updateIn(["selections"], sel => sel.map(val => val.set("visible", false)));
};

/**
 * Handle a SELECTION_EMPHASIZE
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const selectionEmphasisToggle = (state, action) => {
    return state.updateIn(["selections", action.index, "emphasize"], val => !val);
};

/**
 * Handle a SELECTION_REMOVE
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const selectionRemove = (state, action) => {
    return state.deleteIn(["selections", action.index]);
};

/**
 * Handle a BRUSH_UPDATE
 * @param {Map} state - current state
 * @param {object} action - action
 * 				{array} mask - of bools
 * @return {Map} new state
 */
const brushUpdate = (state, action) => {
    if (state.getIn(["brush", "mask"]).size === action.mask.length)
        return state.updateIn(["brush", "mask"], val => fromJS(action.mask));
    return state;
};

/**
 * Handle a BRUSH_UPDATE_AREA
 * @param {Map} state current state
 * @param {object} action action
 * 			{string} mode - 'rectangle' | 'freehand' | !
 * 			{array/object} area - of x, y objects with format dependent on mode
 *				//Freehand is [{x: 1, y: 1},{x: 1, y: 1}]
 *      		//Rectangle is { x: [min, max], y: [min, max]}
 * 			{string} xAxisFeature
 * 			{string} yAxisFeature
 * @return {Map} new state
 */
const brushUpdateArea = (state, action) => {
    let brushedMask = []; //false is unbrushed, true brushed

    const dataSize = state.get("data").size;

    let xFeatureI = state.getIn(["data", 0]).findIndex(i => i === action.xAxisFeature);
    let yFeatureI = state.getIn(["data", 0]).findIndex(i => i === action.yAxisFeature);
    if (xFeatureI === -1 || yFeatureI === -1) return state;

    for (let i = 1; i < dataSize; i++) {
        if (
            action.mode === "rectangle" &&
            state.getIn(["data", i, xFeatureI]) > action.area.x[0] &&
            state.getIn(["data", i, xFeatureI]) < action.area.x[1] &&
            state.getIn(["data", i, yFeatureI]) > action.area.y[0] &&
            state.getIn(["data", i, yFeatureI]) < action.area.y[1]
        ) {
            brushedMask.push(true);
        } else if (
            action.mode === "freehand" &&
            formulas.isPointInPoly(action.area, {
                x: state.getIn(["data", i, xFeatureI]),
                y: state.getIn(["data", i, yFeatureI])
            })
        ) {
            brushedMask.push(true);
        } else {
            brushedMask.push(false);
        }
    }

    if (state.getIn(["brush", "mask"]).size === brushedMask.length) {
        return state.updateIn(["brush", "mask"], val => fromJS(brushedMask));
    }
    return state;
};

/**
 * Handle a BRUSH_CLEAR
 * @param {Map} state current state
 * @param {object} action action
 * @return {Map} new state
 */
const brushClear = (state, action) => {
    // fill it with false
    const size = state.getIn(["brush", "mask"]).size;
    return state.updateIn(["brush", "mask"], val => fromJS(Array.from(Array(size), () => false)));
};

function updateData(state, action) {
    return state
        .set("data", fromJS(action.data))
        .set(
            "master",
            fromJS({
                name: "Master",
                mask: Array.from(Array(action.data.length - 1), () => true),
                color: selectionsMasterColor,
                visible: true,
                emphasize: false
            })
        )
        .set(
            "brush",
            fromJS({
                name: "Brush",
                mask: Array.from(Array(action.data.length - 1), () => false),
                color: selectionsBrushColor,
                visible: true,
                emphasize: false
            })
        );
}

/**
 * Data reducer
 */
export default createReducer(getInitialState(), {
    FILE_LOAD: fileLoad,
    FEATURE_ADD: featureAdd,
    FEATURE_SELECT: featureSelect,
    FEATURE_UNSELECT: featureUnselect,
    FEATURES_UNSELECTALL: featuresUnselectAll,
    SELECTION_CREATE: selectionCreate,
    SELECTION_REORDER: selectionReorder,
    SELECTION_RECOLOR: selectionRecolor,
    SELECTION_RENAME: selectionRename,
    SELECTION_EMPHASIZE: selectionEmphasisToggle,
    SELECTION_TOGGLE: selectionToggle,
    SELECTIONS_UNSELECTALL: selectionsUnselectAll,
    SELECTION_REMOVE: selectionRemove,
    BRUSH_UPDATE: brushUpdate,
    BRUSH_UPDATE_AREA: brushUpdateArea,
    BRUSH_CLEAR: brushClear,
    UPDATE_DATA: updateData
});
