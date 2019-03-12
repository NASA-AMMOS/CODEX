import React, { useState, useEffect } from "react";
import * as algorithmTypes from "constants/algorithmTypes";
import "components/Algorithms/algorithmStyles.scss";
import AlgorithmHelpContent from "components/Algorithms/AlgorithmHelpContent";
import classnames from "classnames";
import SubalgoChart from "components/Algorithms/SubalgoChart";
import { getSubAlgorithmData } from "components/Algorithms/algorithmFunctions";
import SubalgoParams from "components/Algorithms/SubalgoParams";

function SubalgoOutputParams(props) {
    function dispatchOutputParamChange(param, value) {
        props.paramDispatch({
            type: "changeOutputParam",
            name: props.subalgoState.name,
            outputParamName: param,
            value
        });
    }

    function getParamValue(name) {
        return props.subalgoState.outputParams.find(p => p.name === name).value;
    }

    return (
        <div hidden={props.hidden}>
            <div className="title">{props.subalgoState.humanName}: Edit Outputs</div>
            <div className="subalgo-param-field">
                <div className="param-title">Name</div>
                <input
                    type="text"
                    value={getParamValue("name")}
                    onChange={e => dispatchOutputParamChange("name", e.target.value)}
                />
            </div>
            <hr />
            <div className="output-section">Features</div>
            <div className="subalgo-param-field">
                <div className="param-title">Name</div>
                <input
                    type="checkbox"
                    checked={getParamValue("pca")}
                    onChange={e => dispatchOutputParamChange("pca", e.target.checked)}
                />
            </div>
            <div className="subalgo-param-field">
                <div className="param-title">Cluster ID</div>
                <input
                    type="checkbox"
                    checked={getParamValue("clusterId")}
                    onChange={e => dispatchOutputParamChange("clusterId", e.target.checked)}
                />
            </div>
            <hr />
            <div className="output-section">Selections</div>
            <div className="subalgo-param-field">
                <div className="param-title">Clusters</div>
                <input
                    type="checkbox"
                    checked={getParamValue("clusters")}
                    onChange={e => dispatchOutputParamChange("clusters", e.target.checked)}
                />
            </div>
        </div>
    );
}

export default SubalgoOutputParams;
