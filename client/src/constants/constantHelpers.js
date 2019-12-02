import * as classificationRegressionTypes from "constants/classificationRegressionTypes";

/*
    Creates a list of objects that are used to create the forms for ranges 
*/

function formatHelperText(value) {
    switch (value) {
        case classificationRegressionTypes.LARGER_THAN_ZERO:
            return "Greater than 0";
        case classificationRegressionTypes.LARGER_OR_EQUAL_TO_ZERO:
            return "0 or larger";
    }
    return null;
}

export function createRange({ min, defaultMin, max, defaultMax, stepSize, type, allowNull }) {
    const nullLabel = allowNull ? " (can be null)" : "";
    let minObj = {
        type: type,
        name: "min",
        label: "Min parameter label",
        value: defaultMin === null ? "" : defaultMin,
        min: min,
        max: max,
        helperText: (formatHelperText(min) || min + " or higher") + nullLabel
    };

    let maxObj = {
        type: type,
        name: "max",
        label: "Max parameter label",
        value: defaultMax === null ? "" : defaultMax,
        min: min,
        max: max,
        helperText: (formatHelperText(max) || `Up to ${max}`) + nullLabel
    };

    let stepSizeObj = {
        type: type,
        name: "step",
        label: "Step size",
        value: stepSize,
        min: min,
        max: max,
        helperText: formatHelperText(max) || "Between " + min + " and " + max
    };

    return [minObj, maxObj, stepSizeObj];
}
