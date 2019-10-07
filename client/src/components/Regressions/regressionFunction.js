// Utility functions for classifications

import * as actionTypes from "constants/actionTypes";
import * as utils from "utils/utils";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!workers/socket.worker";

export function getEta(classification, selectedFeatures, numFeatures) {
    const request = {
        routine: "time",
        algorithmType: "classification",
        algorithmName: classification,
        numSamples: selectedFeatures.length,
        numFeatures: numFeatures
    };

    return utils.makeSimpleRequest(request);
}

export function createRange(subParams, allowNull) {
    const minDefault = allowNull ? null : subParams.find(p => p.name === "min").default;
    const maxDefault = allowNull ? null : subParams.find(p => p.name === "max").default;

    const min = subParams.find(p => p.name === "min").value || minDefault;
    const max = subParams.find(p => p.name === "max").value || maxDefault;
    const step =
        subParams.find(p => p.name === "step").value ||
        subParams.find(p => p.name === "step").default;

    if (min === null || max === null) return null;

    const valueList = [];
    for (let i = min; i <= max; i += step) {
        valueList.push(i);
    }
    return valueList;
}
