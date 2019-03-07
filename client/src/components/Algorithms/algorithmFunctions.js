import * as algorithmTypes from "constants/algorithmTypes";
import * as actionTypes from "constants/actionTypes";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

function buildServerRequests(algorithm, selectedFeatures, filename) {
    return algorithmTypes.SUBALGORITHMS[algorithm].map(subalgo => {
        return {
            routine: "algorithm",
            algorithmType: "clustering",
            algorithmName: subalgo.simplename,
            dataFeatures: selectedFeatures,
            dataSelections: [], // TODO: hook this back up
            file: filename,
            guidance: null,
            identification: {
                id: "dev0"
            },
            parameters: Object.assign(
                {
                    downsampled: algorithmTypes.DOWNSAMPLE_FACTOR,
                    k: algorithmTypes.K_FACTOR,
                    eps: algorithmTypes.EPS,
                    quantile: algorithmTypes.QUANTILE,
                    damping: algorithmTypes.DAMPING,
                    n_neighbors: algorithmTypes.N_NEIGHBORS
                },
                subalgo.parameters[0]
            )
        };
    });
}

export function getAlgorithmData(algorithm, selectedFeatures, filename, dataCallback) {
    const requests = buildServerRequests(algorithm, selectedFeatures, filename);

    return requests.map(request => {
        const requestObject = {};
        const socketWorker = new WorkerSocket();

        socketWorker.addEventListener("message", e => {
            const inMsg = JSON.parse(e.data);

            if (inMsg.message !== "success") return; // Not handling in-progress messages right now.

            inMsg.algorithmName = request.algorithmName;
            dataCallback(inMsg);
        });

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.GET_ALGORITHM_DATA,
                request
            })
        );

        requestObject.closeSocket = _ => {
            socketWorker.postMessage(
                JSON.stringify({
                    action: actionTypes.CLOSE_SOCKET
                })
            );
        };

        return requestObject;
    });
}
