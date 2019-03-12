import React, { useState, useEffect } from "react";
import * as algorithmTypes from "constants/algorithmTypes";
import "components/Algorithms/algorithmStyles.scss";
import AlgorithmHelpContent from "components/Algorithms/AlgorithmHelpContent";
import classnames from "classnames";
import SubalgoChart from "components/Algorithms/SubalgoChart";
import { getSubAlgorithmData } from "components/Algorithms/algorithmFunctions";
import SubalgoParams from "components/Algorithms/SubalgoParams";
import SubalgoOutputParams from "components/Algorithms/SubalgoOutputParams";

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
                <div className="params">
                    <SubalgoParams
                        hidden={
                            props.subalgoState.editMode !== algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                        }
                        subalgoState={props.subalgoState}
                        algo={props.algo}
                        paramDispatch={props.paramDispatch}
                        selectedFeatures={props.selectedFeatures}
                        filename={props.filename}
                    />
                    <SubalgoOutputParams
                        hidden={
                            props.subalgoState.editMode !== algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                        }
                        paramDispatch={props.paramDispatch}
                        subalgoState={props.subalgoState}
                    />
                </div>
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
