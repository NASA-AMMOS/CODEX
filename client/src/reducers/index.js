import { combineReducers } from "redux";

import data from "./data";
import selections from "./selections";
import ui from "./ui";
import windowManager from "./windowManager";

const rootReducer = combineReducers({
    data,
    ui,
    windowManager,
    selections
});

export default rootReducer;
