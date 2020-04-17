import "./algorithmStyles.scss";

import FormControl from "@material-ui/core/FormControl";
import Input from "@material-ui/core/Input";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
import Select from "@material-ui/core/Select";
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
            <div className="subtitle">Principal Component Outputs</div>
            <div className="subalgo-param-field">
                <label className="param-title">
                    <input
                        type="checkbox"
                        checked={getParamValue(props, "pca")}
                        onChange={e => {
                            dispatchOutputParamChange(props, "pca", e.target.checked);
                            if (!e.target.checked)
                                dispatchOutputParamChange(props, "graph", e.target.checked);
                        }}
                    />
                    Create Features for PC1 and PC2
                </label>
            </div>
            <div className="subalgo-param-field">
                <label className="param-title">
                    <input
                        type="checkbox"
                        checked={getParamValue(props, "graph")}
                        onChange={e => dispatchOutputParamChange(props, "graph", e.target.checked)}
                        disabled={!getParamValue(props, "pca")}
                    />
                    Create a scatterplot with PC1 vs PC2
                </label>
            </div>
            <div className="subtitle">Cluster Outputs</div>
            <div className="subalgo-param-field">
                <label className="param-title">
                    <input
                        type="checkbox"
                        checked={getParamValue(props, "clusterId")}
                        onChange={e =>
                            dispatchOutputParamChange(props, "clusterId", e.target.checked)
                        }
                    />
                    Create Features for each Cluster ID
                </label>
            </div>
            <div className="subalgo-param-field">
                <label className="param-title">
                    <input
                        type="checkbox"
                        checked={getParamValue(props, "clusters")}
                        onChange={e =>
                            dispatchOutputParamChange(props, "clusters", e.target.checked)
                        }
                    />
                    Create Selections for each Cluster
                </label>
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
