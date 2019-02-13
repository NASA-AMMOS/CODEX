import { combineReducers } from "redux";
import data from "reducers/data";
import ui from "reducers/ui";

const rootReducer = combineReducers({
    data,
    ui
});

export default rootReducer;
