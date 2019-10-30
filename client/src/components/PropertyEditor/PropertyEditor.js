import React from "react";
import "components/PropertyEditor/PropertyEditor.scss";
import { useActiveWindow, useWindowList, useWindowFeatureList } from "hooks/WindowHooks";
import * as windowTypes from "constants/windowTypes";
import Button from "@material-ui/core/Button";
import CompareArrowsIcon from "@material-ui/icons/CompareArrows";
import SwapAxesIcon from "components/Icons/SwapAxes";

function TwoAxisGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    if (!features) return null;

    return (
        <React.Fragment>
            <div className="header">Graph Details</div>
            <div className="axis">
                <label>X-Axis</label>
                <span className="feature-name">{features.get(0)}</span>
            </div>
            <div className="axis">
                <label>Y-Axis</label>
                <span className="feature-name">{features.get(1)}</span>
            </div>
            <Button className="swap-button" onClick={_ => setFeatures(features.reverse())}>
                Swap Axes <SwapAxesIcon width="14" height="14" />
            </Button>
        </React.Fragment>
    );
}

function PropertyEditor(props) {
    const [activeWindowId] = useActiveWindow();
    const windowList = useWindowList();

    const activeWindow = windowList.find(win => win.get("id") === activeWindowId);

    if (!activeWindow) return null;

    const panelContent = (function() {
        switch (activeWindow.get("windowType")) {
            case windowTypes.SCATTER_GRAPH:
            case windowTypes.CONTOUR_GRAPH:
            case windowTypes.HEATMAP_GRAPH:
                return <TwoAxisGraphEditor activeWindowId={activeWindowId} />;
            default:
                return null;
        }
    })();

    return <div className="propertyEditorContainer">{panelContent}</div>;
}

export default PropertyEditor;
