import * as actionTypes from "constants/actionTypes";
import * as utils from "utils/utils";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

export function getEta(classifier, selectedFeatures, numFeatures, dataCallback) {
    const request = {
        routine: "time",
        algorithmType: "classification",
        algorithmName: classifier,
        numSamples: selectedFeatures.length,
        numFeatures: numFeatures
    };

    return utils.makeSimpleRequest(request, dataCallback);
}

export function createRange(param) {
    const valueList = [];
    for (let i = param.min; i <= param.max; i += param.step) {
        valueList.push(i);
    }
    return valueList;
}
