import * as uiTypes from "constants/uiTypes";
import * as algorithmTypes from "constants/algorithmTypes";
import * as classifierTypes from "constants/classifierTypes";
import * as regressionTypes from "constants/regressionTypes";

export const initialSizes = {
    [uiTypes.SCATTER_GRAPH]: {
        width: 300,
        height: 300,
        resizeable: true
    },
    [uiTypes.HEATMAP_GRAPH]: {
        width: 300,
        height: 300,
        resizeable: true
    },
    [algorithmTypes.CLUSTER_ALGORITHM]: {
        width: 900,
        height: 600,
        resizeable: false
    },
    [classifierTypes.CLASSIFIER_WINDOW]: {
        width: 750,
        height: 500,
        resizeable: true
    },
    [classifierTypes.CLASSIFIER_RESULTS_WINDOW]: {
        width: 700,
        height: 700,
        resizeable: true
    },
    [regressionTypes.REGRESSION_WINDOW]: {
        width: 750,
        height: 500,
        resizeable: true
    },
    [regressionTypes.REGRESSION_RESULTS_WINDOW]: {
        width: 700,
        height: 700,
        resizeable: true
    }
};
