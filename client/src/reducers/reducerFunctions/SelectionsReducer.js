import * as uiTypes from "constants/uiTypes";
import * as utils from "utils/utils";

export default class SelectionsReducer {
    static setCurrentSelection(state, action) {
        return { ...state, currentSelection: action.rowIndices };
    }

    static saveCurrentSelection(state, action) {
        function getUniqueId() {
            const id = utils.createNewId();
            return !state.savedSelections.find(group => group.id === id) ? id : getUniqueId();
        }
        const id = getUniqueId();

        const palette = utils.getSelectionPalette();
        return {
            ...state,
            savedSelections: state.savedSelections.concat([
                {
                    id,
                    rowIndices: state.currentSelection,
                    color: palette[state.nextColorIndex],
                    active: false,
                    hidden: false,
                    name: action.name || `Selection ${state.savedSelections.length + 1}`,
                    groupID: null
                }
            ]),
            currentSelection: [],
            nextColorIndex: (state.nextColorIndex + 1) % palette.length
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
        const palette = utils.getSelectionPalette();
        function getUniqueId() {
            const id = utils.createNewId();
            return !state.savedSelections.find(group => group.id === id) ? id : getUniqueId();
        }
        const id = getUniqueId();
        return {
            ...state,
            savedSelections: state.savedSelections.concat([
                {
                    id,
                    rowIndices: action.rowIndices,
                    color: palette[state.nextColorIndex],
                    active: true,
                    hidden: false,
                    name: action.name,
                    groupID: action.groupID
                }
            ]),
            nextColorIndex:
                state.nextColorIndex === palette.length - 1 ? 0 : state.nextColorIndex + 1
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
                    ? Object.assign(selection, {
                          groupID: action.groupID,
                          hidden: action.groupID
                              ? state.groups.find(group => group.id === action.groupID).hidden
                              : selection.hidden
                      })
                    : selection
            )
        };
    }

    static createSelectionGroup(state, action) {
        function getUniqueId() {
            const id = utils.createNewId();
            return !state.groups.find(group => group.id === id) ? id : getUniqueId();
        }
        const id = getUniqueId();

        const updatedSelections = action.selections
            ? state.savedSelections.map(sel =>
                  action.selections.includes(sel.id) ? { ...sel, groupID: id } : sel
              )
            : state.savedSelections;

        return {
            ...state,
            groups: [
                ...state.groups,
                {
                    id,
                    active: true,
                    hidden: false,
                    info: null,
                    name: action.name
                }
            ],
            savedSelections: updatedSelections
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
        const isActive = state.groups.find(group => group.id == action.id).active;
        return {
            ...state,
            savedSelections: state.savedSelections.map(sel =>
                sel.groupID === action.id ? { ...sel, active: isActive } : sel
            ),
            groups: state.groups.map(group =>
                group.id === action.id ? { ...group, active: !isActive } : group
            )
        };
    }

    static removeAllSelections(state, action) {
        return {
            ...state,
            savedSelections: []
        };
    }

    static deleteSectionGroup(state, action) {
        return {
            ...state,
            groups: state.groups.filter(group => group.id !== action.id),
            savedSelections: state.savedSelections.map(sel =>
                sel.groupID === action.id ? { ...sel, groupID: null } : sel
            )
        };
    }

    static renameSectionGroup(state, action) {
        return {
            ...state,
            groups: state.groups.map(group =>
                group.id === action.id ? { ...group, name: action.name } : group
            )
        };
    }

    static setSelectionActive(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.map(selection =>
                selection.id === action.id ? { ...selection, active: action.active } : selection
            )
        };
    }

    static setSelectionHidden(state, action) {
        return {
            ...state,
            savedSelections: state.savedSelections.map(selection =>
                selection.id === action.id ? { ...selection, hidden: action.hidden } : selection
            )
        };
    }

    static setGroupActive(state, action) {
        return {
            ...state,
            groups: state.groups.map(group =>
                group.id === action.id ? { ...group, active: action.active } : group
            ),
            savedSelections: state.savedSelections.map(sel =>
                sel.groupID === action.id ? { ...sel, active: action.active } : sel
            )
        };
    }

    static setGroupHidden(state, action) {
        return {
            ...state,
            groups: state.groups.map(group =>
                group.id === action.id ? { ...group, hidden: action.hidden } : group
            ),
            savedSelections: state.savedSelections.map(sel =>
                sel.groupID === action.id ? { ...sel, hidden: action.hidden } : sel
            )
        };
    }
}
