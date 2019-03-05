import React, { useState, useEffect } from "react";
import ReactEcharts from "echarts-for-react";
import echartsgl from "echarts-gl";
import { getAlgorithmData } from "components/Algorithms/algorithmFunctions";
import * as algorithmTypes from "constants/algorithmTypes";
import SubalgoChart from "components/Algorithms/SubalgoChart";
import "components/Algorithms/algorithmStyles.scss";
import SubalgoEditParams from "components/Algorithms/SubalgoEditParams";
import SubalgoEditOutputs from "components/Algorithms/SubalgoEditOutputs";
import AlgorithmHelpContent from "components/Algorithms/AlgorithmHelpContent";

function ClusterAlgorithm(props) {
    const algorithm = algorithmTypes.CLUSTER_ALGORITHM;
    const algoVerb = "Clustering";

    // SUBALGORITHM STATE MANAGEMENT

    const [subalgoStates, setSubalgoStates] = useState(
        algorithmTypes.SUBALGORITHMS[algorithm].map(subalgo => {
            return {
                name: subalgo.simplename,
                loaded: false,
                serverData: null,
                humanName: subalgo.name,
                params: subalgo.parameters.map(param => {
                    return { name: param.name, value: param.value };
                }),
                outputParams: {
                    name: "Cluster",
                    pca: true,
                    clusterId: false,
                    clusters: true
                }
            };
        })
    );

    // Routine to get data from the backend for each subalgorithm. State is updated as data comes in.
    useEffect(_ => {
        const algorithmRequests = getAlgorithmData(
            algorithm,
            props.selectedFeatures,
            props.filename,
            inMsg => {
                setSubalgoStates(
                    subalgoStates.map(subalgo =>
                        subalgo.name === inMsg.algorithmName
                            ? Object.assign(subalgo, { loaded: true, serverData: inMsg })
                            : subalgo
                    )
                );
            }
        );

        // If the user closes the window before all the sub algos have loaded, force close the sockets to the server.
        return function cleanup() {
            algorithmRequests.forEach(req => req.closeSocket());
        };
    }, []); // Only run this call once, on component load.

    function setSubalgoEditMode(subalgoName, editMode) {
        setSubalgoStates(
            subalgoStates.map(subalgo =>
                subalgo.name === subalgoName ? Object.assign(subalgo, { editMode }) : subalgo
            )
        );
    }

    // Function to change the parameters of each subalgo (called from within the parameter edit component)
    function changeParam(subalgoName, paramName, value) {
        setSubalgoStates(
            subalgoStates.map(subalgo =>
                subalgo.name === subalgoName
                    ? Object.assign(subalgo, {
                          params: subalgo.params.map(param => {
                              return param.name === paramName
                                  ? Object.assign(param, { value })
                                  : param;
                          })
                      })
                    : subalgo
            )
        );
    }

    // Function to change the output parameters of each subalgo (called from within the output parameter edit component)
    function changeOutputParam(subalgoName, outputParamName, value) {
        setSubalgoStates(
            subalgoStates.map(subalgo =>
                subalgo.name === subalgoName
                    ? Object.assign(subalgo, {
                          outputParams: Object.keys(subalgo.outputParams).map(key => {
                              return Object.assign(subalgo.outputParams[key], {
                                  value:
                                      key === outputParamName
                                          ? value
                                          : subalgo.outputParams[key].value
                              });
                          })
                      })
                    : subalgo
            )
        );
    }

    // HELP MODE MANAGEMENT

    const [helpModeState, setHelpModeState] = useState({ active: false, textContent: null });

    //ACTUAL RENDERING STARTS HERE

    // Generate preview charts
    const subalgoPreviews = subalgoStates.map(subalgoState => (
        <SubalgoChart
            key={subalgoState.name}
            name={subalgoState.name}
            humanName={subalgoState.humanName}
            serverData={subalgoState.serverData}
            onClickCallback={_ =>
                setSubalgoEditMode(subalgoState.name, algorithmTypes.SUBALGO_MODE_EDIT_PARAMS)
            }
            editMode={subalgoState.editMode}
        />
    ));

    // If we aren't focusing on single a subalgo, either display the whole panel of previews or the general algorithm help.
    const selectedSubalgo = subalgoStates.find(subalgo => subalgo.editMode);
    if (!selectedSubalgo)
        return (
            <React.Fragment>
                <div className="preview-title">
                    <div className="title">
                        {helpModeState.active ? `Help: ${algoVerb}` : "Choose a Clustering Method"}
                    </div>
                    <button
                        onClick={_ =>
                            setHelpModeState({
                                active: !helpModeState.active,
                                textContent: helpModeState.textContent
                            })
                        }
                    >
                        {helpModeState.active ? "exit help" : "help"}
                    </button>
                </div>
                <div className="algo-container">
                    {helpModeState.active ? (
                        <AlgorithmHelpContent
                            algo={algorithm}
                            helpModeState={helpModeState}
                            updateTextContent={textContent =>
                                setHelpModeState({ active: helpModeState.active, textContent })
                            }
                            guidancePath="clustering_page:general_clustering"
                        />
                    ) : (
                        subalgoPreviews
                    )}
                </div>
            </React.Fragment>
        );

    // Render the subalgo edit mode if a subalgo is in an edit state
    switch (selectedSubalgo.editMode) {
        case algorithmTypes.SUBALGO_MODE_EDIT_PARAMS:
            return (
                <SubalgoEditParams
                    previewPlot={subalgoPreviews.find(
                        preview => preview.key === selectedSubalgo.name
                    )}
                    setMode={setSubalgoEditMode}
                    algo={algorithm}
                    subalgoState={selectedSubalgo}
                    changeParam={changeParam}
                />
            );
        case algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS:
            return (
                <SubalgoEditOutputs
                    previewPlot={subalgoPreviews.find(
                        preview => preview.key === selectedSubalgo.name
                    )}
                    setMode={setSubalgoEditMode}
                    algo={algorithm}
                    subalgoState={selectedSubalgo}
                    changeOutputParam={changeOutputParam}
                />
            );
    }
}

export default ClusterAlgorithm;
