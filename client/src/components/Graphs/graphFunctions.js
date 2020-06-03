// Returns a single rgb color interpolation between given rgb color
// based on the factor given; via https://codepen.io/njmcode/pen/axoyD?editors=0010
import { unzip, zip } from "../../utils/utils";

export function interpolateColor(color1, color2, factor) {
    if (arguments.length < 3) {
        factor = 0.5;
    }
    let result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
}

// My function to interpolate between two colors completely, returning an array
export function interpolateColors(color1, color2, steps, scaling) {
    let stepFactor = 1 / steps,
        interpolatedColorArray = [];

    color1 = color1.match(/\d+/g).map(Number);
    color2 = color2.match(/\d+/g).map(Number);

    let percentage = 0.0;

    if (scaling === "log") {
        percentage = 1.0 / Math.pow(10, steps);
    } else {
        //assumed linear
        percentage = 0.0;
    }

    for (let i = 0; i <= steps; i++) {
        const interpolatedColor = interpolateColor(color1, color2, stepFactor * i);
        interpolatedColorArray.push([
            percentage,
            "rgb(" +
                interpolatedColor[0] +
                "," +
                interpolatedColor[1] +
                "," +
                interpolatedColor[2] +
                ")"
        ]);

        if (scaling === "log") {
            percentage *= 10;
        } else {
            //assumed linear
            percentage += 1.0 / steps;
        }
    }

    return interpolatedColorArray;
}

export function filterBounds(features, cols, bounds) {
    if (!bounds) return cols;

    const filtered = zip(cols).map((row, idx) =>
        row.every((val, idx) => {
            const boundsForCol = bounds[features[idx]];
            if (!boundsForCol || (!boundsForCol.min && !boundsForCol.max)) return true;
            return (
                (!boundsForCol.min || boundsForCol.min <= val) &&
                (!boundsForCol.max || boundsForCol.max >= val)
            );
        })
            ? row
            : [null, null]
    );

    return filtered.length
        ? unzip(filtered)
        : Array(features.length) // Use dummy array if nothing has made it through our filters
              .fill(0)
              .map(_ => []);
}

export function filterSingleCol(col, bounds, leaveNull = false) {
    if (!bounds) return col;
    return leaveNull
        ? col.map(val =>
              (!bounds.min || bounds.min <= val) && (!bounds.max || bounds.max >= val) ? val : null
          )
        : col.filter(
              val => (!bounds.min || bounds.min <= val) && (!bounds.max || bounds.max >= val)
          );
}
