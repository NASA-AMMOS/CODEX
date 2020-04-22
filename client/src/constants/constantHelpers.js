/*
    Creates a list of objects that are used to create the forms for ranges 
*/

export const LARGER_OR_EQUAL_TO_ZERO = "LARGER_OR_EQUAL_TO_ZERO";
export const LARGER_THAN_ZERO = "LARGER_THAN_ZERO";

function formatHelperText(value) {
    console.log(LARGER_THAN_ZERO);
    switch (value) {
        case LARGER_THAN_ZERO:
            return "Greater than 0";
        case LARGER_OR_EQUAL_TO_ZERO:
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
