import React, { useState, useEffect } from "react";
import * as algorithmTypes from "constants/algorithmTypes";
import "components/Algorithms/algorithmStyles.scss";
import AlgorithmHelpContent from "components/Algorithms/AlgorithmHelpContent";
import classnames from "classnames";
import SubalgoChart from "components/Algorithms/SubalgoChart";
import { getSubAlgorithmData } from "components/Algorithms/algorithmFunctions";
import SubalgoParams from "components/Algorithms/SubalgoParams";
import MenuItem from "@material-ui/core/MenuItem";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import OutlinedInput from "@material-ui/core/OutlinedInput";

function makeFeatureDropdown(props, paramName) {
    return (
        <form>
            <FormControl>
                <Select
                    value={getParamValue(props, paramName) || "Select Value"}
                    onChange={e => dispatchOutputParamChange(props, paramName, e.target.value)}
                    input={<OutlinedInput labelWidth={0} placeholder="aSDFADS" />}
                >
                    {props.selectedFeatures.map(feature => (
                        <MenuItem key={feature} value={feature}>
                            {feature}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </form>
    );
}

function dispatchOutputParamChange(props, param, value) {
    props.paramDispatch({
        type: "changeOutputParam",
        name: props.subalgoState.name,
        outputParamName: param,
        value
    });
}

function getParamValue(props, name) {
    return props.subalgoState.outputParams.find(p => p.name === name).value;
}

function SubalgoOutputParams(props) {
    console.log(props.selectedFeatures.toJS());
    return (
        <div hidden={props.hidden}>
            <div className="title">{props.subalgoState.humanName}: Edit Outputs</div>
            <div className="subalgo-param-field">
                <div className="param-title">Name</div>
                <input
                    type="text"
                    value={getParamValue(props, "name")}
                    onChange={e => dispatchOutputParamChange(props, "name", e.target.value)}
                />
            </div>
            <hr />
            <div className="output-section">Features</div>
            <div className="subalgo-param-field">
                <div className="param-title">PCA 1 and 2</div>
                <input
                    type="checkbox"
                    checked={getParamValue(props, "pca")}
                    onChange={e => dispatchOutputParamChange(props, "pca", e.target.checked)}
                />
            </div>
            <div className="subalgo-param-field">
                <div className="param-title">Cluster ID</div>
                <input
                    type="checkbox"
                    checked={getParamValue(props, "clusterId")}
                    onChange={e => dispatchOutputParamChange(props, "clusterId", e.target.checked)}
                />
            </div>
            <hr />
            <div className="output-section">Selections</div>
            <div className="subalgo-param-field">
                <div className="param-title">Clusters</div>
                <input
                    type="checkbox"
                    checked={getParamValue(props, "clusters")}
                    onChange={e => dispatchOutputParamChange(props, "clusters", e.target.checked)}
                />
            </div>
            <hr />
            <div className="output-section">
                Graph (Scatter)
                <div className="subalgo-param-field">
                    <input
                        type="checkbox"
                        checked={getParamValue(props, "graph")}
                        onChange={e => dispatchOutputParamChange(props, "graph", e.target.checked)}
                    />
                </div>
            </div>
            <div className="subalgo-param-field">
                <div className="param-title">X Axis</div>
                {makeFeatureDropdown(props, "xAxis")}
            </div>
            <div className="subalgo-param-field">
                <div className="param-title">Y Axis</div>
                {makeFeatureDropdown(props, "yAxis")}
            </div>
        </div>
    );
}

export default SubalgoOutputParams;
