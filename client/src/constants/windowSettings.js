import * as uiTypes from "constants/uiTypes";
import * as algorithmTypes from "constants/algorithmTypes";

export const initialSizes = {
    [uiTypes.SCATTER_GRAPH]: {
        width: 400,
        height: 400,
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
    }
};
