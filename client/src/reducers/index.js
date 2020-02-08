import { combineReducers } from "redux";
import data from "reducers/data";
import ui from "reducers/ui";
import windowManager from "reducers/windowManager";
import selections from "reducers/selections";

const rootReducer = combineReducers({
    data,
    ui,
    windowManager,
    selections
});

export default rootReducer;
