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
                    name: `Selection ${state.savedSelections.length + 1}`,
                    groupID: null
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
        return {
            ...state,
            savedSelections: state.savedSelections.concat([
                {
                    id: state.savedSelections.length,
                    rowIndices: action.rowIndices,
                    color: uiTypes.SELECTIONS_COLOR_PALETTE[state.nextColorIndex],
                    active: true,
                    hidden: false,
                    name: action.name,
                    groupID: action.groupID
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
            savedSelections: state.savedSelections.filter(selection => selection.id !== action.id),
            hoverSelection: state.hoverSelection === action.id ? null : state.hoverSelection
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

    static createSelectionGroup(state, action) {
        const uniqueID = (function() {
            for (let group of state.groups) {
                if (action.id === group.id) return false;
            }
            return true;
        })();
        if (!uniqueID) return state;

        return {
            ...state,
            groups: [
                ...state.groups,
                {
                    id: action.id,
                    active: true,
                    hidden: false,
                    info: null
                }
            ]
        };
    }

    static toggleGroupHidden(state, action) {
        return {
            ...state,
            groups: state.groups.map(group =>
                group.id === action.id ? { ...group, hidden: !group.hidden } : group
            )
        };
    }

    static toggleGroupActive(state, action) {
        return {
            ...state,
            groups: state.groups.map(group =>
                group.id === action.id ? { ...group, active: !group.active } : group
            )
        };
    }

    static removeAllSelections(state, action) {
        return {
            ...state,
            savedSelections: []
        };
    }
}
