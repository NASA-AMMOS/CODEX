import Immutable from "immutable";

let config = require("config").config;
if (process.env.NODE_ENV === "test") config = require("config.mock").config;

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
    history: [],
    graphs: config.config.graphs,
    algorithms: config.config.algorithms,
    reports: config.config.reports,
    groups: config.config.groups
});
