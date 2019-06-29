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
import Input from "@material-ui/core/Input";
import TextField from "@material-ui/core/TextField";

function makeFeatureDropdown(props, paramName) {
    const featureList = props.selectedFeatures.concat(["PCA1", "PCA2"]);

    return (
        <form>
            <FormControl>
                <Select
                    value={getParamValue(props, paramName)}
                    onChange={e => dispatchOutputParamChange(props, paramName, e.target.value)}
                    input={<Input name="input-axis" />}
                    displayEmpty
                    name="input-axis"
                >
                    {featureList.map(feature => (
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
    return (
        <div hidden={props.hidden} className="subalgo-edit-output-params">
            <div className="title">{props.subalgoState.humanName} Output Options</div>
            <div className="subtitle">Principal component outputs</div>
            <div className="subalgo-param-field">
                <input
                    type="checkbox"
                    checked={getParamValue(props, "pca")}
                    onChange={e => {
                        dispatchOutputParamChange(props, "pca", e.target.checked);
                        if (!e.target.checked)
                            dispatchOutputParamChange(props, "graph", e.target.checked);
                    }}
                />
                <div className="param-title">Create Features for PC1 and PC2</div>
            </div>
            <div className="subalgo-param-field">
                <input
                    type="checkbox"
                    checked={getParamValue(props, "graph")}
                    onChange={e => dispatchOutputParamChange(props, "graph", e.target.checked)}
                    disabled={!getParamValue(props, "pca")}
                />
                <div className="param-title">Create a scatterplot with PC1 vs PC2</div>
            </div>

            <div className="subtitle">Cluster outputs</div>
            <div className="subalgo-param-field">
                <input
                    type="checkbox"
                    checked={getParamValue(props, "clusterId")}
                    onChange={e => dispatchOutputParamChange(props, "clusterId", e.target.checked)}
                />
                <div className="param-title">Create Features for each Cluster ID</div>
            </div>
            <div className="subalgo-param-field">
                <input
                    type="checkbox"
                    checked={getParamValue(props, "clusters")}
                    onChange={e => dispatchOutputParamChange(props, "clusters", e.target.checked)}
                />
                <div className="param-title">Create Selections for each Cluster</div>
            </div>
            <TextField
                label="Cluster Name"
                helperText="This is used to label the new Features and Selections"
                margin="normal"
                variant="filled"
                value={getParamValue(props, "name")}
                onChange={e => dispatchOutputParamChange(props, "name", e.target.value)}
                disabled={!getParamValue(props, "clusters")}
            />
        </div>
    );
}

export default SubalgoOutputParams;
