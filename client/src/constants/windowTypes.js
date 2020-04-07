export const DEBUG_WINDOW = "DEBUG_WINDOW";

/* pull in:
 *
 * uiTypes
 *
 * algorithmTypes
 * classificationTypes
 * dimensionalityReductionTypes
 * regressionTypes
 * workflowTypes
 */

// algorithmTypes
export const ALGO_LOADING_WINDOW = "ALGO_LOADING_WINDOW";
export const CLUSTER_ALGORITHM = "Cluster";

// dimensionalityReductionTypes
export const DIMENSIONALITY_REDUCTION_WINDOW = "DIMENSIONALITY_REDUCTION_WINDOW";

// regressionTypes
export const REGRESSION_WINDOW = "REGRESSION_WINDOW";
export const REGRESSION_RESULTS_WINDOW = "REGRESSION_RESULTS_WINDOW";

// uiTypes
export const SCATTER_GRAPH = "Scatter";
export const CONTOUR_GRAPH = "Contour";
export const VIOLIN_PLOT_GRAPH = "Violin";
export const TIME_SERIES_GRAPH = "Time Series";
export const HEATMAP_GRAPH = "Heat Map";
export const BOX_PLOT_GRAPH = "Box Plot";
export const HISTOGRAM_GRAPH = "Histogram";
export const SINGLE_X_MULTIPLE_Y = "Single X, Multiple Y";
export const HEATMAP_3D_GRAPH = "3D Heat Map";
export const MAP_GRAPH = "Map Graph";
export const graphs = [
    SCATTER_GRAPH,
    CONTOUR_GRAPH,
    VIOLIN_PLOT_GRAPH,
    TIME_SERIES_GRAPH,
    HEATMAP_GRAPH,
    HEATMAP_3D_GRAPH,
    BOX_PLOT_GRAPH,
    HISTOGRAM_GRAPH,
    SINGLE_X_MULTIPLE_Y,
    MAP_GRAPH
];

export const SESSIONS_WINDOW = "SESSIONS_WINDOW";

// workflowTypes
export const EXPLAIN_THIS_WINDOW = "EXPLAIN_THIS_WINDOW";
export const GENERAL_CLASSIFIER_WINDOW = "GENERAL_CLASSIFIER_WINDOW";
export const FILTER_WINDOW = "FILTER_WINDOW";
export const FIND_MORE_LIKE_THIS_WINDOW = "FIND_MORE_LIKE_THIS_WINDOW";
export const TABLE_WINDOW = "TABLE_WINDOW";
export const TRANSFORM_WINDOW = "TRANSFORM_WINDOW";
export const QUALITY_SCAN_WINDOW = "QUALITY_SCAN_WINDOW";

export const workflows = [
    EXPLAIN_THIS_WINDOW,
    FILTER_WINDOW,
    FIND_MORE_LIKE_THIS_WINDOW,
    TABLE_WINDOW,
    TRANSFORM_WINDOW,
    QUALITY_SCAN_WINDOW
];

export const NORMALIZATION_WINDOW = "NORMALIZATION_WINDOW";
export const PEAK_DETECTION_WINDOW = "PEAK_DETECTION_WINDOW";
export const TEMPLATE_SCAN_WINDOW = "TEMPLATE_SCAN_WINDOW";

export const NUM_FEATURES_REQUIRED = {
    [SCATTER_GRAPH]: 2,
    [CONTOUR_GRAPH]: 2,
    [HEATMAP_GRAPH]: 2,
    [HEATMAP_3D_GRAPH]: 3,
    [MAP_GRAPH]: [2, 3],
    [EXPLAIN_THIS_WINDOW]: [2, false, 1],
    [TABLE_WINDOW]: [1],
    [CLUSTER_ALGORITHM]: [2],
    [DIMENSIONALITY_REDUCTION_WINDOW]: [2],
    [NORMALIZATION_WINDOW]: [1],
    [PEAK_DETECTION_WINDOW]: [1, 1],
    [REGRESSION_WINDOW]: [2],
    [TEMPLATE_SCAN_WINDOW]: [2]
};
