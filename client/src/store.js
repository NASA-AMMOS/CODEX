/**
 * Redux setup
 * @author Patrick Kage
 */
import { createLogger } from "redux-logger";
import { createStore, applyMiddleware, compose } from "redux";
import Immutable from "immutable";
import thunkMiddleware from "redux-thunk";

import rootReducer from "reducers";

import window from "./Components/RWindowManager/Window/Window";

export default function configureStore(initialState) {
    const logger = createLogger();

    const store = createStore(
        rootReducer,
        initialState,
        compose(
            applyMiddleware(logger, thunkMiddleware),
            window.devToolsExtension ? window.devToolsExtension() : f => f //add support for Redux dev tools
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
