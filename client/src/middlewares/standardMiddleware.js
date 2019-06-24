import * as actionTypes from "constants/actionTypes";

export const selectionMiddleware = store => next => action => {
    //todo get this middleware to upload the selections to the backend
    if (action.type == actionTypes.SAVE_CURRENT_SELECTION) {
        //upload the current selection to the backend
        console.log(store.getState().selections);
        const request = {
            routine: "arrange",
            hashType: "selection",
            //activity: "metrics",
            //'name': features,
            cid: "8vrjn"
        };
    } else if (action.type == actionTypes.SAVE_NEW_SELECTION) {
        //upload the saved selection to the backend
    }
    
    next(action);
}