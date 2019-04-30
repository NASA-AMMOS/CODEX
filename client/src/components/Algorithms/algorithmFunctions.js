import * as algorithmTypes from "constants/algorithmTypes";
import * as actionTypes from "constants/actionTypes";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

// Creates an object (that will later be turned into JSON) for requesting subalgo data from the server
function buildSubalgoServerRequest(
    subalgo,
    selectedFeatures,
    filename,
    parameters,
    dataSelections
) {
    return {
        routine: "algorithm",
        algorithmType: "clustering",
        algorithmName: subalgo.simplename,
        dataFeatures: selectedFeatures,
        file: filename,
        guidance: null,
        identification: {
            id: "dev0"
        },
        parameters,
        dataSelections: dataSelections.map(({ name, color }) => {
            return { name, color, emphasize: false };
        })
    };
}

// Gets a full-res subalgo computation
export function getSubAlgorithmData(
    subalgo,
    selectedFeatures,
    filename,
    downsampled,
    dataSelections,
    dataCallback
) {
    const parameters = subalgo.parameters.reduce(
        (acc, param) => Object.assign(acc, { [param.name]: param.value }),
        { downsampled }
    );
    const request = buildSubalgoServerRequest(
        subalgo,
        selectedFeatures,
        filename,
        parameters,
        dataSelections
    );

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
