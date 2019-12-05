import React from "react";

import * as windowTypes from "constants/windowTypes";

import { WindowCircularProgress, WindowError } from "../WindowHelpers/WindowCenter";
import {
    useCurrentSelection,
    useFileInfo,
    useHoveredSelection,
    usePinnedFeatures,
    useSavedSelections
} from "../../hooks/DataHooks";
import { useGlobalChartState } from "../../hooks/UIHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import BoxPlotGraph from "./BoxPlotGraph";
import ContourGraph from "./ContourGraph";
import HeatmapGraph from "./HeatmapGraph";
import HistogramGraph from "./HistogramGraph";
import MapGraph from "./MapGraph";
import ScatterGraph from "./ScatterGraph";
import SingleXMultipleYGraph from "./SingleXMultipleYGraph";
import TimeSeriesGraph from "./TimeSeriesGraph";
import ViolinPlotGraph from "./ViolinPlotGraph";

export const NUM_FEATURES_REQUIRED = {
    [windowTypes.SCATTER_GRAPH]: 2,
    [windowTypes.CONTOUR_GRAPH]: 2,
    [windowTypes.HEATMAP_GRAPH]: 2,
    [windowTypes.HEATMAP_3D_GRAPH]: 3,
    [windowTypes.MAP_GRAPH]: [2, 3]
};

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
    const features = usePinnedFeatures(win);

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    const baseProps = {
        currentSelection: currentSelection,
        setCurrentSelection: setCurrentSelection,
        savedSelections: savedSelections,
        saveCurrentSelection: saveCurrentSelection,
        hoverSelection: hoverSelection,
        globalChartState: globalChartState,
        data: features,
        fileInfo: fileInfo,
        win: win
    };

    const featuresRequired = NUM_FEATURES_REQUIRED[props.windowType];
    if (featuresRequired) {
        if (
            (typeof featuresRequired === "number" && features.size !== featuresRequired) ||
            (features.size < featuresRequired[0] || features.size > featuresRequired[1])
        )
            return (
                <WindowError>
                    Please select
                    {typeof featuresRequired === "number"
                        ? ` exactly ${featuresRequired}`
                        : ` between ${featuresRequired.join(" to ")} `}
                    features
                    <br />
                    in the features list to use this graph.
                </WindowError>
            );
    }

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
            return <HeatmapGraph {...baseProps} />;
        case windowTypes.BOX_PLOT_GRAPH:
            return <BoxPlotGraph {...baseProps} />;
        case windowTypes.HISTOGRAM_GRAPH:
            return <HistogramGraph {...baseProps} />;
        case windowTypes.SINGLE_X_MULTIPLE_Y:
            return <SingleXMultipleYGraph {...baseProps} />;
        case windowTypes.MAP_GRAPH:
            return <MapGraph {...baseProps} />;
    }
}

export default GraphWindow;
