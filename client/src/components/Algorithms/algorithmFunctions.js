import * as algorithmTypes from "constants/algorithmTypes";
import * as actionTypes from "constants/actionTypes";
import { getGlobalSessionKey } from "utils/utils";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

// Creates an object (that will later be turned into JSON) for requesting subalgo data from the server
function buildSubalgoServerRequest(
    subalgo,
    selectedFeatures,
    filename,
    parameters,
    downsampled,
    dataSelections
) {
    return {
        routine: "algorithm",
        algorithmType: "clustering",
        algorithmName: subalgo.simplename,
        dataFeatures: selectedFeatures.toJS(),
        file: filename,
        sessionkey: getGlobalSessionKey(),
        guidance: null,
        identification: {
            id: "dev0"
        },
        parameters,
        dataSelections: [],
        downsampled
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
        {}
    );
    const request = buildSubalgoServerRequest(
        subalgo,
        selectedFeatures,
        filename,
        parameters,
        downsampled,
        dataSelections
    );

    console.log(request);
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
