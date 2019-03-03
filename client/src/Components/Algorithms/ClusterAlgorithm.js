import React, { useState, useEffect } from "react";
import ReactEcharts from "echarts-for-react";
import echartsgl from "echarts-gl";
import { getAlgorithmData } from "components/Algorithms/algorithmFunctions";
import * as algorithmTypes from "constants/algorithmTypes";
import { makeSimpleScatterPlot } from "components/Algorithms/algorithmChartFunctions";
import "components/Algorithms/algorithmStyles.css";

function ClusterAlgorithm(props) {
    const algorithm = algorithmTypes.CLUSTER_ALGORITHM;

    const [loadingStates, setLoadingStates] = useState(
        algorithmTypes.SUBALGORITHMS[algorithm].map(subalgo => {
            return {
                name: subalgo.simplename,
                loaded: false,
                serverData: null
            };
        })
    );

    useEffect(_ => {
        const algorithmRequests = getAlgorithmData(
            algorithm,
            props.selectedFeatures,
            props.filename,
            inMsg => {
                setLoadingStates(
                    loadingStates.map(subalgo =>
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
        <div className="subalgo_container">
            {loadingStates.map(algorithmChartFunctions.makeSubalgoPlot)}
        </div>
    );
}

export default ClusterAlgorithm;
