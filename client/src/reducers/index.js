import { combineReducers } from "redux";
import data from "reducers/data";
import ui from "reducers/ui";
import windowManager from "reducers/windowManager";

const rootReducer = combineReducers({
    data,
    ui,
    windowManager
});

export default rootReducer;
