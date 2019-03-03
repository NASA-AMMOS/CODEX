import React, { useState, useEffect } from "react";
import ReactEcharts from "echarts-for-react";
import echartsgl from "echarts-gl";
import { getAlgorithmData } from "components/Algorithms/algorithmFunctions";
import * as algorithmTypes from "constants/algorithmTypes";
import SubalgoChart from "components/Algorithms/SubalgoChart";
import "components/Algorithms/algorithmStyles.scss";

function selectAlgorithm(subalgoStates, setSubalgoStates) {
    setSubalgoStates(subalgoStates.map(subalgo => subalgo));
}

function ClusterAlgorithm(props) {
    const algorithm = algorithmTypes.CLUSTER_ALGORITHM;

    const [subalgoStates, setSubalgoStates] = useState(
        algorithmTypes.SUBALGORITHMS[algorithm].map(subalgo => {
            return {
                name: subalgo.simplename,
                loaded: false,
                serverData: null,
                humanName: subalgo.name
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

    return (
        <div className="algo_container">
            {subalgoStates.map(subalgoState => (
                <SubalgoChart
                    key={subalgoState.name}
                    name={subalgoState.name}
                    humanName={subalgoState.humanName}
                    serverData={subalgoState.serverData}
                    onClickCallback={_ => console.log("click!")}
                />
            ))}
        </div>
    );
}

export default ClusterAlgorithm;
