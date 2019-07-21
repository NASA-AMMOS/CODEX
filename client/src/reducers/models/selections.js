export const selectionsState = {
    currentSelection: [],
    savedSelections: [],
    nextColorIndex: 0,
    hoverSelection: null,
    groups: [],
};

export const selectionModel = {
    name: "name",
    rowIndices: [],
    active: true,
    hidden: false,
    id: 0,
    groupID: null
};

export const groupModel = {
    id:null,
    hidden: false,
    active: true,
    info: null
}