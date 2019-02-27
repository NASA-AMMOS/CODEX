import Immutable from "immutable";

export const uiState = Immutable.fromJS({
    // Mode on top right 'zoom', 'select', 'snap'
    mode: "select",
    // Drawing brush on graphs
    brush: {
        // type of brush
        type: "freehand",
        // which window id the user drew on last. -1 for none
        id: -1
    },
    history: []
});
