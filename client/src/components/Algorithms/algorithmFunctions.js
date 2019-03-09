import * as algorithmTypes from "constants/algorithmTypes";
import * as actionTypes from "constants/actionTypes";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

// Creates an object (that will later be turned into JSON) for requesting subalgo data from the server
function buildSubalgoServerRequest(subalgo, selectedFeatures, filename, parameters) {
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
        parameters
    };
}

export function getAlgorithmData(algorithm, selectedFeatures, filename, dataCallback) {
    const requests = algorithmTypes.SUBALGORITHMS[algorithm].map(subalgo => {
        const parameters = Object.assign(
            {
                downsampled: true,
                k: algorithmTypes.K_FACTOR,
                eps: algorithmTypes.EPS,
                quantile: algorithmTypes.QUANTILE,
                damping: algorithmTypes.DAMPING,
                n_neighbors: algorithmTypes.N_NEIGHBORS
            },
            subalgo.parameters[0]
        );
        return buildSubalgoServerRequest(subalgo, selectedFeatures, filename, parameters);
    });

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

// Gets a full-res subalgo computation
export function getSubAlgorithmData(
    subalgo,
    selectedFeatures,
    filename,
    dataCallback,
    downsampled
) {
    const parameters = subalgo.parameters.reduce(
        (acc, param) => Object.assign(acc, { [param.name]: param.value }),
        { downsampled }
    );
    const request = buildSubalgoServerRequest(subalgo, selectedFeatures, filename, parameters);

    const requestObject = {};
    const socketWorker = new WorkerSocket();

    socketWorker.addEventListener("message", e => {
        const inMsg = JSON.parse(e.data);

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
}
