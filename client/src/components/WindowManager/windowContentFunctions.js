import React from "react";

import ClusterAlgorithm from "../Algorithms/ClusterAlgorithm";
import Correlation from "../Correlation/Correlation";
import Debugger from "../Debug/Debug";
import DimensionalityReduction from "../DimensionalityReduction/DimensionalityReduction";
import ExplainThis from "../ExplainThis/ExplainThis";
import Filter from "../Filter/Filter";
import FindMoreLikeThis from "../FindMoreLikeThis/FindMoreLikeThis";
import GeneralClassifier from "../GeneralClassifier/GeneralClassifier";
import GraphWindow from "../Graphs/GraphWindow";
import Normalization from "../Normalization/Normalization";
import PeakDetection from "../PeakDetection/PeakDetection";
import QualityScan from "../QualityScan/QualityScan";
import Regression from "../Regression/Regression";
import Table from "../Table/Table";
import TemplateScan from "../TemplateScan/TemplateScan";
import Transform from "../Transform/Transform";
import DialogBox from "../DialogBox/DialogBox";
import * as algorithmTypes from "../../constants/algorithmTypes";
import * as uiTypes from "../../constants/uiTypes";
import * as windowTypes from "../../constants/windowTypes";
import * as workflowTypes from "../../constants/workflowTypes";

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
        case windowTypes.PEAK_DETECTION_WINDOW:
            return <PeakDetection />;
        case windowTypes.TEMPLATE_SCAN_WINDOW:
            return <TemplateScan />;
        case windowTypes.REGRESSION_WINDOW:
            return <Regression />;
        case windowTypes.CORRELATION_WINDOW:
            return <Correlation />;
        case windowTypes.DIALOG_BOX:
            return <DialogBox />;
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
