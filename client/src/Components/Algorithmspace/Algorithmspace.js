import React, { Component } from "react";
import "./Algorithmspace.css";

import { manager } from "../RWindowManager/manager/manager";
import Blank from "components/Blank";
import { formulas } from "../../formulas/formulas";

class Algorithmspace extends Component {
    constructor(props) {
        super(props);

        this.state = {
            isOpen: false,
            title: "",
            algorithmComponent: this.props.algorithmComponent || Blank
        };
    }

    openSpace() {
        this.setState({ isOpen: true });
        var config = {
            title: this.title,
            type: "",
            name: this.title,
            component: "AlgorithmSpace"
        };

        manager.addWindow(config);
    }
    closeSpace() {
        this.setState({ isOpen: false, title: "", algorithmComponent: Blank });
    }

    setAlgorithm(name, component) {
        this.setState({ isOpen: true, title: name, algorithmComponent: component });
    }

    shouldComponentUpdate(nextProps) {
        return !formulas.orderedObjectComparison(this.props, nextProps);
    }

    render() {
        const AlgorithmComponent = this.state.algorithmComponent;

        return (
            <div className="Algorithmspace">
                <div id="container">
                    <AlgorithmComponent
                        ref={r => {
                            this.algorithmChild = r;
                        }}
                        managerId={this.props._RWindowManager.managerId}
                        windowId={this.props._RWindowManager.windowId}
                    />
                </div>
            </div>
        );
    }
}

export default Algorithmspace;
