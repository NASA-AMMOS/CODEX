/**
 * CODEX Data Store
 * @author Patrick Kage, Tariq Soliman
 * See docs/redux-docs.md file for more information
 */

import Immutable from "immutable";

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
