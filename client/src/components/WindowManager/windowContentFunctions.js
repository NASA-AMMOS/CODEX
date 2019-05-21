import React from "react";

import ClassifierResults from "components/Classifiers/ClassifierResults";
import ClassifiersOverview from "components/Classifiers/ClassifiersOverview";
import ClusterAlgorithm from "components/Algorithms/ClusterAlgorithm";
import ContourGraph from "components/Graphs/ContourGraph";
import RegressionResults from "components/Regressions/RegressionResults";
import RegressionsOverview from "components/Regressions/RegressionsOverview";
import ScatterGraph from "components/Graphs/ScatterGraph";
import Sessions from "components/Sessions/Sessions";
import TimeSeriesGraph from "components/Graphs/TimeSeriesGraph";
import * as algorithmTypes from "constants/algorithmTypes";
import * as classifierTypes from "constants/classifierTypes";
import * as regressionTypes from "constants/regressionTypes";
import * as uiTypes from "constants/uiTypes";
import DimensionalityReductionsOverview from "components/DimensionalityReduction/DimensionalityReductionsOverview";
import DimensionalityReductionResults from "components/DimensionalityReduction/DimensionalityReductionResults";
import * as dimensionalityReductionTypes from "constants/dimensionalityReductionTypes";
import * as workflowTypes from "constants/workflowTypes";
import ExplainThis from "components/ExplainThis/ExplainThis";

export function getWindowTitle(win) {
    switch (win.windowType) {
        case uiTypes.SCATTER_GRAPH:
        case uiTypes.CONTOUR_GRAPH:
        case uiTypes.TIME_SERIES_GRAPH:
            return getMultiAxisGraphTitle(win);
        case algorithmTypes.CLUSTER_ALGORITHM:
            return `Algorithm: ${win.windowType}`;
        case algorithmTypes.ALGO_LOADING_WINDOW:
            return `Loading Algorithm ${
                win.loadingSecRemaining ? "(" + win.loadingSecRemaining + "s)" : ""
            }`;
        case classifierTypes.CLASSIFIER_WINDOW:
            return "Classification";
        case classifierTypes.CLASSIFIER_RESULTS_WINDOW:
            return "Classification Results";
        case regressionTypes.REGRESSION_WINDOW:
            return "Regression";
        case regressionTypes.REGRESSION_RESULTS_WINDOW:
            return "Regression Results";
        case uiTypes.SESSIONS_WINDOW:
            return "Sessions";
        case dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_WINDOW:
            return "Dimensionality Reduction";
        case dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_RESULTS_WINDOW:
            return "Dimensionality Reduction Results";
        case workflowTypes.EXPLAIN_THIS:
            return "Explain This";
        default:
            return "";
    }
}

export function getWindowContent(win) {
    switch (win.windowType) {
        case uiTypes.SCATTER_GRAPH:
            return <ScatterGraph data={win.data} />;
        case uiTypes.CONTOUR_GRAPH:
            return <ContourGraph data={win.data} />;
        case uiTypes.TIME_SERIES_GRAPH:
            return <TimeSeriesGraph data={win.data} />;
        case algorithmTypes.CLUSTER_ALGORITHM:
            return (
                <ClusterAlgorithm
                    filename={win.filename}
                    winId={win.id}
                    selectedFeatures={win.selectedFeatures}
                />
            );
        case classifierTypes.CLASSIFIER_WINDOW:
            return (
                <ClassifiersOverview
                    selectedFeatures={win.selectedFeatures}
                    selectedFeatureLength={win.selectedFeatureLength}
                    winId={win.id}
                />
            );
        case classifierTypes.CLASSIFIER_RESULTS_WINDOW:
            return <ClassifierResults requests={win.requests} runParams={win.runParams} />;
        case regressionTypes.REGRESSION_WINDOW:
            return (
                <RegressionsOverview
                    selectedFeatures={win.selectedFeatures}
                    selectedFeatureLength={win.selectedFeatureLength}
                    winId={win.id}
                />
            );
        case regressionTypes.REGRESSION_RESULTS_WINDOW:
            return <RegressionResults requests={win.requests} runParams={win.runParams} />;
        case uiTypes.SESSIONS_WINDOW:
            return <Sessions />;
        case dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_WINDOW:
            return <DimensionalityReductionsOverview winId={win.id} />;
        case dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_RESULTS_WINDOW:
            return (
                <DimensionalityReductionResults requests={win.requests} runParams={win.runParams} />
            );
        case workflowTypes.EXPLAIN_THIS:
            return (
                <ExplainThis
                    selectedFeatures={win.selectedFeatures}
                    selectedFeaturesLength={win.selectedFeaturesLength}
                    winId={win.id}
                />
            );

    }
}

function getTwoAxisGraphTitle(win) {
    const selectedFeatures = win.data.get("data")[0];
    return `${selectedFeatures[0]} vs ${selectedFeatures[1]}`;
}

function getMultiAxisGraphTitle(win) {
    const selectedFeatures = win.data.get("data")[0];
    let retString = "";

    for (let i = 0; i < selectedFeatures.length - 1; i++) {
        retString = retString + selectedFeatures[i] + " vs ";
    }
    retString = retString + selectedFeatures[selectedFeatures.length - 1];

    return retString;
}

export function previewAllowed(win) {
    switch (win.windowType) {
        case algorithmTypes.CLUSTER_ALGORITHM:
        case algorithmTypes.ALGO_LOADING_WINDOW:
            return false;
        default:
            return true;
    }
}
