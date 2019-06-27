import React from "react";

import ClassificationResults from "components/Classification/ClassificationResults";
import ClassificationOverview from "components/Classification/ClassificationOverview";
import ClusterAlgorithm from "components/Algorithms/ClusterAlgorithm";
import ContourGraph from "components/Graphs/ContourGraph";
import ViolinPlotGraph from "components/Graphs/ViolinPlotGraph";
import RegressionResults from "components/Regressions/RegressionResults";
import RegressionsOverview from "components/Regressions/RegressionsOverview";
import ScatterGraph from "components/Graphs/ScatterGraph";
import HeatmapGraph from "components/Graphs/HeatmapGraph";
import BoxPlotGraph from "components/Graphs/BoxPlotGraph";
import HistogramGraph from "components/Graphs/HistogramGraph";
import FindMoreLikeThis from "components/FindMoreLikeThis/FindMoreLikeThis";
import Sessions from "components/Sessions/Sessions";
import TimeSeriesGraph from "components/Graphs/TimeSeriesGraph";
import * as algorithmTypes from "constants/algorithmTypes";
import * as classificationTypes from "constants/classificationTypes";
import * as regressionTypes from "constants/regressionTypes";
import * as uiTypes from "constants/uiTypes";
import DimensionalityReductionResults from "components/DimensionalityReduction/DimensionalityReductionResults";
import * as dimensionalityReductionTypes from "constants/dimensionalityReductionTypes";
import * as workflowTypes from "constants/workflowTypes";
import ExplainThis from "components/ExplainThis/ExplainThis";
import Filter from "components/Filter/Filter";
import * as windowTypes from "constants/windowTypes";
import Debugger from "components/Debug/Debug";

export function getWindowContent(win) {
    switch (win.windowType) {
        case uiTypes.SCATTER_GRAPH:
            return <ScatterGraph data={win.data} />;
        case uiTypes.CONTOUR_GRAPH:
            return <ContourGraph data={win.data} />;
        case uiTypes.TIME_SERIES_GRAPH:
            return <TimeSeriesGraph data={win.data} />;
        case uiTypes.HEATMAP_GRAPH:
            return <HeatmapGraph data={win.data} />;
        case uiTypes.BOX_PLOT_GRAPH:
            return <BoxPlotGraph data={win.data} />;
        case uiTypes.VIOLIN_PLOT_GRAPH:
            return <ViolinPlotGraph data={win.data} />;
        case uiTypes.HISTOGRAM_GRAPH:
            return <HistogramGraph data={win.data} />;
        case algorithmTypes.CLUSTER_ALGORITHM:
            return (
                <ClusterAlgorithm
                    filename={win.filename}
                    winId={win.id}
                    selectedFeatures={win.selectedFeatures}
                />
            );
        case classificationTypes.CLASSIFICATION_WINDOW:
            return (
                <ClassificationOverview
                    selectedFeatures={win.selectedFeatures}
                    selectedFeatureLength={win.selectedFeatureLength}
                    winId={win.id}
                />
            );
        case classificationTypes.CLASSIFICATION_RESULTS_WINDOW:
            return <ClassificationResults requests={win.requests} runParams={win.runParams} />;
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
        case dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_RESULTS_WINDOW:
            return (
                <DimensionalityReductionResults requests={win.requests} runParams={win.runParams} />
            );
        case workflowTypes.EXPLAIN_THIS_WINDOW:
            return <ExplainThis winId={win.id} />;
        case workflowTypes.FIND_MORE_LIKE_THIS_WINDOW:
            return <FindMoreLikeThis winId={win.id} />;
        case workflowTypes.FILTER_WINDOW:
            return <Filter />;
        case windowTypes.DEBUG_WINDOW:
            return <Debugger />;
    }
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
