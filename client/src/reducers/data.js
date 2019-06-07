import { dataState } from "reducers/models/data";
import DataReducer from "reducers/reducerFunctions/DataReducer";
import * as actionTypes from "constants/actionTypes";

export default function data(state = dataState, action, opt_reducer = DataReducer) {
    switch (action.type) {
        case actionTypes.FILE_LOAD:
            return opt_reducer.fileLoad(state, action);
        case actionTypes.FEATURE_ADD:
            return opt_reducer.featureAdd(state, action);
        case actionTypes.FEATURE_SELECT:
            return opt_reducer.featureSelect(state, action);
        case actionTypes.FEATURE_UNSELECT:
            return opt_reducer.featureUnselect(state, action);
        case actionTypes.FEATURES_UNSELECTALL:
            return opt_reducer.featuresUnselectAll(state, action);
        case actionTypes.SELECTION_CREATE:
            return opt_reducer.selectionCreate(state, action);
        case actionTypes.SELECTION_REORDER:
            return opt_reducer.selectionReorder(state, action);
        case actionTypes.SELECTION_RECOLOR:
            return opt_reducer.selectionRecolor(state, action);
        case actionTypes.SELECTION_RENAME:
            return opt_reducer.selectionRename(state, action);
        case actionTypes.SELECTION_EMPHASIZE:
            return opt_reducer.selectionEmphasisToggle(state, action);
        case actionTypes.SELECTION_TOGGLE:
            return opt_reducer.selectionToggle(state, action);
        case actionTypes.SELECTIONS_UNSELECTALL:
            return opt_reducer.selectionsUnselectAll(state, action);
        case actionTypes.SELECTION_REMOVE:
            return opt_reducer.selectionRemove(state, action);
        case actionTypes.BRUSH_UPDATE:
            return opt_reducer.brushUpdate(state, action);
        case actionTypes.BRUSH_UPDATE_AREA:
            return opt_reducer.brushUpdateArea(state, action);
        case actionTypes.BRUSH_CLEAR:
            return opt_reducer.brushClear(state, action);
        case actionTypes.UPDATE_DATA:
            return opt_reducer.updateData(state, action);
        case actionTypes.FEATURE_LIST_LOADING:
            return opt_reducer.setFeatureListLoading(state, action);
        case actionTypes.ADD_DATASET:
            return opt_reducer.addDataset(state, action);
        case actionTypes.ADD_FEATURE:
            return opt_reducer.addFeature(state, action);
        case actionTypes.FEATURE_LIFETIME_RETAIN:
            return opt_reducer.featureRetain(state, action);
        case actionTypes.FEATURE_LIFETIME_RELEASE:
            return opt_reducer.featureRelease(state, action);
        default:
            return state;
    }
}
