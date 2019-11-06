import React from "react";
import "components/PropertyEditor/PropertyEditor.scss";
import {
    useActiveWindow,
    useWindowList,
    useWindowFeatureList,
    useWindowFeatureInfoList,
    useWindowXAxis
} from "hooks/WindowHooks";
import * as windowTypes from "constants/windowTypes";
import Button from "@material-ui/core/Button";
import CompareArrowsIcon from "@material-ui/icons/CompareArrows";
import SwapAxesIcon from "components/Icons/SwapAxes";
import * as uiTypes from "constants/uiTypes";

function MultiAxisGraphEditor(props) {
    const [featureInfo, setFeatureInfo] = useWindowFeatureInfoList(props.activeWindowId);
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [xAxis, setXAxis] = useWindowXAxis(props.activeWindowId);

    if (!features) return null;

    const xAxisSelect =
        features.size > 1 ? (
            <select onChange={e => setXAxis(e.target.value)} value={xAxis}>
                <option value={uiTypes.GRAPH_INDEX}>Index</option>
                {features.map(f => (
                    <option value={f}>{f}</option>
                ))}
            </select>
        ) : (
            <span className="feature-name">{xAxis}</span>
        );

    return (
        <React.Fragment>
            <div className="header">Graph Details</div>
            <div className="axis">
                <label>X-Axis</label>
                {xAxisSelect}
            </div>
            <div className="axis">
                <label>Line Plots</label>
                {featureInfo
                    .filter(feature => feature.get("name") !== xAxis)
                    .map(feature => (
                        <div className="line-plot">
                            <span>{feature.get("name")}</span>
                            <div
                                className="color-swatch"
                                style={{ background: feature.get("color") }}
                            />
                        </div>
                    ))}
            </div>
        </React.Fragment>
    );
}

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
            case windowTypes.SINGLE_X_MULTIPLE_Y:
                return <MultiAxisGraphEditor activeWindowId={activeWindowId} />;
            default:
                return null;
        }
    })();

    return <div className="propertyEditorContainer">{panelContent}</div>;
}

export default PropertyEditor;
