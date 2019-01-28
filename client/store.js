/**
 * Redux setup
 * @author Patrick Kage
 */
import {
    createStore,
    applyMiddleware,
    compose
} from 'redux'
import {
    combineReducers
} from 'redux-immutable'
import { createLogger } from 'redux-logger'
import Immutable from 'immutable'
import reducers from './reducers'

const logger = createLogger()
const rootReducer = combineReducers(reducers)

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose

const store = createStore(
    rootReducer,
    Immutable.Map({}),
    composeEnhancers(
        applyMiddleware(logger)
    )
)

export default store
