import Immutable from "immutable";

import * as uiTypes from "constants/uiTypes";

const formulas = {}; //This is just a placeholder to remove some compiler errors, we'll need to fully rebuild the forumulas
// stuff at some point.

export default class DataReducer {
    static setFeatureListLoading(state, action) {
        return state.set("featureListLoading", action.isLoading);
    }

    /**
     * Handle a FILE_LOAD
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static fileLoad(state, action) {
        return state
            .set(
                "featureList",
                Immutable.fromJS(
                    action.data.map(f => {
                        return { name: f, selected: false };
                    })
                )
            )
            .set("filename", action.filename)
            .set(
                "master",
                Immutable.fromJS({
                    name: "Master",
                    mask: action.data.length
                        ? Array.from(Array(action.data.length - 1), () => true)
                        : [],
                    color: uiTypes.SELECTIONS_MASTER_COLOR,
                    visible: true,
                    emphasize: false
                })
            )
            .set("selections", Immutable.fromJS([]))
            .set(
                "brush",
                Immutable.fromJS({
                    name: "Brush",
                    mask: action.data.length
                        ? Array.from(Array(action.data.length - 1), () => false)
                        : [],
                    color: uiTypes.SELECTIONS_BRUSH_COLOR,
                    visible: true,
                    emphasize: false
                })
            )
            .set("loadedData", Immutable.fromJS([]));
    }

    /**
     * Handle a FEATURE_ADD
     * @param {Map} state - current state
     * @param {object} action - action
     *          {string || array of strings} action.featureName
     *          {array || array of arrays } action.featureData - array of feature values
     * @return {Map} new state
     */
    static featureAdd(state, action) {
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
    }

    /**
     * Handle a FEATURE_SELECT
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static featureSelect(state, action) {
        // insert into the selected features set
        if (!action.shifted) {
            state = state.setIn(
                ["_featureSelect", "last_shiftless_selected_feature"],
                action.feature
            );
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
        const lastItemIndex = state
            .get("featureList")
            .findIndex(f => f.get("name") === action.feature);
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
    }

    /**
     * Handle a FEATURE_UNSELECT
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static featureUnselect(state, action) {
        // remove from the selected features set
        //if( !action.shifted ) //Ignore shift for now
        state = state.setIn(["_featureSelect", "last_shiftless_selected_feature"], action.feature);
        const newFeatureList = state
            .get("featureList")
            .map(f => (f.get("name") === action.feature ? f.set("selected", false) : f));
        return state.set("featureList", newFeatureList);
        //else {
        //TODO: handle shift key
        //  return state;
        //}
    }
    /**
     * Handle a FEATURES_UNSELECTALL
     * @param {Map} state current state
     * @return {Map} new state
     */
    static featuresUnselectAll(state) {
        // reset the selected features set
        return state.updateIn(["selected_features"], () => new Set());
    }

    /**
     * Handle a SELECTION_CREATE
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static selectionCreate(state, action) {
        let computedColor = action.color;
        if (computedColor === "") {
            // then select from our list of selection colors
            computedColor =
                uiTypes.SELECTIONS_COLOR_PALETTE[
                    state.get("selections").size % uiTypes.SELECTIONS_COLOR_PALETTE.length
                ];
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
                Immutable.fromJS({
                    name: action.name,
                    mask: action.mask,
                    color: computedColor,
                    emphasize: false,
                    visible: action.visible,
                    meta: action.meta
                })
            )
        );
    }

    /**
     * Handle a SELECTION_REORDER
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static selectionReorder(state, action) {
        // complex: we're performing a map over the existing array, but for every index
        // we look up the index in the order array (from theg action) and return the
        // original value at that index. this results in a reordered array.
        return state.updateIn(["selections"], sel =>
            sel.map((val, index, arr) => arr.get(action.order[index]))
        );
    }

    /**
     * Handle a SELECTION_RECOLOR
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static selectionRecolor(state, action) {
        return state.updateIn(["selections", action.index], sel => sel.set("color", action.color));
    }

    /**
     * Handle a SELECTION_RENAME
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static selectionRename(state, action) {
        return state.updateIn(["selections", action.index], sel => sel.set("name", action.name));
    }

    /**
     * Handle a SELECTION_TOGGLE
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static selectionToggle(state, action) {
        return state.updateIn(["selections", action.index, "visible"], val => !val);
    }

    /**
     * Handle a SELECTIONS_UNSELECTALL
     * @param {Map} state current state
     * @return {Map} new state
     */
    static selectionsUnselectAll(state) {
        // remove from the selected features set
        return state.updateIn(["selections"], sel => sel.map(val => val.set("visible", false)));
    }

    /**
     * Handle a SELECTION_EMPHASIZE
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static selectionEmphasisToggle(state, action) {
        return state.updateIn(["selections", action.index, "emphasize"], val => !val);
    }

    /**
     * Handle a SELECTION_REMOVE
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static selectionRemove(state, action) {
        return state.deleteIn(["selections", action.index]);
    }

    /**
     * Handle a BRUSH_UPDATE
     * @param {Map} state - current state
     * @param {object} action - action
     *              {array} mask - of bools
     * @return {Map} new state
     */
    static brushUpdate(state, action) {
        if (state.getIn(["brush", "mask"]).size === action.mask.length)
            return state.updateIn(["brush", "mask"], val => Immutable.fromJS(action.mask));
        return state;
    }

    /**
     * Handle a BRUSH_UPDATE_AREA
     * @param {Map} state current state
     * @param {object} action action
     *          {string} mode - 'rectangle' | 'freehand' | !
     *          {array/object} area - of x, y objects with format dependent on mode
     *              //Freehand is [{x: 1, y: 1},{x: 1, y: 1}]
     *              //Rectangle is { x: [min, max], y: [min, max]}
     *          {string} xAxisFeature
     *          {string} yAxisFeature
     * @return {Map} new state
     */
    static brushUpdateArea(state, action) {
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
            return state.updateIn(["brush", "mask"], val => Immutable.fromJS(brushedMask));
        }
        return state;
    }

    /**
     * Handle a BRUSH_CLEAR
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static brushClear(state, action) {
        // fill it with false
        const size = state.getIn(["brush", "mask"]).size;
        return state.updateIn(["brush", "mask"], val =>
            Immutable.fromJS(Array.from(Array(size), () => false))
        );
    }

    static updateData(state, action) {
        return state
            .set("data", Immutable.fromJS(action.data))
            .set(
                "master",
                Immutable.fromJS({
                    name: "Master",
                    mask: Array.from(Array(action.data.length - 1), () => true),
                    color: uiTypes.SELECTIONS_MASTER_COLOR,
                    visible: true,
                    emphasize: false
                })
            )
            .set(
                "brush",
                Immutable.fromJS({
                    name: "Brush",
                    mask: Array.from(Array(action.data.length - 1), () => false),
                    color: uiTypes.SELECTIONS_BRUSH_COLOR,
                    visible: true,
                    emphasize: false
                })
            );
    }

    /**
     * Add a dataset into the loaded state
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static addDataset(state, action) {
        const newDataset = Immutable.fromJS({
            feature: action.feature,
            data: action.data,
            clusters: action.clusters,
            references: action.autoRef ? 1 : 0
        });

        return state.set("loadedData", state.get("loadedData").push(newDataset));
    }

    static addFeature(state, action) {
        return state.set(
            "featureList",
            state
                .get("featureList")
                .push(Immutable.fromJS({ name: action.feature, selected: false }))
        );
    }

    /**
     * Handle a FEATURE_LIFETIME_RETAIN (reference counting)
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static featureRetain(state, action) {
        const targetIndex = state
            .get("loadedData")
            .findIndex(obj => obj.get("feature") === action.feature);

        if (targetIndex === -1) {
            console.warn(
                "Attempting to set feature lifetime info for a feature that is not yet loaded!"
            );
            return state;
        }

        const refCount = state.getIn(["loadedData", targetIndex, "references"]);

        return state.setIn(["loadedData", targetIndex, "references"], refCount + 1);
    }

    /**
     * Handle a FEATURE_LIFETIME_RELEASE (reference counting)
     * @param {Map} state current state
     * @param {object} action action
     * @return {Map} new state
     */
    static featureRelease(state, action) {
        const targetIndex = state
            .get("loadedData")
            .findIndex(obj => obj.get("feature") === action.feature);

        if (targetIndex === -1) {
            console.warn(
                "Attempting to set feature lifetime info for a feature that is not yet loaded!"
            );
            return state;
        }

        const refCount = state.getIn(["loadedData", targetIndex, "references"]);

        return state.setIn(
            ["loadedData", targetIndex, "references"],
            refCount > 0 ? refCount - 1 : 0
        );
    }
}
