import { model } from "../Model/model.js";
import { config } from "../config.old";
import { formulas } from "../formulas/formulas";
import { manager } from "../Components/RWindowManager/manager/manager";

import Blank from "../Components/Blank";

import { BANDAID_PATCH_STORE } from "../../index";
import { getSelectedFeatures } from "../../selectors/data";

export default class Controller {
    constructor() {
        this.vars = {
            dragData: {},
            nameSubstart: 0,
            panelOpen: true,
            chosenFeatures: [],
            chosenSelections: [],
            lastChosenFeature: null,
            lastChosenSelection: null,
            selectionsColorPalette: [
                "#7733e6",
                "#e63380",
                "#98e633",
                "#33e6c5",
                "#333be6",
                "#e63333",
                "#380f7b",
                "#7b0f3e",
                "#4c7b0f",
                "#0f7b67",
                "#0f157b",
                "#7b0f0f"
            ],
            graphs: config.config.graphs,
            algorithms: config.config.algorithms,
            reports: config.config.reports,
            groups: config.config.groups,
            linkPosition: [0, 0],
            topBarMode: "select",
            lastBrushType: "freehand",
            nextID: 0
        };
        //Eventually turn all the add listener functions into one
        this.listeners = {
            chosenFeaturesUpdate: [],
            chosenFeaturesUpdateMiddleWare: [],
            chosenSelectionsUpdate: [],
            chosenSelectionsUpdateMiddleWare: [],
            nameSubstartUpdate: [],
            allFeaturesToggle: null,
            panelOpenUpdate: [],
            setAlgorithm: null,
            graphChange: [],
            graphLinkChange: [],
            graphStyleChange: []
        };

        this.genericGraphs = {};

        this.manager = manager;
        this.manager.onRemoveWindow = id => {
            this.removeAllListenersWithId(id);
            model.removeAllListenersWithId(id);
        };

        document.addEventListener("keydown", this.globalKeyDown.bind(this), false);
    }

    globalKeyDown(e) {
        var keyCode = e.keyCode;
        switch (keyCode) {
            case 27: //escape
                this.clearAllChosenFeatures();
                this.clearAllChosenSelections();
                break;
            default:
                break;
        }
    }

    //PANEL
    setPanel(open) {
        this.vars.panelOpen = open;
        this.callAllPanelOpenUpdate();
    }
    getPanelOpen() {
        return this.vars.panelOpen;
    }
    addPanelOpenListener(listenerId, listenerFunction) {
        this.listeners.panelOpenUpdate.push({ id: listenerId, call: listenerFunction });
    }
    callAllPanelOpenUpdate() {
        for (let l in this.listeners.panelOpenUpdate) {
            this.listeners.panelOpenUpdate[l].call();
        }
    }

    removeAllListenersWithId(id) {
        for (let l in this.listeners) {
            if (this.listeners[l] && this.listeners[l].length > 0) {
                for (let i = this.listeners[l].length - 1; i > 0; i--) {
                    if (this.listeners[l][i] && this.listeners[l][i].id === id) {
                        this.listeners[l].splice(i, 1);
                    }
                }
            }
        }
    }

    removeListener(name, matchKey, matchValue) {
        if (this.listeners[name]) {
            for (let i = this.listeners[name].length - 1; i >= 0; i--) {
                if (this.listeners[name][i][matchKey] === matchValue) {
                    this.listeners[name].splice(i, 1);
                }
            }
        }
    }

    getAnID() {
        return this.vars.nextID++;
    }

    //CHOSEN FEATURES
    subscribeChosenFeaturesUpdate(chosenFeaturesUpdateFunction, id) {
        if (id !== undefined) id = id.toString();
        this.listeners.chosenFeaturesUpdate.push({
            id: id || "",
            call: chosenFeaturesUpdateFunction
        });
    }
    unsubscribeChosenFeaturesUpdate(chosenFeaturesUpdateFunction, id) {
        if (id !== undefined) id = id.toString();
        for (let i = this.listeners.chosenFeaturesUpdate.length - 1; i >= 0; i--) {
            if (
                this.listeners.chosenFeaturesUpdate[i] &&
                this.listeners.chosenFeaturesUpdate[i].id === id
            ) {
                delete this.listeners.chosenFeaturesUpdate[i];
            }
        }
    }
    subscribeChosenFeaturesUpdateMiddleWare(
        chosenFeaturesUpdateMiddleWareFunction,
        id,
        idsToIntercept
    ) {
        this.listeners.chosenFeaturesUpdateMiddleWare.push({
            id: id,
            middleware: chosenFeaturesUpdateMiddleWareFunction,
            for: idsToIntercept
        });
    }
    unsubscribeChosenFeaturesMiddleWareUpdate(chosenFeaturesUpdateFunction, id) {
        for (let i = this.listeners.chosenFeaturesUpdateMiddleWare.length - 1; i >= 0; i--) {
            if (
                this.listeners.chosenFeaturesUpdateMiddleWare[i] &&
                this.listeners.chosenFeaturesUpdateMiddleWare[i].id === id
            ) {
                delete this.listeners.chosenFeaturesUpdateMiddleWare[i];
            }
        }
    }
    getMiddleware(id, type = "feature") {
        for (let i = 0; i < this.listeners.chosenFeaturesUpdateMiddleWare.length; i++) {
            if (this.listeners.chosenFeaturesUpdateMiddleWare[i].for.includes(id)) {
                return this.listeners.chosenFeaturesUpdateMiddleWare[i].middleware;
            }
        }
        return false;
    }
    callAllChosenFeaturesUpdate() {
        let clearCallbacks = true;
        for (let l in this.listeners.chosenFeaturesUpdate) {
            let possibleMiddleware = this.getMiddleware(this.listeners.chosenFeaturesUpdate[l].id);
            if (typeof possibleMiddleware === "function") {
                possibleMiddleware(
                    () => this.listeners.chosenFeaturesUpdate[l].call(),
                    clearCallbacks
                );
                clearCallbacks = false;
            } else this.listeners.chosenFeaturesUpdate[l].call();
        }
    }
    addChosenFeature(feature, type, parts) {
        if (
            typeof feature === "string" &&
            feature.length > 0 &&
            formulas.objectArrayIndexOfKeyWithValue(
                this.vars.chosenFeatures,
                "feature",
                feature
            ) === -1
        ) {
            this.vars.chosenFeatures.push({ feature: feature, type: type, parts: parts });
            this.vars.lastChosenFeature = feature;
            this.setChosenFeatures();
        }
    }
    setChosenFeatures(chosenFeatures) {
        if (!chosenFeatures) chosenFeatures = this.vars.chosenFeatures;
        //remove all undefineds
        chosenFeatures = chosenFeatures.filter(function(f) {
            return f !== undefined;
        });
        //order based on model featuresCustomOrders order
        let orderedChosenFeatures = [];
        let customOrder = model.getFeaturesCustomOrder();
        for (let co in customOrder) {
            for (let c in chosenFeatures) {
                if (customOrder[co].name === chosenFeatures[c].feature) {
                    orderedChosenFeatures.push(chosenFeatures[c]);
                }
            }
        }

        this.vars.chosenFeatures = orderedChosenFeatures;
        this.callAllChosenFeaturesUpdate();
    }
    getChosenFeatures(type) {
        if (type === "column" || type === "subset") {
            let result = [];
            for (let i = 0; i < this.vars.chosenFeatures.length; i++) {
                if (this.vars.chosenFeatures[i].type === type)
                    result.push(this.vars.chosenFeatures[i].feature);
            }
            return result;
        } else return this.vars.chosenFeatures;
    }
    removeChosenFeature(feature) {
        //Get index with feature
        let index = formulas.objectArrayIndexOfKeyWithValue(
            this.vars.chosenFeatures,
            "feature",
            feature
        );

        if (index !== -1) {
            this.vars.chosenFeatures.splice(index, 1);
            this.callAllChosenFeaturesUpdate();
        }
    }
    toggleChosenFeature(feature, forceTo, isShift) {
        let index = formulas.objectArrayIndexOfKeyWithValue(
            this.vars.chosenFeatures,
            "feature",
            feature
        );

        if (index === -1 && isShift && this.vars.lastChosenFeature !== null) {
            let f = model.getFeaturesCustomOrder();
            let i1 = f.findIndex(a => a.name === feature);
            let i2 = f.findIndex(a => a.name === this.vars.lastChosenFeature);
            let indicesBetween = formulas.getIntsBetween(i1, i2);

            for (let i = 0; i < indicesBetween.length; i++)
                this.toggleChosenFeature(f[indicesBetween[i]].name, "on", false);
        }

        if (index !== -1 && forceTo !== "on") {
            this.vars.chosenFeatures.splice(index, 1);
            this.callAllChosenFeaturesUpdate();
        } else if (forceTo !== "off") this.addChosenFeature(feature, "column");
    }

    clearAllChosenFeatures() {
        this.vars.chosenFeatures = [];
        this.callAllChosenFeaturesUpdate();
    }
    clearAllChosenSelections() {
        this.vars.chosenSelections = [];
        this.callAllChosenSelectionsUpdate();
        this.graphChanged();
    }

    //CHOSEN SELECTIONS
    subscribeChosenSelectionsUpdate(chosenSelectionsUpdateFunction, id) {
        this.listeners.chosenSelectionsUpdate.push({
            id: id || "",
            call: chosenSelectionsUpdateFunction
        });
    }
    unsubscribeChosenSelectionsUpdate(chosenSelectionsUpdateFunction, id) {
        for (let i = this.listeners.chosenSelectionsUpdate.length - 1; i >= 0; i--) {
            if (
                this.listeners.chosenSelectionsUpdate[i] &&
                this.listeners.chosenSelectionsUpdate[i].id === id
            ) {
                delete this.listeners.chosenSelectionsUpdate[i];
            }
        }
    }
    subscribeChosenSelectionsUpdateMiddleWare(
        chosenSelectionsUpdateMiddleWareFunction,
        id,
        idsToIntercept
    ) {
        this.listeners.chosenSelectionsUpdateMiddleWare.push({
            id: id,
            middleware: chosenSelectionsUpdateMiddleWareFunction,
            for: idsToIntercept
        });
    }
    unsubscribeChosenSelectionsMiddleWareUpdate(chosenSelectionsUpdateFunction, id) {
        for (let i = this.listeners.chosenSelectionsUpdateMiddleWare.length - 1; i >= 0; i--) {
            if (
                this.listeners.chosenSelectionsUpdateMiddleWare[i] &&
                this.listeners.chosenSelectionsUpdateMiddleWare[i].id === id
            ) {
                delete this.listeners.chosenSelectionsUpdateMiddleWare[i];
            }
        }
    }
    getSelectionsMiddleware(id) {
        for (let i = 0; i < this.listeners.chosenSelectionsUpdateMiddleWare.length; i++) {
            if (this.listeners.chosenSelectionsUpdateMiddleWare[i].for.includes(id)) {
                return this.listeners.chosenSelectionsUpdateMiddleWare[i].middleware;
            }
        }
        return false;
    }
    callAllChosenSelectionsUpdate() {
        let clearCallbacks = true;
        for (let l in this.listeners.chosenSelectionsUpdate) {
            let possibleMiddleware = this.getSelectionsMiddleware(
                this.listeners.chosenSelectionsUpdate[l].id
            );
            if (typeof possibleMiddleware === "function") {
                possibleMiddleware(
                    () => this.listeners.chosenSelectionsUpdate[l].call(),
                    clearCallbacks
                );
                clearCallbacks = false;
            } else this.listeners.chosenSelectionsUpdate[l].call();
        }
    }
    addChosenSelection(selection, type, color, parts) {
        if (
            typeof selection === "string" &&
            selection.length > 0 &&
            formulas.objectArrayIndexOfKeyWithValue(
                this.vars.chosenSelections,
                "selection",
                selection
            ) === -1
        ) {
            this.vars.chosenSelections.push({
                selection: selection,
                type: type,
                color: color,
                parts: parts
            });
            this.vars.lastChosenSelection = selection;
            this.callAllChosenSelectionsUpdate();
        }
    }
    setChosenSelections(chosenSelections) {
        if (!chosenSelections) chosenSelections = this.vars.chosenSelections;
        //remove all undefineds
        chosenSelections = chosenSelections.filter(function(f) {
            return f !== undefined;
        });
        //order based on model selectionsCustomOrders order
        let orderedChosenSelections = [];

        let customOrder = model.getSelectionsCustomOrder();
        for (let co in customOrder) {
            for (let c in chosenSelections) {
                if (customOrder[co].selection === chosenSelections[c].selection) {
                    orderedChosenSelections.push(chosenSelections[c]);
                }
            }
        }
        // model.setSelectionsCustomOrder( orderedChosenSelections );

        this.vars.chosenSelections = orderedChosenSelections;
        this.callAllChosenSelectionsUpdate();
    }
    getChosenSelections(type) {
        if (type === "column" || type === "subset") {
            let result = [];
            for (let i = 0; i < this.vars.chosenSelections.length; i++) {
                if (this.vars.chosenSelections[i].type === type)
                    result.push(this.vars.chosenSelections[i].selection);
            }
            return result;
        } else return this.vars.chosenSelections;
    }
    removeChosenSelection(selection) {
        //Get index with selection
        let index = formulas.objectArrayIndexOfKeyWithValue(
            this.vars.chosenSelections,
            "selection",
            selection
        );
        if (index !== -1) {
            this.vars.chosenSelections.splice(index, 1);
            this.callAllChosenSelectionsUpdate();
        }
    }
    toggleChosenSelection(selection, color, forceTo, isShift, stopRefresh) {
        let index = formulas.objectArrayIndexOfKeyWithValue(
            this.vars.chosenSelections,
            "selection",
            selection
        );

        if (index === -1 && isShift && this.vars.lastChosenSelection !== null) {
            let s = model.getSelectionsCustomOrder();
            let i1 = s.findIndex(a => a.selection === selection);
            let i2 = s.findIndex(a => a.selection === this.vars.lastChosenSelection);
            let indicesBetween = formulas.getIntsBetween(i1, i2);

            for (let i = 0; i < indicesBetween.length; i++)
                this.toggleChosenSelection(
                    s[indicesBetween[i]].selection,
                    s[indicesBetween[i]].color,
                    "on",
                    false,
                    true
                );
        }

        if (index !== -1 && forceTo !== "on") {
            this.vars.chosenSelections.splice(index, 1);
            this.callAllChosenSelectionsUpdate();
        } else if (forceTo !== "off") this.addChosenSelection(selection, "selection", color);

        if (stopRefresh !== true) this.graphChanged();
    }

    setSelectionsColorPalette(selection, i, hex) {
        let selI = formulas.objectArrayIndexOfKeyWithValue(
            this.vars.chosenSelections,
            "selection",
            selection
        );
        //Max sure both pass
        if (selI !== -1 && model.setSelectionCustomOrderColor(selection, hex))
            this.vars.chosenSelections[selI].color = hex;
        else console.warn("WARNING - failed to update selection color.");
    }
    //returns true if renamed, false if not (error such as duplicate name)
    renameSelection(currentName, newName) {
        if (currentName === newName) return true;

        if (model.renameSelection(currentName, newName)) {
            for (let s = 0; s < this.vars.chosenSelections.length; s++) {
                if (this.vars.chosenSelections[s].selection === currentName) {
                    this.vars.chosenSelections[s].selection = newName;
                    return true;
                }
            }
        }
        return false;
    }

    subscribeAllFeaturesToggle(allFeaturesToggleFunction) {
        this.listeners.allFeaturesToggle = allFeaturesToggleFunction;
    }
    toggleAllFeatures() {
        this.listeners.allFeaturesToggle();
    }
    setDragData(dragData) {
        this.vars.dragData = dragData;
    }
    getDragData() {
        return this.vars.dragData;
    }
    releaseDragData() {
        this.vars.dragData = {};
    }

    setDrawers(to) {
        for (let i in this.genericGraphs) {
            if (this.genericGraphs[i].setDrawer) this.genericGraphs[i].setDrawer(to);
        }
        if (to === "rectangle" || to === "freehand") this.vars.lastBrushType = to;
    }
    setTopBarMode(to, brushType) {
        if (to === "zoom") {
            if (this.vars.topBarMode === "snap") this.manager.toggleAllWindowSnapPorts(false);
            this.setDrawers("clearshape");
            this.setDrawers("off");
        } else if (to === "select") {
            if (this.vars.topBarMode === "snap") this.manager.toggleAllWindowSnapPorts(false);
            if (this.vars.topBarMode !== "select") {
                this.setDrawers("on");
                this.setDrawers(brushType);
            }
        } else if (to === "snap") {
            if (this.vars.topBarMode === "refreshing") {
                this.manager.toggleAllWindowSnapPorts(false);
                this.manager.toggleAllWindowSnapPorts(true);
            } else if (this.vars.topBarMode !== "snap") this.manager.toggleAllWindowSnapPorts(true);
            this.setDrawers("clearshape");
            this.setDrawers("completelyoff");
        }

        this.vars.topBarMode = to;
    }
    refreshTopBarMode() {
        let newTopMode = this.vars.topBarMode;
        this.vars.topBarMode = "refreshing"; //It's very refreshing
        this.setTopBarMode(newTopMode, this.vars.lastBrushType);
    }

    addGenericGraph(id, it) {
        this.genericGraphs[id] = it;
    }
    removeGenericGraph(id) {
        this.removeListener("graphChange", "id", id);
        this.removeListener("graphLinkChange", "id", id);
        this.removeListener("graphStyleChange", "id", id);

        delete this.genericGraphs[id];
    }

    setMessage(message, status) {
        if (this.setMessageText) this.setMessageText(message, status);
    }
    toggleIndeterminateLoadingBar(on, message) {
        if (this.toggleIndeterminateLoading) this.toggleIndeterminateLoading(on, message);
    }

    addNewGraph(name, xaxis, yaxis, subsets, randomFeatures) {
        /*
        if( !model.hasData() ) {
            this.setMessage( 'Please import data first. Files -> Import', 'warning' );
            return;
        }
        */

        //Get type
        let type = this.vars.graphs[0].type;
        let i = formulas.objectArrayIndexOfKeyWithValue(this.vars.graphs, "name", name);
        if (i !== -1) type = this.vars.graphs[i].type;

        let xysubset = this.getChosenXYSubset();
        console.log(xysubset);

        if (randomFeatures) {
            let f = model.getFeaturesCustomOrder();
            console.log(f);
            xysubset.x = f[formulas.getRandomInt(f.length - 1)].name;
            xysubset.y = f[formulas.getRandomInt(f.length - 1)].name;
        }

        if (xysubset.x === undefined || xysubset.y === undefined) {
            this.setMessage(
                "Please select at least 2 features on the left before making a graph.",
                "warning"
            );
            return;
        }

        var config = {
            title: (xaxis || xysubset.x) + " vs. " + (yaxis || xysubset.y),
            type: type,
            name: name,
            component: "GraphWork",
            props: {
                type: type,
                subsets: subsets || xysubset.subsets,
                xaxis: xaxis || xysubset.x,
                yaxis: yaxis || xysubset.y
            }
        };
        console.log(config);

        manager.addWindow(config);
    }
    addGraphListener(listenerId, listenerFunction) {
        this.listeners["graphChange"].push({ id: listenerId, call: listenerFunction });
    }
    addGraphReceiveListener(listenerId, listenerFunction) {
        for (let i = 0; i < this.listeners["graphChange"].length; i++) {
            if (
                this.listeners["graphChange"][i].id != null &&
                this.listeners["graphChange"][i].id === listenerId
            ) {
                this.listeners["graphChange"][i].receive = listenerFunction;
            }
        }
    }
    addGraphLinkListener(listenerId, listenerFunction) {
        for (let i = 0; i < this.listeners["graphLinkChange"].length; i++) {
            if (
                this.listeners["graphLinkChange"][i].id != null &&
                this.listeners["graphLinkChange"][i].id !== listenerId
            ) {
                this.listeners["graphLinkChange"][i].id = listenerId;
                this.listeners["graphLinkChange"][i].call = listenerFunction;
            }
        }
    }
    addGraphStyleListener(listenerId, listenerFunction) {
        this.listeners["graphStyleChange"].push({ id: listenerId, call: listenerFunction });
    }

    getGraphs() {
        return this.vars.graphs;
    }
    getAlgorithm(algo) {
        let i = formulas.objectArrayIndexOfKeyWithValue(this.vars.algorithms, "name", algo);
        if (i !== -1) {
            return this.vars.algorithms[i];
        }
        return [];
    }
    getAlgoSubalgo(algo, subalgo) {
        let algorithm = this.getAlgorithm(algo);
        let i = formulas.objectArrayIndexOfKeyWithValue(
            algorithm.subalgorithms,
            "simplename",
            subalgo
        );
        if (i !== -1) return algorithm.subalgorithms[i];
        return [];
    }
    getGraphByType(type) {
        let i = formulas.objectArrayIndexOfKeyWithValue(this.vars.graphs, "type", type);
        if (i !== -1) return this.vars.graphs[i];
        return {};
    }
    graphChanged(id) {
        for (let i = 0; i < this.listeners["graphChange"].length; i++) {
            if (
                (id === undefined ||
                    (this.listeners["graphChange"][i].id !== null &&
                        this.listeners["graphChange"][i].id === id)) &&
                this.listeners["graphChange"][i].receive
            )
                this.listeners["graphChange"][i].receive(this.listeners["graphChange"][i].call());
        }
    }
    graphLinkChanged() {
        for (let i = 0; i < this.listeners["graphLinkChange"].length; i++) {
            this.listeners["graphLinkChange"][i].call();
        }
    }
    setLinkPosition(x, y) {
        this.vars.linkPosition = [x, y];
        this.graphLinkChanged();
    }
    getLinkPosition() {
        return this.vars.linkPosition;
    }

    emphasizeSelection(selectionName) {
        for (let i = 0; i < this.listeners["graphStyleChange"].length; i++) {
            this.listeners["graphStyleChange"][i].call(selectionName, { symbolSize: 3 });
        }
    }
    deEmphasizeSelection(selectionName) {
        for (let i = 0; i < this.listeners["graphStyleChange"].length; i++) {
            this.listeners["graphStyleChange"][i].call(selectionName, { symbolSize: 1 });
        }
    }

    //First column is x, second column is y and first subset is subset
    getChosenXYSubset() {
        let xysubset = {
            x: null,
            y: null,
            subsets: null
        };

        const selectedFeatures = BANDAID_PATCH_STORE.getState()
            .getIn(["data", "selected_features"])
            .toJS();
        xysubset.x = selectedFeatures[0];
        xysubset.y = selectedFeatures[1];

        /*
        for( let i in this.vars.chosenFeatures ) {
            if( !xysubset.x && this.vars.chosenFeatures[i].type === 'column' )
                xysubset.x = this.vars.chosenFeatures[i].feature;
            else if( xysubset.x && !xysubset.y && this.vars.chosenFeatures[i].type === 'column' )
                xysubset.y = this.vars.chosenFeatures[i].feature;
            else if( !xysubset.subset && this.vars.chosenFeatures[i].type === 'subset' )
                xysubset.subset = this.vars.chosenFeatures[i].feature;
        }
        */
        xysubset.subsets = this.vars.chosenSelections; // model.getSelectionsCustomOrder();

        return xysubset;
    }

    getGroups() {
        return this.vars.groups;
    }

    subscribeSetAlgorithm(setAlgorithmFunction) {
        this.listeners.setAlgorithm = setAlgorithmFunction;
    }
    openAlgorithm(name, type) {
        console.log(BANDAID_PATCH_STORE);
        let initialWidth = 1000;
        let initialHeight = 600;
        /*
        if( !model.hasData() ) {
            this.setMessage( 'Please import data first. Files -> Import', 'warning' );
            return;
        }
        */
        let xysubset = this.getChosenXYSubset();
        if (BANDAID_PATCH_STORE.getState().getIn(["data", "selected_features"]).size < 1) {
            //type === 'algorithms' && ( xysubset.x === null || xysubset.y === null ) ) {
            this.setMessage(
                "Please select at least 2 features on the left before using " + type + ".",
                "warning"
            );
            return;
        }

        if (type === "reports") {
            initialWidth = "100%";
            initialHeight = "100%";
        }

        //Get component
        let algorithmComponent = Blank;
        let i = formulas.objectArrayIndexOfKeyWithValue(this.vars[type], "name", name);
        if (i !== -1) {
            algorithmComponent = this.vars[type][i].component;

            var config = {
                title: name,
                type: "",
                name: "hi",
                initialWidth: initialWidth,
                initialHeight: initialHeight,
                component: "AlgorithmSpace",
                props: {
                    algorithmComponent: algorithmComponent
                }
            };

            controller.manager.addWindow(config);

            //this.listeners.setAlgorithm( name, component );
        }
    }

    setNameSubstart(substart) {
        this.vars.nameSubstart = substart;
        this.callAllNameSubstartUpdate();
    }
    getNameSubstart() {
        return this.vars.nameSubstart;
    }
    addNameSubstartListener(listenerId, listenerFunction) {
        this.listeners.nameSubstartUpdate.push({ id: listenerId, call: listenerFunction });
    }
    callAllNameSubstartUpdate() {
        for (let l in this.listeners.nameSubstartUpdate) {
            this.listeners.nameSubstartUpdate[l].call();
        }
    }

    subscribesSetLoadingPercent(f) {
        this.setLoadingPercent = f;
    }

    dev(methodName) {
        switch (methodName.toLowerCase()) {
            case "nrandomscatters":
                let r = 8; //formulas.getRandomInt( 8 ) + 4;
                for (let i = 0; i < r; i++) {
                    this.addNewGraph("Scatter", undefined, undefined, undefined, true);
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
                console.warn("Warning - Unknown dev method: " + methodName);
        }
    }
}

export let controller = new Controller();
