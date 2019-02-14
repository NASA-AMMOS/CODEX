import React, { Component } from "react";
import "algorithms/Regression/DimensionalityReduction.css";

import { controller } from "../../Controller/controller";
import { formulas } from "../../formulas/formulas";
import { invocation } from "../../invocation/invocation";
import SubAlgorithms from "./SubAlgorithms/SubAlgorithms";
import AlgorithmContainer from "./AlgorithmContainer/AlgorithmContainer";
import HelpTriggerableName from "../../Components/HelpTriggerableName/HelpTriggerableName";
import Help from "./Help/Help";

import { MdClose, MdArrowForward, MdArrowBack } from "react-icons/lib/md";
import { manager } from "../../Components/RWindowManager/manager/manager";

import PropTypes from "prop-types";
import IPropTypes from "react-immutable-proptypes";
import { List } from "immutable";
// redux!
import { connect } from "react-redux";
import {
    getFilename,
    getSelectedFeatures,
    getActiveSelectionNames,
    getSelectionNamesByMeta
} from "selectors/data";
import { featureAdd, selectionCreate } from "actions/data";

class DimensionalityReduction extends Component {
    constructor(props) {
        super(props);
        //Two modal can sit atop the cluster modal: subalgorithms and help
        this.state = {
            selectingSubAlgorithms: true,
            selectedSubAlgorithm: "None",
            helpOpen: false,
            loading: true
        };

        let filename = getFilename(this.props.data);
        let dataFeatures = getSelectedFeatures(this.props.data).toJS();
        let dataSelections = getActiveSelectionNames(this.props.data).toJS();
        /*
    //Get the currently chosen features to update the call
    let dataFeatures = [];
    let chosenFeatures = controller.getChosenFeatures();
    for( let i in chosenFeatures ) {
      dataFeatures.push( chosenFeatures[i].feature );
    }
    //Get the currently chosen selections to update the call
    let dataSelections = [];
    let chosenSelections = controller.getChosenSelections();
    for( let i in chosenSelections ) {
      dataSelections.push( chosenSelections[i].selection );
    }
    */

        this.vars = {
            //THE MAIN CALL
            // holds all possible parameter keys
            // only the pertinent ones will be updated before a call
            call: {
                routine: "algorithm",
                algorithmType: "regression",
                algorithmName: "linear",
                dataFeatures: dataFeatures || [],
                dataSelections: dataSelections || [],
                file: filename,
                guidance: null,
                identification: {
                    id: "dev0"
                },
                parameters: {
                    n_estimators: 25,
                    test_size: 0.9,
                    alpha: 1,
                    max_iter: 100,
                    tol: 0.5,
                    fit_intercept: true,
                    downsampled: 10
                }
            },
            estimatedRunTime: 0,
            currentRunTime: 0,
            isExtraTime: false,
            runTimeInterval: null,
            finalName: "",
            nameString: "",
            outputPCA: true,
            outputFeature: true,
            outputSelections: true,
            outputGraph: {},
            guidancePath: "",
            guidanceMarkdown: "",
            callIsRunning: false,
            refreshTime: 5,
            refreshCountdownInterval: null,
            refreshCountdownTimeout: null,
            refreshCountdownStart: 0,
            refreshCountdown: 0,
            refreshCountdownCallbacks: [],
            forceContinue: false
        };

        this.listeners = {
            overallPreviewUpdate: null
        };

        this.ref = {};
        this.ref_steps = [];

        //Every time a feature is dragged or toggle, call this.chosenUpdate
        controller.subscribeChosenFeaturesUpdate(this.chosenUpdate.bind(this), "algorithm");
        controller.subscribeChosenFeaturesUpdateMiddleWare(
            this.setRefreshCountdown.bind(this),
            "algorithm",
            ["algorithm", "subalgorithms", "parameters", "preview"]
        );
        controller.subscribeChosenSelectionsUpdate(this.chosenUpdate.bind(this), "algorithm");
        controller.subscribeChosenSelectionsUpdateMiddleWare(
            this.setRefreshCountdown.bind(this),
            "algorithm",
            ["algorithm", "subalgorithms", "parameters", "preview"]
        );
    }

    /**
     * Main Algorithm Invoke
     * Copies this.var.call, modifies the copy and calls on the server with that copy
     *
     * @param {object} callParams - overwrite top level call params
     * @param {function(result)} reaction
     * @param {object} parameters - overwrite call parameters params
     * @param {object} vars - overwrite call identification param
     */
    clusterInvoke(callParams, reaction, parameters, vars) {
        callParams = callParams || {};
        parameters = parameters || {};
        var callCopy = JSON.parse(JSON.stringify(this.vars.call));

        //Set any defined keys in callParams into callCopy
        for (let p in callParams) {
            callCopy[p] = callParams[p];
        }
        for (let p in parameters) {
            callCopy.parameters[p] = parameters[p];
        }
        if (vars) callCopy.identification.vars = vars;

        invocation.invoke(callCopy, reaction);
    }
    /**
     * Updates this.vars.call permanently (no copies like clusterInvoke)
     *
     * @param {object} callParams
     * @param {object} parameters
     * @param {bool} andCall - true to make the Preview match the current this.vars.call
     */
    updateCall(callParams, parameters, andCall) {
        callParams = callParams || {};
        parameters = parameters || {};
        andCall = andCall || false;

        //Set any defined keys in callParams into callCopy
        for (let p in callParams) {
            this.vars.call[p] = callParams[p];
        }
        for (let p in parameters) {
            this.vars.call.parameters[p] = parameters[p];
        }
        if (andCall) {
            this.updateOverallPreview();
        }
    }

    /**
     * returns a clone of this.vars.call
     */
    getCall() {
        return JSON.parse(JSON.stringify(this.vars.call));
    }

    /**
     * Updates call with new features
     */
    chosenUpdate() {
        let dataFeatures = [];
        let chosenFeatures = controller.getChosenFeatures();
        for (let i in chosenFeatures) {
            dataFeatures.push(chosenFeatures[i].feature);
        }

        let dataSelections = [];
        let chosenSelections = controller.getChosenSelections();
        for (let i in chosenSelections) {
            dataSelections.push(chosenSelections[i].selection);
        }
        if (dataFeatures.length <= 1) {
            controller.setMessage("Please select at least 2 features to cluster", "error");
            this.ref.refreshCountdownText.innerHTML =
                '<div class="fillError">Please select at least 2 features to cluster</div>';
        } else this.updateCall({ dataFeatures: dataFeatures, dataSelections: dataSelections });
    }

    /**
     * Subscribe a function to call every time updateOverallPreview is called
     * @param {function} overallPreviewUpdateFunction
     */
    subscribeOverallPreviewUpdate(overallPreviewUpdateFunction) {
        this.listeners.overallPreviewUpdate = overallPreviewUpdateFunction;
    }
    updateOverallPreview() {
        this.listeners.overallPreviewUpdate();
    }

    /**
     * Undownsampled clusterInvoke
     */
    finalInvoke(outputParameters) {
        if (!this.vars.callIsRunning) {
            if (
                !outputParameters.withFeature &&
                !outputParameters.withSelections &&
                !outputParameters.withPCA
            ) {
                controller.setMessage("Please toggle some output fields to cluster", "error");
                return;
            }

            this.vars.outputFeature = outputParameters.withFeature;
            this.vars.outputSelections = outputParameters.withSelections;
            this.vars.outputPCA = outputParameters.withPCA;
            this.vars.outputGraph = outputParameters.graph;

            this.vars.finalName = outputParameters.name;
            if (!this.vars.finalName || this.vars.finalName === "") {
                controller.setMessage("Please enter an Output Name to cluster", "error");
                return;
            }
            //controller.toggleIndeterminateLoadingBar( true );
            this.startLoading(this.vars.estimatedRunTime);
            this.clusterInvoke({}, this.finalReaction.bind(this), { downsampled: false });
            this.vars.callIsRunning = true;
        } else {
            controller.setMessage("Clustering is already running", "warning");
        }
    }
    finalReaction(r) {
        let numGroups;
        if (r.hasOwnProperty("numClusters")) numGroups = r.numClusters;
        else numGroups = formulas.findMaxValueInArray(r.clusters) + 1;

        var featureNames = [];
        var selectionNames = [];
        var pcaNames = [];

        let meta = {
            creationId: r.cid,
            createdBy: "Regression",
            createdWith: JSON.parse(JSON.stringify(this.vars.call))
        };

        if (this.vars.outputFeature) {
            featureNames = this.props.featureAdd(this.vars.finalName, r.clusters);
        }
        if (this.vars.outputPCA) {
            this.props.featureAdd(this.vars.finalName + "_PCA-1", r.data.map(x => x[0]), meta);
            this.props.featureAdd(this.vars.finalName + "_PCA-2", r.data.map(y => y[1]), meta);
        }
        if (this.vars.outputSelections) {
            for (let i = 0; i < numGroups; i++)
                this.props.selectionCreate(
                    this.vars.finalName,
                    r.clusters.map(v => (v === i ? true : false)),
                    this.vars.outputGraph.with, //turn on if our graph'll show them
                    undefined,
                    meta
                );
        }
        if (this.vars.outputGraph.with) {
            let x = this.vars.outputGraph.X;
            if (x === 0 || x === 1) x = pcaNames[x];
            if (x === 2) x = featureNames[0];
            let y = this.vars.outputGraph.Y;
            if (y === 0 || y === 1) y = pcaNames[y];
            if (y === 2) y = featureNames[0];

            let selections = [];
            if (this.vars.outputGraph.withClusters)
                selections = getSelectionNamesByMeta(this.props.data, "creationId", r.cid).map(s =>
                    s.get("name")
                );
            controller.addNewGraph("Scatter", x, y, selections);
        }
        this.vars.callIsRunning = false;

        this.finishLoading();

        if (this.props.windowId !== null) controller.manager.removeWindow(this.props.windowId);
    }

    //onArray - [0,2,3] to only turn those on
    setSteps(onArray) {
        if (this.ref_steps) {
            for (let i = 0; i < this.ref_steps.length; i++) {
                if (i % 2 === 0) this.ref_steps[i].className = "algorithmStep";
                else this.ref_steps[i].className = "stepArrow";
            }
            for (let i = 0; i < onArray.length; i++) {
                if (this.ref_steps[i]) {
                    if (i % 2 === 0) this.ref_steps[i].className = "algorithmStep active";
                    else this.ref_steps[i].className = "stepArrow active";
                }
            }
        }
    }

    setSelectingSubAlgorithms(is) {
        if (is) {
            this.setSteps([0]);
            if (this.ref.continueButton) this.ref.continueButton.innerText = "Continue";
        } else this.setSteps([0, 1, 2]);
        this.setState({ selectingSubAlgorithms: is });
    }
    setSelectedSubAlgorithm(s) {
        this.vars.forceContinue = true;
        this.setState({ selectedSubAlgorithm: s });
    }

    componentWillUnmount() {
        clearInterval(this.vars.runTimeInterval);
        clearInterval(this.vars.refreshCountdownInterval);
        clearTimeout(this.vars.refreshCountdownTimeout);
        controller.unsubscribeChosenFeaturesUpdate(this.chosenUpdate.bind(this), "algorithm");
        controller.unsubscribeChosenSelectionsUpdate(this.chosenUpdate.bind(this), "algorithm");
    }

    guidanceTrigger(guidancePath) {
        this.vars.guidancePath = guidancePath;
        this.clusterInvoke(
            { routine: "guidance", guidance: guidancePath },
            this.showHelpReaction.bind(this),
            {}
        );
    }
    showHelpReaction(r) {
        this.vars.guidanceMarkdown = r.guidance;
        if (this.ref_help) {
            this.ref_help.setMarkdown(r.guidance);
            this.ref_help.open();
        }
        if (this._ref) {
            this._ref.className = "Cluster hideForHelp";
        }
    }
    closeHelp() {
        if (this.ref_help) {
            this.ref_help.close();
        }
        if (this._ref) {
            this._ref.className = "DimensionalityReduction";
        }
    }
    setOutputToggle(e, type) {
        switch (type.toLowerCase()) {
            case "feature":
                this.vars.outputFeature = !this.vars.outputFeature;
                if (this.ref.outputFeature) {
                    this.ref.outputFeature.style.opacity = this.vars.outputFeature ? 1 : 0.35;
                }
                break;
            case "selections":
                this.vars.outputSelections = !this.vars.outputSelections;
                if (this.ref.outputSelections) {
                    this.ref.outputSelections.style.opacity = this.vars.outputSelections ? 1 : 0.35;
                }
                break;
            default:
                break;
        }
    }
    setEstimatedTime(et) {
        this.vars.estimatedRunTime = et;
    }
    setRun(on) {
        console.log(on);
    }
    clickBack() {
        if (
            this.state.selectingSubAlgorithms === false &&
            this.ref.algorithmContainer.getStage() === "algo"
        ) {
            if (this.ref.subAlgorithms) {
                this.ref.subAlgorithms.back();
            }
        } else {
            if (this.ref.algorithmContainer) {
                if (this.ref.continueButton) this.ref.continueButton.innerText = "Continue";
                this.ref.algorithmContainer.back();
            }
        }
    }
    clickContinue() {
        if (this.state.selectingSubAlgorithms === true) {
            if (this.ref.subAlgorithms) {
                if (this.state.selectedSubAlgorithm !== "None") {
                    this.ref.subAlgorithms.continue();
                } else {
                    controller.setMessage(
                        "Cluster - Please choose a subalgorithm before continuing.",
                        "warning"
                    );
                }
            }
        } else {
            if (this.ref.algorithmContainer) {
                if (this.ref.algorithmContainer.getStage() === "algo") {
                    if (this.ref.continueButton) this.ref.continueButton.innerText = "Run";
                }
                this.ref.algorithmContainer.continue();
            }
        }
    }

    setRefreshCountdown(callback, clearCallbacks) {
        if (clearCallbacks) this.vars.refreshCountdownCallbacks = [];
        this.vars.refreshCountdownCallbacks.push(callback);
        let seconds = parseInt(this.vars.refreshTime, 10);
        this.vars.refreshCountdownStart = seconds;
        this.vars.refreshCountdown = seconds;
        if (this.vars.refreshCountdownInterval) clearInterval(this.vars.refreshCountdownInterval);
        this.vars.refreshCountdownInterval = setInterval(() => {
            this.refreshCountdown();
        }, 1000);
        this.refreshCountdown();
    }
    refreshCountdown() {
        if (
            this.ref.refreshCountdown &&
            this.ref.refreshCountdownBar &&
            this.ref.refreshCountdownText
        ) {
            let fullWidth = this.ref.refreshCountdown.getBoundingClientRect().width;
            this.ref.refreshCountdownBar.style.width =
                fullWidth *
                    ((this.vars.refreshCountdownStart - this.vars.refreshCountdown) /
                        this.vars.refreshCountdownStart) +
                "px";
            this.ref.refreshCountdownText.innerText =
                "Features Changed - Refreshing in " + this.vars.refreshCountdown;
        }
        if (this.vars.refreshCountdown <= 0) {
            clearInterval(this.vars.refreshCountdownInterval);
            this.vars.refreshCountdownTimeout = setTimeout(() => {
                if (this.ref.refreshCountdownBar && this.ref.refreshCountdownText) {
                    this.ref.refreshCountdownBar.style.width = "0px";
                    this.ref.refreshCountdownText.innerText = "";
                }
                if (controller.getChosenFeatures().length < 2) {
                    this.disableInteractions();
                    controller.setMessage("Please select at least 2 features to cluster", "error");
                    this.ref.refreshCountdownText.innerHTML =
                        '<div class="fillError">Please select at least 2 features to cluster</div>';
                } else {
                    this.enableInteractions();
                    for (let i = 0; i < this.vars.refreshCountdownCallbacks.length; i++) {
                        this.vars.refreshCountdownCallbacks[i]();
                    }
                    this.vars.refreshCountdownCallbacks = [];
                }
            }, 1000);
        }
        this.vars.refreshCountdown -= 1;
    }

    setContinueOpacity(opacity) {
        if (this.ref.continue) this.ref.continue.style.opacity = opacity;
    }
    startLoading(estimatedTime) {
        this.vars.isExtraTime = false;
        if (this.ref.loadingNotRunning) {
            this.ref.loadingNotRunning.style.display = "none";
        }
        if (this.ref.loadingRunning) {
            this.ref.loadingRunning.style.display = "inherit";
            if (this.ref.runLoadingBar) {
                this.ref.runLoadingBar.style.flex = "unset";
                this.ref.runLoadingBar.style.width = "0%";
                let fullWidth = this.ref.loadingRunning.getBoundingClientRect().width;
                let increment = fullWidth / estimatedTime;
                let rate = 100;
                let counts = 0;
                let finishedRunTime = 0;
                this.vars.runTimeInterval = setInterval(() => {
                    let fullWidth = this.ref.loadingRunning.getBoundingClientRect().width;
                    let increment = fullWidth / estimatedTime;
                    this.vars.currentRunTime += increment / rate;
                    if (!this.vars.isExtraTime)
                        this.ref.runLoadingBar.style.width =
                            (this.vars.currentRunTime / fullWidth) * 100 + "%";
                    else
                        this.ref.runLoadingBarExtra.style.width =
                            ((fullWidth *
                                ((this.vars.currentRunTime - finishedRunTime) /
                                    this.vars.currentRunTime)) /
                                fullWidth) *
                                100 +
                            "%";

                    let textAction = "Dimension Reducing";
                    for (let i = 1; i < (counts / 50) % 4; i++) {
                        textAction += ".";
                    }
                    this.ref.runLoadingTextAction.innerHTML = textAction;
                    if (!this.vars.isExtraTime)
                        this.ref.runLoadingTextTime.innerHTML =
                            parseInt(estimatedTime - counts / rate, 10) + "s Remaining";
                    else
                        this.ref.runLoadingTextTime.innerHTML =
                            parseInt(counts / rate - estimatedTime, 10) + "s Overtime";
                    let b = (this.vars.currentRunTime / fullWidth) * 255;
                    let r = 255 - b;
                    this.ref.runLoadingTextTime.style.color = "rgb(" + b + "," + b + "," + b + ")";
                    this.ref.runLoadingTextTime.style.textShadow =
                        "-1px -1px 0 rgb(" +
                        r +
                        "," +
                        r +
                        "," +
                        r +
                        "), 1px -1px 0 rgb(" +
                        r +
                        "," +
                        r +
                        "," +
                        r +
                        "), -1px 1px 0 rgb(" +
                        r +
                        "," +
                        r +
                        "," +
                        r +
                        "), 1px 1px 0 rgb(" +
                        r +
                        "," +
                        r +
                        "," +
                        r +
                        ")";
                    if (!this.vars.isExtraTime && this.vars.currentRunTime >= fullWidth) {
                        this.vars.isExtraTime = true;
                        finishedRunTime = this.vars.currentRunTime;
                        this.ref.runLoadingBar.style.width = "unset";
                        this.ref.runLoadingBar.style.flex = "1";
                    }
                    counts++;
                }, 1000 / rate);
            }
        }
    }
    finishLoading() {
        clearInterval(this.vars.runTimeInterval);
        this.ref.runLoadingTextAction.innerHTML = "Clustered";
        this.ref.runLoadingTextTime.innerHTML = "Done!";
    }

    setToEditParameters() {
        if (this.state.selectedSubAlgorithm !== "None") {
            let t;
            this.vars.parameterInitialStage = "algo";
            if (this.ref.subAlgorithms)
                t = this.ref.subAlgorithms.toggleSubAlgorithmSelector(false);
            if (t && this.ref.algorithmContainer)
                this.ref.algorithmContainer.toEditParameters(true);
            this.setSteps([0, 1, 2]);
            if (this.ref.continueButton) this.ref.continueButton.innerText = "Continue";
        } else {
            controller.setMessage(
                "Cluster - Please choose a subalgorithm before continuing.",
                "warning"
            );
        }
    }
    setToOutputs() {
        if (this.state.selectedSubAlgorithm !== "None") {
            this.vars.parameterInitialStage = "output";
            if (this.ref.subAlgorithms)
                this.ref.subAlgorithms.toggleSubAlgorithmSelector(false, false);
            if (this.ref.algorithmContainer) this.ref.algorithmContainer.toEditParameters(false);
            this.setSteps([0, 1, 2, 3, 4]);
            if (this.ref.continueButton) this.ref.continueButton.innerText = "Run";
        } else {
            controller.setMessage(
                "Cluster - Please choose a subalgorithm before continuing.",
                "warning"
            );
        }
    }

    /**
     * Turns off pointer events and fades buttons and graphs out
     */
    disableInteractions() {
        this.ref.subAlgorithms.disable();
        if (this.ref.algorithmContainer) this.ref.algorithmContainer.disable();
        this._ref.style.pointerEvents = "none";
    }
    enableInteractions() {
        this.ref.subAlgorithms.enable();
        if (this.ref.algorithmContainer) this.ref.algorithmContainer.enable();
        this._ref.style.pointerEvents = "inherit";
    }

    render() {
        console.log("Cluster render");
        //this.clusterInvoke( { guidance: 'clustering_page:general_clustering' }, this.testReaction.bind(this), {} );
        let backbuttonOpacity = 1;

        let algorithmContainer = null;
        if (!this.state.selectingSubAlgorithms) {
            algorithmContainer = (
                <AlgorithmContainer
                    ref={r => {
                        this.ref.algorithmContainer = r;
                    }}
                    algorithm={this.state.selectedSubAlgorithm}
                    invoke={(c, r, p, v) => {
                        this.clusterInvoke(c, r, p, v);
                    }}
                    updateCall={(c, p, a) => {
                        this.updateCall(c, p, a);
                    }}
                    getCall={() => this.getCall()}
                    l={f => {
                        this.subscribeOverallPreviewUpdate(f);
                    }}
                    setRun={on => {
                        this.setRun(on);
                    }}
                    finalInvoke={op => {
                        this.finalInvoke(op);
                    }}
                    setSteps={oa => {
                        this.setSteps(oa);
                    }}
                    parameterInitialStage={this.vars.parameterInitialStage}
                />
            );
        } else {
            this.vars.parameterInitialStage = "algo";
            backbuttonOpacity = 0.15;
        }

        let clusterClass = "DimensionalityReduction";
        if (this.state.helpOpen) clusterClass += " hideForHelp";

        return (
            <div
                className={clusterClass}
                ref={r => {
                    this._ref = r;
                }}
            >
                <div className="left" style={{ display: "none" }} />
                <div className="right">
                    <div id="title">
                        <div id="name">
                            <HelpTriggerableName
                                name=""
                                guidancePath="regression_page:general_regression"
                                trigger={gP => this.guidanceTrigger(gP)}
                            />
                        </div>
                        <div
                            id="algorithmSteps"
                            ref={r => {
                                this.ref_algosteps = r;
                            }}
                        >
                            <div
                                className="algorithmStep active"
                                ref={r => {
                                    this.ref_steps[0] = r;
                                }}
                                onClick={() => {
                                    if (this.ref.subAlgorithms)
                                        this.ref.subAlgorithms.toggleSubAlgorithmSelector(true);
                                }}
                            >
                                Choose Algorithm
                            </div>
                            <div
                                className="stepArrow"
                                ref={r => {
                                    this.ref_steps[1] = r;
                                }}
                            >
                                <MdArrowForward />
                            </div>
                            <div
                                className="algorithmStep"
                                ref={r => {
                                    this.ref_steps[2] = r;
                                }}
                                onClick={() => {
                                    this.setToEditParameters();
                                }}
                            >
                                Edit Parameters
                            </div>
                            <div
                                className="stepArrow"
                                ref={r => {
                                    this.ref_steps[3] = r;
                                }}
                            >
                                <MdArrowForward />
                            </div>
                            <div
                                className="algorithmStep"
                                ref={r => {
                                    this.ref_steps[4] = r;
                                }}
                                onClick={() => {
                                    this.setToOutputs();
                                }}
                            >
                                Outputs
                            </div>
                            <div
                                className="stepArrow"
                                ref={r => {
                                    this.ref_steps[5] = r;
                                }}
                            >
                                <MdArrowForward />
                            </div>
                            <div
                                className="algorithmStep"
                                ref={r => {
                                    this.ref_steps[6] = r;
                                }}
                            >
                                Run
                            </div>
                        </div>
                    </div>
                    <div className="bottomBar">
                        <div
                            className="loadingNotRunning"
                            ref={r => {
                                this.ref.loadingNotRunning = r;
                            }}
                        >
                            <div
                                className="bottomBarBack"
                                onClick={() => this.clickBack()}
                                style={{ opacity: backbuttonOpacity }}
                            >
                                <MdArrowBack /> <span>Back</span>
                            </div>
                            <div
                                className="refreshCountdown"
                                ref={r => {
                                    this.ref.refreshCountdown = r;
                                }}
                            >
                                <div
                                    className="refreshCountdownBar"
                                    ref={r => {
                                        this.ref.refreshCountdownBar = r;
                                    }}
                                />
                                <div
                                    className="refreshCountdownText"
                                    ref={r => {
                                        this.ref.refreshCountdownText = r;
                                    }}
                                />
                            </div>
                            <div
                                className="bottomBarContinue"
                                ref={r => {
                                    this.ref.continue = r;
                                }}
                                onClick={() => this.clickContinue()}
                            >
                                <span
                                    ref={r => {
                                        this.ref.continueButton = r;
                                    }}
                                >
                                    Continue
                                </span>{" "}
                                <MdArrowForward />
                            </div>
                        </div>
                        <div
                            className="loadingRunning"
                            ref={r => {
                                this.ref.loadingRunning = r;
                            }}
                        >
                            <div
                                className="runLoading"
                                ref={r => {
                                    this.ref.runLoading = r;
                                }}
                            >
                                <div className="runLoadingBars">
                                    <div
                                        className="runLoadingBar"
                                        ref={r => {
                                            this.ref.runLoadingBar = r;
                                        }}
                                    />
                                    <div
                                        className="runLoadingBarExtra"
                                        ref={r => {
                                            this.ref.runLoadingBarExtra = r;
                                        }}
                                    />
                                </div>
                                <div
                                    className="runLoadingTextAction"
                                    ref={r => {
                                        this.ref.runLoadingTextAction = r;
                                    }}
                                />
                                <div
                                    className="runLoadingTextTime"
                                    ref={r => {
                                        this.ref.runLoadingTextTime = r;
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                    <SubAlgorithms
                        ref={r => {
                            this.ref.subAlgorithms = r;
                        }}
                        invoke={(c, r, p, v) => {
                            this.clusterInvoke(c, r, p, v);
                        }}
                        updateCall={(c, p, a) => {
                            this.updateCall(c, p, a);
                        }}
                        setSelectingSubAlgorithms={is => {
                            this.setSelectingSubAlgorithms(is);
                        }}
                        setSelectedSubAlgorithm={s => {
                            this.setSelectedSubAlgorithm(s);
                        }}
                        setSteps={oa => {
                            this.setSteps(oa);
                        }}
                        setContinueOpacity={o => {
                            this.setContinueOpacity(o);
                        }}
                        setEstimatedTime={t => {
                            this.setEstimatedTime(t);
                        }}
                    />
                    {algorithmContainer}
                </div>
                <Help
                    ref={r => {
                        this.ref_help = r;
                    }}
                    parent={() =>
                        document.getElementsByClassName("DimensionalityReduction")[0].parentElement
                    }
                    close={() => this.closeHelp()}
                />
            </div>
        );
    }
}

// validation
DimensionalityReduction.propTypes = {
    // reference to current data
    data: IPropTypes.map.isRequired,
    featureAdd: PropTypes.func.isRequired,
    selectionCreate: PropTypes.func.isRequired
};

// redux store
const mapStateToProps = state => {
    return {
        data: state.get("data"),
        ui: state.get("ui")
    };
};
const mapDispatchToProps = dispatch => ({
    featureAdd: (featureName, featureData) => dispatch(featureAdd(featureName, featureData)),
    selectionCreate: (name, mask, visible, color, meta) =>
        dispatch(selectionCreate(name, mask, visible, color, meta))
});

export { DimensionalityReduction };
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DimensionalityReduction);
