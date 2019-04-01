import * as uiTypes from "constants/uiTypes";
import * as selectionState from "reducers/models/selections";

export default class SelectionsReducer {
    static setCurrentSelection(state, action) {
        return { ...state, currentSelection: action.rowIndices };
    }

    static saveCurrentSelection(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.concat([
                {
                    name: `Selection_${state.savedSelections.length + 1}`,
                    rowIndices: state.currentSelection,
                    color: uiTypes.SELECTIONS_COLOR_PALETTE[state.nextColorIndex],
                    active: true
                }
            ]),
            currentSelection: [],
            nextColorIndex:
                state.nextColorIndex === uiTypes.SELECTIONS_COLOR_PALETTE.length - 1
                    ? 0
                    : state.nextColorIndex + 1
        };
    }

    static toggleSelectionActive(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.map(selection =>
                selection.name === action.name
                    ? { ...selection, active: !selection.active }
                    : selection
            )
        };
    }

    static saveNewSelection(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.concat([
                {
                    name: action.name,
                    rowIndices: action.rowIndices,
                    color: uiTypes.SELECTIONS_COLOR_PALETTE[state.nextColorIndex],
                    active: true
                }
            ]),
            nextColorIndex:
                state.nextColorIndex === uiTypes.SELECTIONS_COLOR_PALETTE.length - 1
                    ? 0
                    : state.nextColorIndex + 1
        };
    }
}
