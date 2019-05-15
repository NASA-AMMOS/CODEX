import * as uiTypes from "constants/uiTypes";
import * as algorithmTypes from "constants/algorithmTypes";
import * as classifierTypes from "constants/classifierTypes";
import * as regressionTypes from "constants/regressionTypes";

export const initialSizes = {
    [uiTypes.SCATTER_GRAPH]: {
        width: 300,
        height: 300,
        resizable: true
    },
    [uiTypes.CONTOUR_GRAPH]: {
        width: 300,
        height: 300,
        resizable: true
    },
    [algorithmTypes.CLUSTER_ALGORITHM]: {
        width: 900,
        height: 600,
        resizable: false
    },
    [classifierTypes.CLASSIFIER_WINDOW]: {
        width: 850,
        height: 600,
        resizable: false
    },
    [classifierTypes.CLASSIFIER_RESULTS_WINDOW]: {
        width: 700,
        height: 700
    },
    [uiTypes.SESSIONS_WINDOW]: {
        width: 500,
        height: 500,
        resizable: true
    },
    [regressionTypes.REGRESSION_WINDOW]: {
        width: 850,
        height: 600,
        resizable: false
    },
    [regressionTypes.REGRESSION_RESULTS_WINDOW]: {
        width: 700,
        height: 700,
        resizable: true
    }
};
