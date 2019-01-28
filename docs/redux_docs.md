# CODEX Frontend Internal Data Models

## Purpose

The purpose of this document is to outline the data passing contracts for [CODEX]( https://github-fn.jpl.nasa.gov), as well as documenting the transition from the previous `controller.js` driven model to the [redux](https://redux.js.org) data model. 

## Rationale

As CODEX continues to grow and expand, it's important that strict limitations be placed on the kinds of operations the subcomponents can perform on the worked data. These limitations include guidelines for how the data reaches the component, how the component requests more data, what operations the component can perform on the data, and architectural enforcement mechanisms for these limitations. Without these limits, code complexity can spiral out of control: for example, if a component can directly edit the application state then an arbitrary bug inside the component can potentially invalidate the entire application state.

Additionally, it is vital that the mechanisms used for data passing and data operation enforcement are implemented in industry-standard ways. Not only does that make potential hiring easier as there is less spin-up involved as compared to a homebrewed system, it also reduces the bug surface of the application. If the data passing layer is built on a library, then we can take advantage of that library's unit tests as opposed to writing our own. This cuts down on the amount of boilerplate code we need to write, as well as profiting from bug fixes submitted by other users.

As a final note, moving all CODEX data operations to a central store will make it significantly easier to transition to a model where only part of the data is stored on the frontend.

## Data Structure and Operations

CODEX is ultimately a collection of smaller tools operating on one central data store. These tools fall neatly into one of two categories: graphs/reports, which simply ingest data and display it, and algorithm wizards, which ingest data and output selections. That makes outlining the allowed data operations very simple: if we model brushing rows as a data selection, then the only data operation that the tools perform is creating/managing selections. The underlying data can remain canonical, and everything can operate on selections. 

Here is the data store, adapted from the existing `Model.js` store:

```javascript
{ 
	"data": [
		["two", "dimensional", "array", "headers", ...],
		[1, 2, 3, 4, ...],
		[...]
	],
	"selected_features": [
		"feature",
		"feature 2",
		...
	],
	"selections": [
		{
			"name": "brush",
			"color": "#123456",
			"mask": [false, true, ...],
			"emphasize": false
		},
		{
			"name": "My awesome selection",
			"color": "#abcdef",
			"mask": [false, false, ...],
			"emphasize": true
		}
	]
}
```

Then, your data operations are simplified to:

Operation | Effect | Target
---  | --- | ---
`FILE_LOAD` | Loads a file from disk/other source, extracting features | _overhead_
`FEATURE_SELECT` | Marks a feature for ingestion into a tool | GUI
`FEATURE_UNSELECT` | Un-marks a feature | GUI
`SELECTION_CREATE` | Creates a selection based on some criteria | Wizard
`SELECTION_REORDER` | Re-order the list of selections | GUI
`SELECTION_RECOLOR` | Re-color the selection | GUI
`SELECTION_TOGGLE` | Toggle a selection | GUI
`SELECTION_REMOVE` | Removes a selection | GUI


## Data Contracts

### Overview

### Component Contracts

### Store Contracts

## Development

### Adding a new action

First, make sure you really need one. Ask yourself: Does this feature need to modify state in a way accessible from other components? If the answer is yes, then here's what you do:

1. Create a new action in `src/actions/[name]Types.js`. This should be something as simple as:
```javascript
// file: src/actions/[name]Types.js
export const ACTION_NAME = 'ACTION_NAME'
```
2. Next, create your action creator in `src/actions/[name].js`. This is a function that creates the action object from it's arguments. Crucially, it sets the `type` of the action object. For example:
```javascript
// file: src/actions/[name].js
import * as types from './[name]Types.js'

export const actionName = (arg1, arg2) => ({
	type: types.ACTION_NAME,
	arg1,
	arg2	
})
```
3. Add to the target reducer to `src/reducers/[name].js`, and register it to the `createReducer` call at the bottom. For example:
```javascript
// file: src/reducers/[name].js
import { createReducer } from 'redux-create-reducer'
import { ACTION_NAME } from '../actions/[name]Types.js'
import { Map } from 'immutable'

// initial state of store, exported for ease of testing
export const initialState = Map()

const actionName = (state, action) => {
	// handle your action and return the next state
}

// register with the data reducer
export default createReducer(initialState, {
	ACTION_NAME: actionName
})
```
4. Add tests for your new reducer in `src/reducers/[name].test.js`. This step is not optional.
```javascript
// file: src/reducers/[name].test.js
import * as actions from '../actions/[name].js'
import reducer, { initialState } from './[name].js'

describe('[name] store', () => {
	it('should test the initial state', () => {
		expect(reducer(undefined, {}).equals(initialState)).toBeTruthy()
	})
	
	// this one's yours!
	it('should handle ACTION_NAME', () => {
		const act = actions.actionName('a', 'b')

		const state = reducer(undefined, act)

		// perform whatever tests on the state you like here
		expect(state.get('foo')).toEqual('bar')
	})
})
```
5. If necessary, add selectors to `src/selectors/[name].js`. Selectors aid creating container elements, as they allow an easy way to control getting data out of stores. It's important to add a docstring, as this function may be imported across the application.
```javascript
// file: src/selectors/[name].js

/**
 * Select some data from the store
 * @param {Map} domain current store structure
 * @param {string} key data to select
 * @returns {string} foo data
 */
export const getSomeData = (domain, key) => {
	return domain.get('key')
}
```
6. As before, testing a selector is not optional. This test suite should live in `src/selectors/[name].test.js`. Here's an example:
```javascript
// file: src/selectors/[name].test.js

import * as actions from '../actions/[name].js'
import reducer from '../reducers/[name].js'
import * as sels from './[name].js'

describe('[name] selector tests', () => {
	// create a base state
	const base_state = reducer(undefined, {})

	it('should select some data', () => {
		// create a new state where we've done whatever setup necessary
		const act = actions.actionName('a', 'b')
		let state = reducer(base_state, act)

		let selected = sels.getSomeData('a')

		expect(selected).toEqual('b')
	})
})
```

That's it! It might seem like a lot, but 2/6 of those steps are testing (which you should be doing anyways), step 5 & 6 are optional, and step 1 is literally one line of code.

### Creating a new store

Before creating a new store, think if you really need one. Are you storing a new category of data, completely orthogonal to the current stores? If not, consider adding a new action on an existing store instead. If so though, read on.

To create a new store, you'll need to make it's root reducer. Thankfully, this is pretty easy as well. Here's what you do:

1. Create the reducer in `src/reducers/[name].js`. Pay attention to exporting the initial state, this will make testing easier. Ensure that you are using an immutable store, this will ensure both data integrity and efficient copying.
```javascript
// file: src/reducers/[name].js
import { createReducer } from 'redux-create-reducer'
import { ACTION_NAME } from '../actions/[name]Types.js'
import { Map } from 'immutable'

// initial state of store, exported for ease of testing
export const initialState = Map()

const actionName = (state, action) => {
	// handle your action and return the next state
}

// register with the data reducer
export default createReducer(initialState, {
	ACTION_NAME: actionName
})
```
2. Create the unit tests for this new store in `src/reducers/[name].test.js`. Again, testing is not optional. Test that it returns the expected initial state, plus whatever actions are in the store. See above "Adding an action" for testing actions
```javascript
// file: src/reducers/[name].test.js
import * as actions from '../actions/[name].js'
import reducer, { initialState } from './[name].js'

describe('[name] store', () => {
	it('should test the initial state', () => {
		expect(reducer(undefined, {}).equals(initialState)).toBeTruthy()
	})
})
```
3. Register your new store in the root store: `src/reducers/index.js`:
```javascript
// file: src/reducers/index.js
import data from './data'
import name from './[name].js'

export default {
	data,
	name
}
```
 
That's all you need to do! `src/store.js` should set up your stores for you, and then be patched into the root provider at `src/index.js`.

## Implementation Log

__TODO: Pull from orgmode__

The purpose of this section is to document the steps taken in implementing Redux on top of CODEX. This is, for the most part, a reformatting from the orgmode file I used while developing this project.

### Steps taken

Implementing Redux happened in three separate stages. First, the codebase was prepared:

1. Create `redux-integration` branch on the [CODEX](https://github-fn.jpl.nasa.gov) repository
2. Remove non-standard Javascript, aided by [depgraph](https://github.com/quadnix/depgraph)

Next, the Redux store was added onto the root of the project:

1. Add action types + dispatchers
2. Implement immutable redux store
3. Write base set of selectors

Finally, the existing singleton infrastructure was transitioned to use Redux's data system.

4. Expose a bandaid patch into singletons

  - [x] Branch creation
  - [x] Remove non-standard JS
      - [x] Straight conversion
      - [x] Investigate conversion failure
  - [x] Add redux/react-redux dependencies
  - [ ] Implement
      - [ ] controller.js
          - [ ] Use depgraph output to show all deps
              - [ ] List all dependencies (import here)
            - [ ] Check off one by one
        - [ ] Transition to store/reducer/actions
        - [ ] Create mock, switch mock with real import for usage analysis
        - [ ] Create presentational components
  - [ ] Handle 1000+ features in FeaturesList
  - [ ] Document differences in FeaturesList
  - [ ] Parcel


### Functionality Deviations

In this section, the difference in functionality between the original components is described.

#### FeaturesList
Panel on the side of the application that shows which features are contained in the dataset, and allows selection of components.

 - Not sortable
 - Filtration ignores "all", "on", "off" options
 - Statistics on right click removed
	 - Planned to move to its own window 

