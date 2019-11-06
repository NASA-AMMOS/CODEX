import React from "react";

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
import * as classificationRegressionTypes from "constants/classificationRegressionTypes";
import * as uiTypes from "constants/uiTypes";
import DimensionalityReduction from "components/DimensionalityReduction/DimensionalityReduction";
import * as dimensionalityReductionTypes from "constants/dimensionalityReductionTypes";
import * as workflowTypes from "constants/workflowTypes";
import ExplainThis from "components/ExplainThis/ExplainThis";
import GeneralClassifier from "components/GeneralClassifier/GeneralClassifier";
import Filter from "components/Filter/Filter";
import * as windowTypes from "constants/windowTypes";
import Debugger from "components/Debug/Debug";
import Table from "components/Table/Table";
import Transform from "components/Transform/Transform";
import QualityScan from "components/QualityScan/QualityScan";
import SingleXMultipleYGraph from "components/Graphs/SingleXMultipleYGraph";

export function getWindowContent(win) {
    switch (win.get("windowType")) {
        case uiTypes.SCATTER_GRAPH:
            return <ScatterGraph data={win.get("data")} />;
        case uiTypes.CONTOUR_GRAPH:
            return <ContourGraph data={win.get("data")} />;
        case uiTypes.TIME_SERIES_GRAPH:
            return <TimeSeriesGraph data={win.get("data")} />;
        case uiTypes.HEATMAP_GRAPH:
            return <HeatmapGraph data={win.get("data")} />;
        case uiTypes.BOX_PLOT_GRAPH:
            return <BoxPlotGraph data={win.get("data")} />;
        case uiTypes.VIOLIN_PLOT_GRAPH:
            return <ViolinPlotGraph data={win.get("data")} />;
        case uiTypes.HISTOGRAM_GRAPH:
            return <HistogramGraph data={win.get("data")} />;
        case algorithmTypes.CLUSTER_ALGORITHM:
            return (
                <ClusterAlgorithm
                    filename={win.get("filename")}
                    winId={win.get("id")}
                    selectedFeatures={win.get("selectedFeatures")}
                />
            );
        case classificationRegressionTypes.REGRESSION_WINDOW:
            return (
                <RegressionsOverview
                    selectedFeatures={win.get("selectedFeatures")}
                    selectedFeatureLength={win.get("selectedFeatureLength")}
                    winId={win.get("id")}
                />
            );
        case classificationRegressionTypes.REGRESSION_RESULTS_WINDOW:
            return (
                <RegressionResults
                    requests={win.get("requests")}
                    runParams={win.get("runParams")}
                />
            );
        case uiTypes.SESSIONS_WINDOW:
            return <Sessions />;
        case windowTypes.DIMENSIONALITY_REDUCTION_WINDOW:
            return <DimensionalityReduction />;
        case workflowTypes.EXPLAIN_THIS_WINDOW:
            return <ExplainThis winId={win.get("id")} />;
        case workflowTypes.FIND_MORE_LIKE_THIS_WINDOW:
            return <FindMoreLikeThis winId={win.get("id")} />;
        case workflowTypes.GENERAL_CLASSIFIER_WINDOW:
            return <GeneralClassifier winId={win.get("id")} />;
        case workflowTypes.FILTER_WINDOW:
            return <Filter />;
        case windowTypes.DEBUG_WINDOW:
            return <Debugger />;
        case windowTypes.TABLE_WINDOW:
            return <Table />;
        case windowTypes.TRANSFORM_WINDOW:
            return <Transform />;
        case windowTypes.QUALITY_SCAN_WINDOW:
            return <QualityScan data={win.get("data")} />;
        case windowTypes.SINGLE_X_MULTIPLE_Y:
            return <SingleXMultipleYGraph data={win.get("data")} />;
        default:
            return (
                <p>
                    Something has gone wrong, window type <code>{win.get("windowType")}</code> does
                    not have an registered associated component!
                </p>
            );
    }
}

export function previewAllowed(win) {
    switch (win.get("windowType")) {
        case algorithmTypes.CLUSTER_ALGORITHM:
        case algorithmTypes.ALGO_LOADING_WINDOW:
            return false;
        default:
            return true;
    }
}
