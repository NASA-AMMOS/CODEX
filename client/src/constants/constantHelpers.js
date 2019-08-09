/*
    Creates a list of objects that are used to create the forms for ranges 
*/
export function createRange({ min, defaultMin, max, defaultMax, stepSize, type, allowNull }) {
    const nullLabel = allowNull ? " (can be null)" : "";
    let minObj = {
        type: type,
        name: "min",
        label: "Min parameter label",
        value: defaultMin === null ? "" : defaultMin,
        min: min,
        max: max,
        helperText: min + " or higher" + nullLabel
    };

    let maxObj = {
        type: type,
        name: "max",
        label: "Max parameter label",
        value: defaultMax === null ? "" : defaultMax,
        min: min,
        max: max,
        helperText: `Up to ${max}` + nullLabel
    };

    let stepSizeObj = {
        type: type,
        name: "step",
        label: "Step size",
        value: stepSize,
        min: min,
        max: max,
        helperText: "Between " + min + " and " + max
    };

    return [minObj, maxObj, stepSizeObj];
}
