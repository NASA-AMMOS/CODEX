/**
 * CODEX Data Store
 * @author Patrick Kage, Tariq Soliman
 * See docs/redux-docs.md file for more information
 */

import Immutable from "immutable";
import { createReducer } from "redux-create-reducer";
import { formulas } from "formulas/formulas";

import * as sels from "selectors/data";

/**
 * Initial state, as defined by docs file
 * The reason this is a function is because we need to convert
 * 'selected_features' to a Set instead of a Map.
 */
export const dataState = Immutable.fromJS({
    data: {},
    filename: null,
    master: {},
    selections: [],
    brush: {},
    // states needed only by its reducer
    _featureSelect: {
        last_shiftless_selected_feature: null
    },
    featureList: {}
});
