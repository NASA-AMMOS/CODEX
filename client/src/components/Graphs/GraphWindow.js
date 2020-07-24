import React from "react";

import { WindowCircularProgress, WindowError } from "../WindowHelpers/WindowCenter";
import { useGlobalChartState } from "../../hooks/UIHooks";
import {
    useCurrentSelection,
    useFeatureDisplayNames,
    useFileInfo,
    useHoveredSelection,
    usePinnedFeatures,
    useDownsampledFeatures,
    useSavedSelections
} from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import BoxPlotGraph from "./BoxPlotGraph";
import ContourGraph from "./ContourGraph";
import HeatmapGraph from "./HeatmapGraph";
import HeatmapGraph3d from "./HeatmapGraph3d";
import HistogramGraph from "./HistogramGraph";
import MapGraph from "./MapGraph";
import ScatterGraph from "./ScatterGraph";
import SingleXMultipleYGraph from "./SingleXMultipleYGraph";
import TimeSeriesGraph from "./TimeSeriesGraph";
import ViolinPlotGraph from "./ViolinPlotGraph";
import * as windowTypes from "../../constants/windowTypes";

function GraphWindow(props) {
    const win = useWindowManager(props, {
        width: 500,
        height: 500,
        resizeable: true
    });

    // Hooks for relevant global state
    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    const [savedSelections, saveCurrentSelection] = useSavedSelections();
    const [globalChartState, setGlobalChartState] = useGlobalChartState();
    const [hoverSelection, saveHoverSelection] = useHoveredSelection();
    const fileInfo = useFileInfo();
    let features = useDownsampledFeatures(win);
    const [featureNameList] = useFeatureDisplayNames();

    console.log(features);

    if (features === null) {
        return <WindowCircularProgress />;
    }

    features = features.map(feature => {
        const featureName = featureNameList.get(feature.feature, feature.feature);
        feature.displayName = featureName;
        return feature;
    });

    const baseProps = {
        currentSelection: currentSelection,
        setCurrentSelection: setCurrentSelection,
        savedSelections: savedSelections,
        saveCurrentSelection: saveCurrentSelection,
        hoverSelection: hoverSelection,
        globalChartState: globalChartState,
        data: features,
        fileInfo: fileInfo,
        winId: win.id,
        win
    };

    const featuresRequired = windowTypes.NUM_FEATURES_REQUIRED[props.windowType];
    if (featuresRequired) {
        if (
            (typeof featuresRequired === "number" && features.length !== featuresRequired) ||
            features.length < featuresRequired[0] ||
            features.length > featuresRequired[1]
        )
            return (
                <WindowError>
                    Please select
                    {typeof featuresRequired === "number"
                        ? ` exactly ${featuresRequired} `
                        : ` between ${featuresRequired.join(" to ")} `}
                    features
                    <br />
                    in the features list to use this graph.
                </WindowError>
            );
    }

    const windowContent = (function() {
        switch (props.windowType) {
            case windowTypes.SCATTER_GRAPH:
                return <ScatterGraph {...baseProps} />;
            case windowTypes.CONTOUR_GRAPH:
                return <ContourGraph {...baseProps} />;
            case windowTypes.VIOLIN_PLOT_GRAPH:
                return <ViolinPlotGraph {...baseProps} />;
            case windowTypes.TIME_SERIES_GRAPH:
                return <TimeSeriesGraph {...baseProps} />;
            case windowTypes.HEATMAP_GRAPH:
                return <HeatmapGraph {...baseProps} />;
            case windowTypes.HEATMAP_3D_GRAPH:
                return <HeatmapGraph3d {...baseProps} />;
            case windowTypes.BOX_PLOT_GRAPH:
                return <BoxPlotGraph {...baseProps} />;
            case windowTypes.HISTOGRAM_GRAPH:
                return <HistogramGraph {...baseProps} />;
            case windowTypes.SINGLE_X_MULTIPLE_Y:
                return <SingleXMultipleYGraph {...baseProps} />;
            case windowTypes.MAP_GRAPH:
                return <MapGraph {...baseProps} />;
        }
    })();

    return (
        <div
            onClick={e => {
                document.activeElement.blur(); // For some reason, right-panel stuff isn't defocusing on Plotly clicks
            }}
            style={{ height: "100%", width: "100%" }}
        >
            {windowContent}
        </div>
    );
}

export default GraphWindow;
