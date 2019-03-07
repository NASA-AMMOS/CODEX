import React, { useState, useEffect, useReducer } from "react";
import ReactEcharts from "echarts-for-react";
import echartsgl from "echarts-gl";
import { getAlgorithmData } from "components/Algorithms/algorithmFunctions";
import * as algorithmTypes from "constants/algorithmTypes";
import SubalgoChart from "components/Algorithms/SubalgoChart";
import "components/Algorithms/algorithmStyles.scss";
import SubalgoEditParams from "components/Algorithms/SubalgoEditParams";
import AlgorithmHelpContent from "components/Algorithms/AlgorithmHelpContent";

function createSubalgoStates(subalgos) {
    return subalgos.map(subalgo => {
        return {
            name: subalgo.simplename,
            loaded: false,
            serverData: null,
            humanName: subalgo.name,
            params: subalgo.parameters.map(param => {
                return { name: param.name, value: param.value };
            }),
            outputParams: [
                { name: "name", value: "Cluster" },
                { name: "pca", value: true },
                { name: "clusterId", value: false },
                { name: "clusters", value: true }
            ],
            paramHelpText: null
        };
    });
}

function subalgoParamReducer(subalgoStates, action) {
    switch (action.type) {
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
                          params: subalgo.params.map(param => {
                              return param.name === action.paramName
                                  ? Object.assign(param, { value: action.value })
                                  : param;
                          })
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
    }
}

function ClusterAlgorithm(props) {
    const algorithm = algorithmTypes.CLUSTER_ALGORITHM;
    const algoVerb = "clustering";

    // SUBALGORITHM STATE MANAGEMENT

    const [subalgoStates, subalgoStatesDispatch] = useReducer(
        subalgoParamReducer,
        algorithmTypes.SUBALGORITHMS[algorithm],
        createSubalgoStates
    );

    // Routine to get data from the backend for each subalgorithm. State is updated as data comes in.
    useEffect(_ => {
        const algorithmRequests = getAlgorithmData(
            algorithm,
            props.selectedFeatures,
            props.filename,
            inMsg => {
                subalgoStatesDispatch({ type: "updateData", inMsg });
            }
        );

        // If the user closes the window before all the sub algos have loaded, force close the sockets to the server.
        return function cleanup() {
            algorithmRequests.forEach(req => req.closeSocket());
        };
    }, []); // Only run this call once, on component load.

    // HELP MODE MANAGEMENT

    const [helpModeState, setHelpModeState] = useState(false);

    //ACTUAL RENDERING STARTS HERE

    const selectedSubalgo = subalgoStates.find(subalgo => subalgo.editMode);
    return (
        <React.Fragment>
            <div className="preview-title">
                <div className="title">
                    {helpModeState.active ? `Help: ${algoVerb}` : "Choose a Clustering Method"}
                </div>
                <button onClick={_ => setHelpModeState(state => !state)}>
                    {helpModeState ? "exit help" : "help"}
                </button>
            </div>
            <div className="algo-container">
                <AlgorithmHelpContent
                    hidden={!helpModeState}
                    guidancePath={`${algoVerb}_page:general_${algoVerb}`}
                />
                {subalgoStates.map(subalgoState => (
                    <SubalgoChart
                        key={subalgoState.name}
                        name={subalgoState.name}
                        humanName={subalgoState.humanName}
                        serverData={subalgoState.serverData}
                        onClickCallback={_ =>
                            subalgoStatesDispatch({
                                type: "changeEditMode",
                                name: subalgoState.name,
                                editMode: algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                            })
                        }
                        editMode={subalgoState.editMode}
                    />
                ))}
                )}
            </div>
            <div className="subalgo-focus" hidden={!selectedSubalgo}>
                {!selectedSubalgo ? null : (
                    <SubalgoEditParams
                        algo={algorithm}
                        subalgoState={selectedSubalgo}
                        paramDispatch={subalgoStatesDispatch}
                        baseGuidancePath={`${algoVerb}_page`}
                    />
                )}
            </div>
        </React.Fragment>
    );
}

export default ClusterAlgorithm;
