import Immutable from "immutable";

export const CLUSTER_ALGORITHM = "Cluster";

export const ALGORITHM_TYPES = [CLUSTER_ALGORITHM];

export const DOWNSAMPLE_FACTOR = 15;
export const K_FACTOR = 3;
export const EPS = 0.7;
export const QUANTILE = 0.5;
export const DAMPING = 0.9;
export const N_NEIGHBORS = 5;

export const SUBALGORITHMS = {
    [CLUSTER_ALGORITHM]: [
        {
            name: "Mini Batch K-Means",
            simplename: "kmeans",
            parameters: [
                {
                    name: "k",
                    title: "Number of Clusters",
                    inputType: "number",
                    min: 2,
                    value: 3,
                    max: 6,
                    step: 1
                }
            ]
        },
        {
            name: "Affinity Propagation",
            simplename: "affinity_propagation",
            parameters: [
                {
                    name: "damping",
                    title: "Damping",
                    inputType: "number",
                    min: 0.5,
                    value: 0.5,
                    max: 0.96,
                    step: 0.05
                }
            ]
        },
        {
            name: "Mean Shift",
            simplename: "mean_shift",
            parameters: [
                {
                    name: "quantile",
                    title: "Quantile",
                    inputType: "number",
                    min: 0.1,
                    value: 0.5,
                    max: 1.0,
                    step: 0.1
                }
            ]
        },
        {
            name: "Spectral",
            simplename: "spectral",
            parameters: [
                {
                    name: "k",
                    title: "Number of Clusters",
                    inputType: "number",
                    min: 2,
                    value: 3,
                    max: 6,
                    step: 1
                }
            ]
        },
        {
            name: "Ward",
            simplename: "ward",
            parameters: [
                {
                    name: "n_neighbors",
                    title: "Number of Neighbors",
                    inputType: "number",
                    min: 5,
                    value: 5,
                    max: 25,
                    step: 5
                },
                {
                    name: "k",
                    title: "Number of Clusters",
                    inputType: "number",
                    min: 2,
                    value: 3,
                    max: 6,
                    step: 1
                }
            ]
        },
        {
            name: "Agglomerative",
            simplename: "agglomerative",
            parameters: [
                {
                    name: "n_neighbors",
                    title: "Number of Neighbors",
                    inputType: "number",
                    min: 2,
                    value: 3,
                    max: 10,
                    step: 1
                }
            ]
        },
        {
            name: "DBSCAN",
            simplename: "dbscan",
            parameters: [
                {
                    name: "eps",
                    title: "Eps",
                    inputType: "number",
                    min: 0.2,
                    value: 0.7,
                    max: 1.0,
                    step: 0.1
                }
            ]
        },
        {
            name: "Birch",
            simplename: "birch",
            parameters: [
                {
                    name: "k",
                    title: "Number of Clusters",
                    inputType: "number",
                    min: 2,
                    value: 3,
                    max: 10,
                    step: 1
                }
            ]
        }
    ]
};

export const SUBALGO_MODE_EDIT_PARAMS = "SUBALGO_MODE_EDIT_PARAMS";
export const SUBALGO_MODE_EDIT_OUTPUTS = "SUBALGO_MODE_EDIT_OUTPUTS";
