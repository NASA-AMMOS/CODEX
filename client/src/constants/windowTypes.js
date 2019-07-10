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

// classificationTypes
export const CLASSIFICATION_WINDOW = "CLASSIFICATION_WINDOW";
export const CLASSIFICATION_LOADING_WINDOW = "CLASSIFICATION_LOADING_WINDOW";
export const CLASSIFICATION_RESULTS_WINDOW = "CLASSIFICATION_RESULTS_WINDOW";

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
export const graphs = [
    SCATTER_GRAPH,
    CONTOUR_GRAPH,
    VIOLIN_PLOT_GRAPH,
    TIME_SERIES_GRAPH,
    HEATMAP_GRAPH,
    BOX_PLOT_GRAPH,
    HISTOGRAM_GRAPH
];

export const SESSIONS_WINDOW = "SESSIONS_WINDOW";

// workflowTypes
export const EXPLAIN_THIS_WINDOW = "EXPLAIN_THIS_WINDOW";
export const GENERAL_CLASSIFIER_WINDOW = "GENERAL_CLASSIFIER_WINDOW";
export const FILTER_WINDOW = "FILTER_WINDOW";
export const FIND_MORE_LIKE_THIS_WINDOW = "FIND_MORE_LIKE_THIS_WINDOW";
export const TABLE_WINDOW = "TABLE_WINDOW";
export const workflows = [
    EXPLAIN_THIS_WINDOW,
    FILTER_WINDOW,
    FIND_MORE_LIKE_THIS_WINDOW,
    TABLE_WINDOW
];
