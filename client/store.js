/**
 * Redux setup
 * @author Patrick Kage
 */
import { createStore, applyMiddleware, compose } from "redux";
import { combineReducers } from "redux-immutable";
import { createLogger } from "redux-logger";
import thunkMiddleware from "redux-thunk";
import Immutable from "immutable";
import reducers from "./reducers";

const logger = createLogger();
const rootReducer = combineReducers(reducers);

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
	rootReducer,
	Immutable.Map({}),
	composeEnhancers(applyMiddleware(logger, thunkMiddleware))
);

export default store;
