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
                    id: state.savedSelections.length,
                    rowIndices: state.currentSelection,
                    color: uiTypes.SELECTIONS_COLOR_PALETTE[state.nextColorIndex],
                    active: false,
                    hidden: false,
                    name: `Selection ${state.savedSelections.length + 1}`
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
                selection.id === action.id ? { ...selection, hidden: !selection.hidden } : selection
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
        //look to see if the selection is a duplicate
        //if so then update the selection with the same name
        for (let i = 0; i < state.savedSelections.length; i++) {
            const selection = state.savedSelections[i];
            if (selection.name === action.name) {
                let newSavedSelections = [...state.savedSelections];
                newSavedSelections[i] = {
                    id: i,
                    rowIndices: action.rowIndices,
                    color: selection.color,
                    active: true,
                    hidden: false,
                    name: action.name
                };

                return {
                    ...state,
                    savedSelections: newSavedSelections
                };
            }
        }

        return {
            ...state,
            savedSelections: state.savedSelections.concat([
                {
                    id: state.savedSelections.length,
                    rowIndices: action.rowIndices,
                    color: uiTypes.SELECTIONS_COLOR_PALETTE[state.nextColorIndex],
                    active: true,
                    hidden: false,
                    name: action.name
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
                    ? Object.assign(selection, { name: action.name })
                    : selection
            )
        };
    }

    static hoverSelection(state, action) {
        return { ...state, hoverSelection: action.id };
    }

    static setSelectionGroup(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.map(selection =>
                selection.id === action.id
                    ? Object.assign(selection, { groupID: action.groupID })
                    : selection
            )
        };
    }

    static setSavedSelections(state, action) {
        return {
            ...state,
            savedSelections: action.newSavedSelections
        };
    }
}
