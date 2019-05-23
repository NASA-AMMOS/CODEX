/**
 * Redux setup
 * @author Patrick Kage
 */
import { createLogger } from "redux-logger";
import { createStore, applyMiddleware, compose } from "redux";
import thunkMiddleware from "redux-thunk";

import rootReducer from "reducers";

export default function configureStore(initialState) {
    const logger = createLogger();

    const store = createStore(
        rootReducer,
        initialState,
        compose(
            applyMiddleware(thunkMiddleware),
            window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
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
