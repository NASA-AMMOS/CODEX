import React, { useState, useEffect } from "react";
import * as algorithmTypes from "constants/algorithmTypes";
import "components/Algorithms/algorithmStyles.scss";
import AlgorithmHelpContent from "components/Algorithms/AlgorithmHelpContent";
import classnames from "classnames";
import SubalgoChart from "components/Algorithms/SubalgoChart";
import { getSubAlgorithmData } from "components/Algorithms/algorithmFunctions";

function makeParamField(props, baseParam) {
    const paramValue = props.subalgoState.parameters.find(param => param.name === baseParam.name)
        .value;
    return (
        <div className="subalgo-param-field" key={baseParam.title}>
            <div className="param-title">{baseParam.title}</div>
            <input
                type={baseParam.inputType}
                min={baseParam.min}
                max={baseParam.max}
                step={baseParam.step}
                value={paramValue}
                onChange={e =>
                    props.paramDispatch({
                        type: "changeParam",
                        name: props.subalgoState.name,
                        paramName: baseParam.name,
                        value: e.target.value
                    })
                }
            />
        </div>
    );
}

function makeParamsCol(props) {
    const baseParams = algorithmTypes.SUBALGORITHMS[props.algo].find(
        subalgo => subalgo.simplename === props.subalgoState.name
    ).parameters;

    return (
        <React.Fragment>
            {baseParams.map(baseParam => makeParamField(props, baseParam))}
        </React.Fragment>
    );
}

function makeOutputsCol(props) {
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
        <React.Fragment>
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
        </React.Fragment>
    );
}

function getLeftCol(props) {
    switch (props.subalgoState.editMode) {
        case algorithmTypes.SUBALGO_MODE_EDIT_PARAMS:
            return makeParamsCol(props);
        case algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS:
            return makeOutputsCol(props);
    }
}

function getTitle(props, helpModeState) {
    switch (props.subalgoState.editMode) {
        case algorithmTypes.SUBALGO_MODE_EDIT_PARAMS:
            return helpModeState.active
                ? `Help: ${props.subalgoState.humanName}`
                : "Choose Number of Clusters";
        case algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS:
            return helpModeState.active
                ? `Help : ${props.subalgoState.humanName}`
                : "Choose Clustering Parameters";
    }
}

function getActionButtons(props, setSubalgoRunPending) {
    switch (props.subalgoState.editMode) {
        case algorithmTypes.SUBALGO_MODE_EDIT_PARAMS:
            return (
                <React.Fragment>
                    <button
                        onClick={_ =>
                            props.paramDispatch({
                                type: "changeEditMode",
                                name: props.subalgoState.name
                            })
                        }
                    >
                        Back
                    </button>
                    <button
                        onClick={_ =>
                            props.paramDispatch({
                                type: "changeEditMode",
                                name: props.subalgoState.name,
                                editMode: algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                            })
                        }
                    >
                        Next
                    </button>
                </React.Fragment>
            );
        case algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS:
            return (
                <React.Fragment>
                    <button
                        onClick={_ =>
                            props.paramDispatch({
                                type: "changeEditMode",
                                name: props.subalgoState.name,
                                editMode: algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                            })
                        }
                    >
                        Back
                    </button>
                    <button onClick={_ => setSubalgoRunPending(true)}>Run</button>
                </React.Fragment>
            );
    }
}

function SubalgoEditParams(props) {
    const [helpModeState, setHelpModeState] = useState(false);
    const [subalgoRunPending, setSubalgoRunPending] = useState(false);

    useEffect(
        _ => {
            if (!subalgoRunPending) return;
            const req = getSubAlgorithmData(
                props.subalgoState,
                props.selectedFeatures,
                props.filename,
                inMsg => {
                    console.log(inMsg);
                },
                false
            );

            return function cleanup() {
                req.closeSocket();
            };
        },
        [subalgoRunPending]
    );

    return (
        <React.Fragment>
            <div className="subalgo-edit-header">
                <div className="title">{getTitle(props, helpModeState)}</div>
                <button onClick={_ => setHelpModeState(state => !state)}>
                    {helpModeState ? "Exit Help" : "Help"}
                </button>
            </div>
            <div className="subalgo-detail">
                <div className="params">{getLeftCol(props)}</div>
                <AlgorithmHelpContent
                    hidden={!helpModeState}
                    guidancePath={`${props.baseGuidancePath}:${props.subalgoState.name}`}
                />
                <div className="preview">
                    <SubalgoChart
                        key={props.subalgoState.name}
                        name={props.subalgoState.name}
                        humanName={props.subalgoState.humanName}
                        serverData={props.subalgoState.serverData}
                        loaded={props.subalgoState.loaded}
                        previewMode
                    />
                    <div className="action-buttons">
                        {getActionButtons(props, setSubalgoRunPending)}
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default SubalgoEditParams;
