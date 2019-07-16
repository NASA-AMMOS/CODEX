/**
 * Redux setup
 * @author Patrick Kage
 */
import { createLogger } from "redux-logger";
import { createStore, applyMiddleware, compose } from "redux";
import thunkMiddleware from "redux-thunk";
import { batchDispatchMiddleware } from "redux-batched-actions";
import * as middleware from "middlewares/standardMiddleware.js";

import rootReducer from "reducers";

export default function configureStore(initialState) {
    const logger = createLogger();

    const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
    const store = createStore(
        rootReducer,
        initialState,
        composeEnhancers(
            applyMiddleware(
                batchDispatchMiddleware,
                thunkMiddleware,
                middleware.selectionMiddleware
            )
        )
    );

    if (module.hot) {
        // Enable Webpack hot module replacement for reducers
        module.hot.accept("./reducers", () => {
            const nextReducer = require("./reducers").default;
            store.replaceReducer(nextReducer);
        });
    }

    return store;
}
