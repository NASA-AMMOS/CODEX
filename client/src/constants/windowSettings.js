import * as uiTypes from "constants/uiTypes";
import * as algorithmTypes from "constants/algorithmTypes";
import * as classifierTypes from "constants/classifierTypes";

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
        width: 500,
        height: 500,
        resizeable: true
    }
};
