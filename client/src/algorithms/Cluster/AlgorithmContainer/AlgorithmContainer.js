import React, { Component } from "react";
import "./AlgorithmContainer.css";
import Preview from "../Preview/Preview";
import Parameters from "../Parameters/Parameters";

class AlgorithmContainer extends Component {
    constructor(props) {
        super(props);
        this.parameterInitialStage = this.props.parameterInitialStage || "algo";
    }
    toEditParameters(on) {
        this.parameterInitialStage = on ? "algo" : "output";
        if (this.ref_parameters) this.ref_parameters.toEditParameters(on);
    }

    getStage() {
        if (this.ref_parameters) {
            return this.ref_parameters.getStage();
        }
    }
    back() {
        if (this.ref_parameters) {
            this.ref_parameters.back();
        }
    }
    continue() {
        if (this.ref_parameters) {
            this.ref_parameters.continue();
        }
    }

    disable() {
        this.ref_preview.disable();
        this.ref_parameters.disable();
    }
    enable() {
        this.ref_preview.enable();
        this.ref_parameters.enable();
    }

    update() {
        this.ref_preview.update();
        this.ref_parameters.chosenUpdate();
    }

    render() {
        return (
            <div className="AlgorithmContainer">
                <Preview
                    ref={r => {
                        this.ref_preview = r;
                    }}
                    algorithm={this.props.algorithm}
                    invoke={(c, r, p, v) => {
                        this.props.invoke(c, r, p, v);
                    }}
                    updateCall={(c, p, a) => {
                        this.props.updateCall(c, p, a);
                    }}
                    getCall={() => this.props.getCall()}
                    l={f => {
                        this.props.l(f);
                    }}
                />
                <Parameters
                    ref={r => {
                        if (r) this.ref_parameters = r.getWrappedInstance();
                        else this.ref_parameters = null;
                    }}
                    algorithm={this.props.algorithm}
                    invoke={(c, r, p, v) => {
                        this.props.invoke(c, r, p, v);
                    }}
                    updateCall={(c, p, a) => {
                        this.props.updateCall(c, p, a);
                    }}
                    getCall={() => this.props.getCall()}
                    finalInvoke={op => {
                        this.props.finalInvoke(op);
                    }}
                    setSteps={oa => {
                        this.props.setSteps(oa);
                    }}
                    initialStage={this.parameterInitialStage}
                />
            </div>
        );
    }
}

export default AlgorithmContainer;
