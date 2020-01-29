import React from "react";

import ClusterAlgorithm from "components/Algorithms/ClusterAlgorithm";
import ContourGraph from "components/Graphs/ContourGraph";
import ViolinPlotGraph from "components/Graphs/ViolinPlotGraph";
import RegressionResults from "components/Regressions/RegressionResults";
import RegressionsOverview from "components/Regressions/RegressionsOverview";
import ScatterGraph from "components/Graphs/ScatterGraph";
import HeatmapGraph from "components/Graphs/HeatmapGraph";
import HeatmapGraph3d from "components/Graphs/HeatmapGraph3d";
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
import MapGraph from "components/Graphs/MapGraph";
import GraphWindow from "components/Graphs/GraphWindow";
import Normalization from "components/Normalization/Normalization";

export function getWindowContent(win) {
    // Graphs get handled by the separate graph handler, as the graph type isn't fixed to the window.
    if (windowTypes.graphs.includes(win.get("windowType")))
        return <GraphWindow data={win.get("data")} windowType={win.get("windowType")} />;

    switch (win.get("windowType")) {
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
        case windowTypes.NORMALIZATION_WINDOW:
            return <Normalization />;

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
