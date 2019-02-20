import * as dataSels from "selectors/data";
import { formulas } from "formulas/formulas";
import { manager } from "Components/RWindowManager/manager/manager";
import Immutable from "immutable";

export default class UiReducer {
    /**
     * False Reducer
     * Adds a new graph window
     * @param {Map} state - current ui state
     * action.
     * @param {Map} dataState - current data state
     * @param {string} name - graph name and window title
     * ~@param {string} xaxis (default: 1st selected feature) - x feature name
     * ~@param {string} yaxis (default: 2nd selected feature) - y feature name
     * ~@param {string array} selections (default: selected selections) - selection names
     * ~@param {bool} randomFeatures (default: false) - whether to randomize x,y,subset (for testing)
     */
    //    static openGraph(state, action) {
    //        /*
    // if( !model.hasData() ) {
    //  this.setMessage( 'Please import data first. Files -> Import', 'warning' );
    //  return;
    // }
    // */

    //        //Get type
    //        const graphs = state.get("graphs").toJS();

    //        let type = graphs[0].type;
    //        const i = formulas.objectArrayIndexOfKeyWithValue(graphs, "name", action.name);
    //        if (i !== -1) type = graphs[i].type;

    //        const selectedFeatures = action.dataState
    //            .get("featureList")
    //            .filter(f => f.get("selected"))
    //            .map(f => f.get("name"))
    //            .toJS();

    //        if (selectedFeatures.length < 2) {
    //            alert("Not enough features selected. Please select 2 dimensions to graph.");
    //            return state;
    //        }

    //        if (selectedFeatures.length > 2) {
    //            alert(
    //                `Graphing only works on two features. You've selected ${
    //                    selectedFeatures.length
    //                } features (${selectedFeatures.join(", ")}), but only ${selectedFeatures[0]} and ${
    //                    selectedFeatures[1]
    //                } will be graphed.`
    //            );
    //        }

    //        let selectedXAxis = selectedFeatures[0];
    //        let selectedYAxis = selectedFeatures[1];

    //        if (action.randomFeatures) {
    //            let f = dataSels.getFeatures(action.dataState).toJS();

    //            selectedXAxis = f[formulas.getRandomInt(f.length - 1)];
    //            selectedYAxis = f[formulas.getRandomInt(f.length - 1)];
    //        }

    //        if (selectedXAxis === undefined || selectedYAxis === undefined) {
    //            //this.setMessage( 'Please select at least 2 features on the left before making a graph.', 'warning' );
    //            return;
    //        }

    //        const activeSelectionNames = action.dataState
    //            .get("featureList")
    //            .filter(f => f.get("selected"))
    //            .map(f => f.get("name"))
    //            .toJS();

    //        var config = {
    //            title: (action.xaxis || selectedXAxis) + " vs. " + (action.yaxis || selectedYAxis),
    //            type: type,
    //            name: action.name,
    //            component: "GraphWork",
    //            props: {
    //                type: type,
    //                subsets: action.selections || activeSelectionNames,
    //                xaxis: action.xaxis || selectedXAxis,
    //                yaxis: action.yaxis || selectedYAxis
    //            }
    //        };

    //        manager.addWindow(config);

    //        //Letting manager control all window state
    //        return state;
    //    }

    /**
     * False Reducer
     * Adds a new algorithm window
     * @param {Map} state - current ui state
     * action.
     * @param {Map} dataState - current data state
     * @param {string} name - algorithm name
     * ~@param {int | string} width - in px or % (like "50%")
     * ~@param {int | string} height - in px or %
     */

    // static openAlgorithm(state, action) {
    //     /*
    // if( !model.hasData() ) {
    //     this.setMessage( 'Please import data first. Files -> Import', 'warning' );
    //     return;
    // }
    // */
    //     /*
    // let xysubset = this.getChosenXYSubset();
    // if( BANDAID_PATCH_STORE.getState().getIn(['data', 'selected_features']).size < 1) {
    // //type === 'algorithms' && ( xysubset.x === null || xysubset.y === null ) ) {
    //     this.setMessage( 'Please select at least 2 features on the left before using ' + type + '.', 'warning' );
    //     return;
    // }
    // */

    //     const algorithms = state.get("algorithms").toJS();

    //     //Get component
    //     let algorithmComponent;
    //     const i = formulas.objectArrayIndexOfKeyWithValue(algorithms, "name", action.name);
    //     if (i !== -1) algorithmComponent = algorithms[i].component;

    //     //Construct manager config
    //     const config = {
    //         title: action.name,
    //         type: "",
    //         name: action.name,
    //         initialWidth: action.width || 1000,
    //         initialHeight: action.height || 600,
    //         component: "AlgorithmSpace",
    //         props: {
    //             algorithmComponent: algorithmComponent
    //         }
    //     };

    //     //Add a new window from that config
    //     manager.addWindow(config);

    //     //Letting manager control all window state
    //     return state;
    // }

    /**
     * False Reducer
     * Adds a new report window
     * @param {Map} state - current ui state
     * action.
     * @param {Map} dataState - current data state
     * @param {string} name - report name
     * ~@param {int | string} width - in px or % (like "50%")
     * ~@param {int | string} height - in px or %
     */
    static openReport(state, action) {
        /*
    if( !model.hasData() ) {
        this.setMessage( 'Please import data first. Files -> Import', 'warning' );
        return;
    }
    */
        /*
    let xysubset = this.getChosenXYSubset();
    if( BANDAID_PATCH_STORE.getState().getIn(['data', 'selected_features']).size < 1) {
    //type === 'algorithms' && ( xysubset.x === null || xysubset.y === null ) ) {
        this.setMessage( 'Please select at least 2 features on the left before using ' + type + '.', 'warning' );
        return;
    }
    */

        const reports = state.get("reports").toJS();

        //Get report
        let report = {};
        const i = formulas.objectArrayIndexOfKeyWithValue(reports, "name", action.name);
        if (i !== -1) report = reports[i];

        //Construct manager config
        const config = {
            title: action.name,
            type: "",
            name: action.name,
            initialWidth: action.width || report.width || 1000,
            initialHeight: action.height || report.height || 600,
            component: "AlgorithmSpace",
            props: {
                algorithmComponent: report.component
            }
        };

        //Add a new window from that config
        manager.addWindow(config);

        //Letting manager control all window state
        return state;
    }

    /**
     * False Reducer
     * Performs whatever development function
     * @param {Map} state - current ui state
     * action.
     * @param {Map} dataState - current data state
     * @param {string} name - development method name
     */
    static openDevelopment(state, action) {
        switch (action.name.toLowerCase()) {
            case "nrandomscatters":
                let r = 8; //formulas.getRandomInt( 8 ) + 4;
                for (let i = 0; i < r; i++) {
                    UiReducer.openGraph(state, {
                        dataState: action.dataState,
                        name: "Scatter",
                        randomFeatures: true
                    });
                }
                break;
            case "sparklinerange":
                manager.addWindow({
                    title: "Sparkline debug",
                    type: "",
                    name: "debug",
                    component: "SparklineRange",
                    props: {}
                });
                break;
            default:
                console.warn("Warning - Unknown dev method: " + action.name);
        }

        //Letting manager control all window state
        return state;
    }

    /**
     * Handle a BRUSHTYPE_SET
     * @param {Map} state current state
     * @param {object} action action
     *              action.brushtype = 'rectangle', 'freehand'
     * @return {Map} new state
     */
    static brushtypeSet(state, action) {
        // only set if it's a valid brushtype
        switch (action.brushtype) {
            case "rectangle":
            case "freehand":
                return state.setIn(["brush", "type"], action.brushtype);
            default:
                return state;
        }
    }

    /**
     * Handle a BRUSHID_SET
     * @param {Map} state current state
     * @param {object} action action
     *              action.id - int
     * @return {Map} new state
     */
    static brushIdSet(state, action) {
        if (typeof action.id === "number") return state.setIn(["brush", "id"], action.id);
        else return state;
    }

    /**
     * Handle a MODE_SET
     * @param {Map} state current state
     * @param {object} action action
     *              action.mode = 'zoom', 'select', 'snap'
     * @return {Map} new state
     */
    static modeSet(state, action) {
        if (action.mode === "zoom" || action.mode === "select" || action.mode === "snap")
            return state.set("mode", action.mode);
        else return state;
    }

    /**
     * Pushes a new entry to our history
     * @param {Map} state current state
     * @param {object} action
     *              {string} .type
     *              {string} .status - 'success', 'warning', 'error', 'note'
     *              {string} .description
     * @return {Map} new state
     */
    static addToHistory(state, action) {
        return state.update("history", history =>
            history.push(
                Immutable.fromJS({
                    status: action.status,
                    type: action.type,
                    description: action.description
                })
            )
        );
    }
}
