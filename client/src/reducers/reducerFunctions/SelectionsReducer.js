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
                    id: `Selection_${state.savedSelections.length + 1}`,
                    rowIndices: state.currentSelection,
                    color: uiTypes.SELECTIONS_COLOR_PALETTE[state.nextColorIndex],
                    active: true,
                    hidden: false,
                    displayName: `Selection_${state.savedSelections.length + 1}`
                }
            ]),
            currentSelection: [],
            nextColorIndex: (state.nextColorIndex + 1) % uiTypes.SELECTIONS_COLOR_PALETTE.length
        };
    }

    static toggleSelectionHidden(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.map(selection =>
                selection.id === action.id ? { ...selection, hidden: !selection.hidden} : selection
            )
        };
    }

    static toggleSelectionActive(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.map(selection =>
                selection.id === action.id ? { ...selection, active: !selection.active } : selection
            )
        };
    }

    static saveNewSelection(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.concat([
                {
                    id: action.id,
                    rowIndices: action.rowIndices,
                    color: uiTypes.SELECTIONS_COLOR_PALETTE[state.nextColorIndex],
                    active: true,
                    hidden: false,
                    displayName: action.id
                }
            ]),
            nextColorIndex:
                state.nextColorIndex === uiTypes.SELECTIONS_COLOR_PALETTE.length - 1
                    ? 0
                    : state.nextColorIndex + 1
        };
    }

    static deleteSelection(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.filter(selection => selection.id !== action.id)
        };
    }

    static renameSelection(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.map(selection =>
                selection.id === action.id
                    ? Object.assign(selection, { displayName: action.name })
                    : selection
            )
        };
    }

    static hoverSelection(state, action) {
        return { ...state, hoverSelection: action.id };
    }
}
