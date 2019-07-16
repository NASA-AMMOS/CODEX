/**
 * CODEX Data Store
 * @author Patrick Kage, Tariq Soliman
 * See docs/redux-docs.md file for more information
 */

import Immutable from "immutable";
import { createMemorableId } from "utils/utils";

export const dataState = Immutable.fromJS({
    data: [],
    loadedData: [],
    filename: null,
    master: {},
    currentSelectedRows: [],
    savedSelections: [],
    brush: {},
    // states needed only by its reducer
    _featureSelect: {
        last_shiftless_selected_feature: null
    },
    featureList: [],
    featureListLoading: false,
    serverSessionKey: createMemorableId()
});

export const loadedDataModel = {
    feature: "",
    data: [],
    clusters: []
};
