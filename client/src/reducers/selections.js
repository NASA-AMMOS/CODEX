import { selectionsState } from "reducers/models/selections";
import SelectionsReducer from "reducers/reducerFunctions/SelectionsReducer";
import * as actionTypes from "constants/actionTypes";

export default function selections(
    state = selectionsState,
    action,
    opt_reducer = SelectionsReducer
) {
    switch (action.type) {
        case actionTypes.CREATE_SELECTION:
            return opt_reducer.createSelection(state, action);
        default:
            return state;
    }
}
