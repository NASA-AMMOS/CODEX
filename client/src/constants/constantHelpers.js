
/*
    Creates a list of objects that are used to create the forms for ranges 
*/
export function createRange(min, max, stepSize, type) {

    let minObj = {
                    type: type,
                    name: "min",
                    label: "Min parameter label",
                    default: min,
                    min: min,
                    max: max,
                    helperText: min + " or higher"
    };

    let maxObj = {
                    type: type,
                    name: "max",
                    label: "Max parameter label",
                    default: 100,
                    min: min,
                    max: max,
                    helperText: "Up to 100"
    };

    let stepSizeObj = {
                    type: type,
                    name: "step",
                    label: "Step size",
                    default: stepSize,
                    min: min,
                    max: max,
                    helperText: "Between " + min + " and " + max
    };

    return [minObj, maxObj, stepSizeObj];
}