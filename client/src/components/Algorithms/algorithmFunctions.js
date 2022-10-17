import urljoin from "url-join";
import WorkerSocket from "worker-loader!../../workers/socket.worker";

import { getGlobalSessionKey } from "../../utils/utils";
import * as actionTypes from "../../constants/actionTypes";

// Creates an object (that will later be turned into JSON) for requesting subalgo data from the server
function buildSubalgoServerRequest(
    subalgo,
    selectedFeatures,
    filename,
    parameters,
    downsampled,
    dataSelections,
    excludeDataSelections
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
            id: "dev0",
        },
        parameters,
        dataSelections,
        excludeDataSelections,
        downsampled,
    };
}

// Gets a full-res subalgo computation
export function getSubAlgorithmData(
    subalgo,
    selectedFeatures,
    filename,
    downsampled,
    dataSelections,
    excludeDataSelections,
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
        dataSelections,
        excludeDataSelections
    );

    const requestObject = {};
    console.log(
        JSON.stringify({
            action: actionTypes.GET_ALGORITHM_DATA,
            request,
        })
    );

    const SERVER_URL = process.env.CODEX_SERVER_URL || urljoin(self.location.href, "../server");

    const abortController = new AbortController();
    const algoUrl = SERVER_URL + "/api/algorithm";
    fetch(algoUrl, {
        method: "POST",
        body: JSON.stringify(request),
        headers: { "Content-type": "application/json" },
        signal: abortController.signal,
    })
        .then(data => data.json())
        .then(json => {
            json.algorithmName = request.algorithmName;
            dataCallback(json);
        });

    // const socketWorker = new WorkerSocket();

    // socketWorker.addEventListener("message", e => {
    //     const inMsg = JSON.parse(e.data);

    //     inMsg.algorithmName = request.algorithmName;
    //     dataCallback(inMsg);
    // });

    // socketWorker.postMessage(
    //     JSON.stringify({
    //         action: actionTypes.GET_ALGORITHM_DATA,
    //         request
    //     })
    // );

    requestObject.closeSocket = _ => {
        console.log(abortController);
        abortController.abort();
    };

    return requestObject;
}
