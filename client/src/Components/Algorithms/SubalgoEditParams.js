import React, { useState } from "react";
import * as algorithmTypes from "constants/algorithmTypes";
import "components/Algorithms/algorithmStyles.scss";
import AlgorithmHelpContent from "components/Algorithms/AlgorithmHelpContent";
import classnames from "classnames";
import SubalgoChart from "components/Algorithms/SubalgoChart";

function makeParamField(props, baseParam) {
    const paramValue = props.subalgoState.params.find(param => param.name === baseParam.name).value;
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
                    props.changeParam(props.subalgoState.name, baseParam.name, e.target.value)
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
    return (
        <React.Fragment>
            <div className="title">{props.subalgoState.humanName}: Edit Outputs</div>
            <div className="subalgo-param-field">
                <div className="param-title">Name</div>
                <input
                    type="text"
                    value={props.subalgoState.outputParams.name}
                    onChange={e =>
                        props.changeOutputParam(props.subalgoState.name, "name", e.target.value)
                    }
                />
            </div>
            <hr />
            <div className="output-section">Features</div>
            <div className="subalgo-param-field">
                <div className="param-title">Name</div>
                <input
                    type="checkbox"
                    checked={props.subalgoState.outputParams.pca}
                    onChange={e =>
                        props.changeOutputParam(props.subalgoState.name, "pca", e.target.checked)
                    }
                />
            </div>
            <div className="subalgo-param-field">
                <div className="param-title">Cluster ID</div>
                <input
                    type="checkbox"
                    checked={props.subalgoState.outputParams.clusterId}
                    onChange={e =>
                        props.changeOutputParam(
                            props.subalgoState.name,
                            "clusterId",
                            e.target.checked
                        )
                    }
                />
            </div>
            <hr />
            <div className="output-section">Selections</div>
            <div className="subalgo-param-field">
                <div className="param-title">Clusters</div>
                <input
                    type="checkbox"
                    checked={props.subalgoState.outputParams.clusters}
                    onChange={e =>
                        props.changeOutputParam(
                            props.subalgoState.name,
                            "clusters",
                            e.target.checked
                        )
                    }
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

function getActionButtons(props) {
    switch (props.subalgoState.editMode) {
        case algorithmTypes.SUBALGO_MODE_EDIT_PARAMS:
            return (
                <React.Fragment>
                    <button onClick={_ => props.setMode(props.subalgoState.name)}>Back</button>
                    <button
                        onClick={_ =>
                            props.setMode(
                                props.subalgoState.name,
                                algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                            )
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
                            props.setMode(
                                props.subalgoState.name,
                                algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                            )
                        }
                    >
                        Back
                    </button>
                    <button>Run</button>
                </React.Fragment>
            );
    }
}

function SubalgoEditParams(props) {
    const [helpModeState, setHelpModeState] = useState({
        active: false,
        textContent: "Loading..."
    });
    function toggleHelpMode() {
        setHelpModeState({ active: !helpModeState.active, textContent: helpModeState.textContent });
    }

    return (
        <React.Fragment>
            <div className="subalgo-edit-header">
                <div className="title">{getTitle(props, helpModeState)}</div>
                <button onClick={toggleHelpMode}>
                    {helpModeState.active ? "Exit Help" : "Help"}
                </button>
            </div>
            <div className="subalgo-detail">
                <div className="params">{getLeftCol(props)}</div>
                <div className="help-container" hidden={!helpModeState.active}>
                    <AlgorithmHelpContent
                        helpModeState={helpModeState}
                        updateTextContent={textContent =>
                            setHelpModeState({ active: helpModeState.active, textContent })
                        }
                        guidancePath={`${props.baseGuidancePath}:${props.subalgoState.name}`}
                    />
                </div>
                <div className="preview">
                    <SubalgoChart
                        key={props.subalgoState.name}
                        name={props.subalgoState.name}
                        humanName={props.subalgoState.humanName}
                        serverData={props.subalgoState.serverData}
                        previewMode
                    />
                    <div className="action-buttons">{getActionButtons(props)}</div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default SubalgoEditParams;
