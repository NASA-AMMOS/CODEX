import React, { useState, useEffect } from "react";

import { getAlgorithmData } from "components/Algorithms/algorithmFunctions";
import * as algorithmTypes from "constants/algorithmTypes";

function ClusterAlgorithm(props) {
    const algorithm = algorithmTypes.CLUSTER_ALGORITHM;

    const [loadingStates, setLoadingStates] = useState(
        algorithmTypes.SUBALGORITHMS[algorithm].map(subalgo => {
            return { name: subalgo.simplename, loaded: false };
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
                            ? Object.assign(subalgo, { loaded: true })
                            : subalgo
                    )
                );
            }
        );

        return () => {
            algorithmRequests.forEach(req => req.closeSocket());
        };
    }, []);

    return (
        <div>
            {loadingStates
                .filter(subalgo => subalgo.loaded)
                .map(subalgo => (
                    <div key={subalgo.name}>{subalgo.name}</div>
                ))}
        </div>
    );
}

export default ClusterAlgorithm;
