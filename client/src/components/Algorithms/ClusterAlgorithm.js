import React, { useState, useEffect, useReducer, useMemo } from "react";
import { getSubAlgorithmData } from "components/Algorithms/algorithmFunctions";
import * as algorithmTypes from "constants/algorithmTypes";
import SubalgoChart from "components/Algorithms/SubalgoChart";
import "components/Algorithms/algorithmStyles.scss";
import SubalgoEdit from "components/Algorithms/SubalgoEdit";
import AlgorithmHelpContent from "components/Algorithms/AlgorithmHelpContent";
import HelpOutline from "@material-ui/icons/HelpOutline";
import Close from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";

import { useSelectedFeatureNames, useFilename } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";

// Creates intial states from the subalgo request presets in algorithmTypes
function createSubalgoStates(subalgos) {
    return subalgos.map(subalgo => {
        return {
            name: subalgo.simplename,
            loaded: false,
            serverData: null,
            simplename: subalgo.simplename,
            humanName: subalgo.name,
            parameters: subalgo.parameters.map(param => {
                return { name: param.name, value: param.value };
            }),
            outputParams: [
                { name: "name", value: "Cluster" },
                { name: "pca", value: true },
                { name: "clusterId", value: false },
                { name: "clusters", value: true },
                { name: "graph", value: false },
                { name: "xAxis", value: "PCA1" },
                { name: "yAxis", value: "PCA2" }
            ],
            paramHelpText: null
        };
    });
}

// Reducer to handle subalgo state changes from sub-components
function subalgoParamReducer(subalgoStates, action) {
    switch (action.type) {
        case "addSocketHandler":
            return subalgoStates.map(subalgo =>
                subalgo.name === action.name
                    ? Object.assign(subalgo, { socket: action.socket })
                    : subalgo
            );
        case "updateData":
            return subalgoStates.map(subalgo =>
                subalgo.name === action.inMsg.algorithmName
                    ? Object.assign(subalgo, { loaded: true, serverData: action.inMsg })
                    : subalgo
            );
        case "changeEditMode":
            return subalgoStates.map(subalgo =>
                subalgo.name === action.name
                    ? Object.assign(subalgo, { editMode: action.editMode })
                    : subalgo
            );
        case "changeParam":
            return subalgoStates.map(subalgo =>
                subalgo.name === action.name
                    ? Object.assign(subalgo, {
                          params: subalgo.parameters.map(param => {
                              return param.name === action.paramName
                                  ? Object.assign(param, { value: action.value })
                                  : param;
                          }),
                          needsRefresh: true
                      })
                    : subalgo
            );
        case "changeOutputParam":
            return subalgoStates.map(subalgo =>
                subalgo.name === action.name
                    ? Object.assign(subalgo, {
                          outputParams: subalgo.outputParams.map(param => {
                              return param.name === action.outputParamName
                                  ? Object.assign(param, { value: action.value })
                                  : param;
                          })
                      })
                    : subalgo
            );
        case "refreshPending":
            return subalgoStates.map(subalgo => {
                if (subalgo.name !== action.name) return subalgo;
                if (subalgo.socket) subalgo.socket.closeSocket(); // Want to cancel previous refresh if we're starting a new one
                return Object.assign(subalgo, {
                    needsRefresh: false,
                    loaded: false
                });
            });
    }
}

function getSubalgoPreviews(subalgoStates, subalgoStatesDispatch) {
    return (
        <div className="algo-container">
            {subalgoStates.map(subalgoState => (
                <SubalgoChart
                    key={subalgoState.name}
                    name={subalgoState.name}
                    humanName={subalgoState.humanName}
                    serverData={subalgoState.serverData}
                    onClick={_ =>
                        subalgoStatesDispatch({
                            type: "changeEditMode",
                            name: subalgoState.name,
                            editMode: algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                        })
                    }
                    editMode={subalgoState.editMode}
                    loaded={subalgoState.loaded}
                    titleText={subalgoState.humanName}
                />
            ))}
        </div>
    );
}

function ClusterAlgorithm(props) {
    const win = useWindowManager(props, {
        width: 900,
        height: 600,
        resizeable: false,
        title: "Clustering"
    });

    const filename = useFilename();
    const [selectedFeatures, _] = useSelectedFeatureNames();

    const algorithm = algorithmTypes.CLUSTER_ALGORITHM;
    const algoVerb = "clustering";

    // SUBALGORITHM STATE MANAGEMENT

    const [subalgoStates, subalgoStatesDispatch] = useReducer(
        subalgoParamReducer,
        algorithmTypes.SUBALGORITHMS[algorithm],
        createSubalgoStates
    );

    // Initial render routine to get data from the backend for each subalgorithm. State is updated as data comes in.
    // A reference to the socket connection is stored in the state for each subalgo.
    useEffect(_ => {
        subalgoStates.forEach(subalgo => {
            const socket = getSubAlgorithmData(
                subalgo,
                selectedFeatures,
                filename,
                500,
                [],
                inMsg => {
                    subalgoStatesDispatch({ type: "updateData", inMsg });
                }
            );
            subalgoStatesDispatch({ type: "addSocketHandler", name: subalgo.name, socket });
        });

        // This cleanup function will fire when the component unloads, closing any in-progress socket connections
        return _ => {
            subalgoStates.forEach(subalgo => subalgo.socket.closeSocket());
        };
    }, []); // Only run this call once, on component load.

    // Routine to update a subalgo preview if a user has changed any of the parameters
    // (these changes are initiated in the lower subalgo components but we want to show those changes in the overview window too)
    if (subalgoStates.some(subalgo => subalgo.needsRefresh)) {
        subalgoStates
            .filter(subalgo => subalgo.needsRefresh)
            .forEach(subalgo => {
                console.log(`Refreshing ${subalgo.name}`);
                subalgoStatesDispatch({ type: "refreshPending", name: subalgo.name });
                const socket = getSubAlgorithmData(
                    subalgo,
                    selectedFeatures,
                    filename,
                    500,
                    [],
                    inMsg => {
                        subalgoStatesDispatch({ type: "updateData", inMsg });
                    }
                );
                subalgoStatesDispatch({ type: "addSocketHandler", name: subalgo.name, socket });
            });
    }

    // HELP MODE MANAGEMENT

    const [helpModeState, setHelpModeState] = useState(false);

    //ACTUAL RENDERING STARTS HERE

    const selectedSubalgo = subalgoStates.find(subalgo => subalgo.editMode);

    return (
        <React.Fragment>
            <div className="preview-title">
                <div className="title">
                    {helpModeState ? `Help: ${algoVerb}` : "Choose a Clustering Method"}
                </div>
                <IconButton onClick={_ => setHelpModeState(state => !state)}>
                    {helpModeState ? <Close /> : <HelpOutline />}
                </IconButton>
            </div>
            <AlgorithmHelpContent
                hidden={!helpModeState}
                guidancePath={`${algoVerb}_page:general_${algoVerb}`}
            />
            {!selectedSubalgo && getSubalgoPreviews(subalgoStates, subalgoStatesDispatch)}
            <div className="subalgo-focus" hidden={!selectedSubalgo}>
                {!selectedSubalgo ? null : (
                    <SubalgoEdit
                        algo={algorithm}
                        subalgoState={selectedSubalgo}
                        paramDispatch={action => subalgoStatesDispatch(action)}
                        baseGuidancePath={`${algoVerb}_page`}
                        selectedFeatures={selectedFeatures}
                        filename={filename}
                        winId={props.winId}
                    />
                )}
            </div>
        </React.Fragment>
    );
}

export default ClusterAlgorithm;
