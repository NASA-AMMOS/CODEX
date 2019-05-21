import * as uiTypes from "constants/uiTypes";
import * as algorithmTypes from "constants/algorithmTypes";
import * as classifierTypes from "constants/classifierTypes";
import * as regressionTypes from "constants/regressionTypes";
import * as dimensionalityReductionTypes from "constants/dimensionalityReductionTypes";
import * as workflowTypes from "constants/workflowTypes";

export const initialSizes = {
    [uiTypes.SCATTER_GRAPH]: {
        width: 300,
        height: 300,
        resizeable: true
    },
    [uiTypes.CONTOUR_GRAPH]: {
        width: 300,
        height: 300,
        resizeable: true
    },
    [uiTypes.TIME_SERIES_GRAPH]: {
        width: 500,
        height: 400,
        resizeable: true
    },
    [algorithmTypes.CLUSTER_ALGORITHM]: {
        width: 900,
        height: 600,
        resizeable: false
    },
    [classifierTypes.CLASSIFIER_WINDOW]: {
        width: 850,
        height: 600,
        resizeable: false
    },
    [classifierTypes.CLASSIFIER_RESULTS_WINDOW]: {
        width: 700,
        height: 700,
        resizeable: false
    },
    [uiTypes.SESSIONS_WINDOW]: {
        width: 500,
        height: 500,
        resizeable: true
    },
    [regressionTypes.REGRESSION_WINDOW]: {
        width: 850,
        height: 600,
        minSize: {
            width: 750,
            height: 500
        },
        resizeable: true
    },
    [regressionTypes.REGRESSION_RESULTS_WINDOW]: {
        width: 700,
        height: 700,
        resizeable: false
    },
    [dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_WINDOW]: {
        width: 700,
        height: 500,
        resizable: true
    },
    [dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_RESULTS_WINDOW]: {
        width: 700,
        height: 375,
        resizeable: true
    },
    [workflowTypes.EXPLAIN_THIS]: {
        width: 700,
        height: 500,
        resizeable: true
    }
};
