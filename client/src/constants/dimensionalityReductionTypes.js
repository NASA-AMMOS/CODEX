import * as constantHelpers from "./constantHelpers";

export const DIMENSIONALITY_REDUCTION_RESULTS_WINDOW = "DIMENSIONALITY_REDUCTION_RESULTS_WINDOW";

export const PCA = "PCA";
export const ICA = "ICA";

export const DIMENSIONALITY_REDUCTION_TYPES = [PCA, ICA];

export const HUMAN_NAMES = {
    [PCA]: "Principal Component Analysis",
    [ICA]: "Independent Component Analysis"
};

export const DIMENSIONALITY_REDUCTION_PARAMS = {
    [PCA]: [
        {
            name: "n_components",
            mode: "value",
            subParams: [
                {
                    type: "int",
                    name: "val",
                    label: "Number of Components",
                    default: 0,
                    min: 0,
                    max: 0,
                    helperText: ""
                }
            ]
        }
    ],
    [ICA]: [
        {
            name: "n_components",
            mode: "value",
            subParams: [
                {
                    type: "int",
                    name: "val",
                    label: "Number of Components",
                    default: 0,
                    min: 0,
                    max: 0,
                    helperText: ""
                }
            ]
        }
    ]
};
