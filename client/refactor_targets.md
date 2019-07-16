# Refactoring

 - Unit tests
 - Unclear where data is loaded from
    - graphActions.


 - Window system reconfig
    - Dispatch a component instead of 8 config files
 - Unit testing
    - Stores and reducers
 - Conventions

## Current Targets

### Window Simplification Campaign

This will be two-pronged. The first will be enabling the specific components themselves to set their own window properties (removing distinctions between component types, minimizing the complexity of the `windowContentFunctions.js`). The second half is smaller; simply refactoring `TopBar.js` to dispatch a `OPEN_NEW_WINDOW` event.

Relevant files for Part 1:

*relative to `src/`*

```

( creating windows )
components/WindowManager/WindowManager.js
components/WindowManager/windowContentFunctions.js
constants/windowSettings.js

( consolidating actions )
actions/algorithmActions.js
actions/classificationActions.js
actions/dimensionalityReductionActions.js
actions/graphActions.js
actions/regressionActions.js
actions/windowManagerActions.js
actions/workflowActions.js

( consolidating constants )
constants/algorithmTypes.js                 [apparently only handles clusters]
constants/classificationTypes.js
constants/dimensionalityReductionTypes.js
constants/*.js

```

New files for part 1:

*relative to `src/`*

```
components/WindowWrapper.js
```

Next steps:

### Radically simplify window dispatch

Currently, all windows are created separately. Here's what happens:

 - `TopBar.js`, based on the type of window, dispatches one of four actions from `actions/ui`:
    - `openAlgorithm` creates an `actionTypes.OPEN_ALGORITHM` object
    - `openReport` creates an `actionTypes.OPEN_REPORT` (unused?)
    - `openDevelopment` creates an `actionTypes.OPEN_DEVELOPMENT` (unused?)
    - `openWorkflow` creates an `actionTypes.OPEN_WORKFLOW` event
 - `TopBar.js` also dispatches an `graphActions.createGraph`

 __DITCH ALL OF THIS__.

Integration plan: _todo order_

    [x] Promote window state into windowStore
    [ ] Wire dispatchers directly to `OPEN_NEW_WINDOW`
    [x] Finish `DataHook.js` so we can remove `createGraph`
        [ ] `canBuildGraph` needs to be moved onto the graphs
        [ ] The graphs need to decide themselves if they can render--currently that logic is in `graphActions.canBuildGraph`
    [ ] `GraphWrapper` needs to be written to utilize `useDataHook` + `useWindowManager`

Eleven targets for updating to `useWindowManager`:

```
[x] Scatter
[x] Contour
[x] Time Series
[x] Heat Map
[x] Box Plot
[x] Violin Plot
[x] Histogram

[x] Cluster
[x] Classification
[x] Regression
[x] DimensionalityReduction

Explain This (will not port)
```
