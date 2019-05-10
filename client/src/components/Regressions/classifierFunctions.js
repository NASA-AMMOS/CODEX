// Utility functions for classifiers

import * as actionTypes from "constants/actionTypes";
import * as utils from "utils/utils";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

export function getEta(classifier, selectedFeatures, numFeatures) {
    const request = {
        routine: "time",
        algorithmType: "classification",
        algorithmName: classifier,
        numSamples: selectedFeatures.length,
        numFeatures: numFeatures
    };

    return utils.makeSimpleRequest(request);
}

export function createRange(params) {
    const min =
        params.find(p => p.name === "min").value || params.find(p => p.name === "min").default;
    const max =
        params.find(p => p.name === "max").value || params.find(p => p.name === "max").default;
    const step =
        params.find(p => p.name === "step").value || params.find(p => p.name === "step").default;
    const valueList = [];
    for (let i = min; i <= max; i += step) {
        valueList.push(i);
    }
    return valueList;
}
