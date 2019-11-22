import "components/PropertyEditor/PropertyEditor.scss";

import Button from "@material-ui/core/Button";
import React from "react";
import TextField from "@material-ui/core/TextField";

import {
    useActiveWindow,
    useWindowList,
    useWindowFeatureList,
    useWindowFeatureInfoList,
    useWindowXAxis,
    useWindowTitle
} from "hooks/WindowHooks";
import SwapAxesIcon from "components/Icons/SwapAxes";
import * as uiTypes from "constants/uiTypes";
import * as windowTypes from "constants/windowTypes";

import { useWindowMapType, useWindowZAxis } from "../../hooks/WindowHooks";

function MultiAxisGraphEditor(props) {
    const [featureInfo, setFeatureInfo] = useWindowFeatureInfoList(props.activeWindowId);
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [xAxis, setXAxis] = useWindowXAxis(props.activeWindowId);
    const [windowTitle, setWindowTitle] = useWindowTitle(props.activeWindowId);

    if (!features) return null;

    const xAxisSelect =
        features.size > 1 ? (
            <select onChange={e => setXAxis(e.target.value)} value={xAxis}>
                <option value={uiTypes.GRAPH_INDEX}>Index</option>
                {features.map(f => (
                    <option value={f} key={f}>
                        {f}
                    </option>
                ))}
            </select>
        ) : (
            <span className="feature-name">{xAxis}</span>
        );

    return (
        <React.Fragment>
            <div className="header">Graph Details</div>
            <TextField
                className="title-field"
                value={windowTitle}
                onChange={e => setWindowTitle(e.target.value)}
            />
            <div className="axis">
                <label>X-Axis</label>
                {xAxisSelect}
            </div>
            <div className="axis">
                <label>Line Plots</label>
                {featureInfo
                    .filter(feature => feature.get("name") !== xAxis)
                    .map(feature => (
                        <div className="line-plot" key={feature.get("name")}>
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

function ThreeAxisGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [zAxis, setZAxis] = useWindowZAxis(props.activeWindowId);

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
            <div className="axis">
                <label>Z-Axis (average)</label>
                <select onChange={e => setZAxis(e.target.value)} value={zAxis}>
                    {features.map(f => (
                        <option value={f} key={f}>
                            {f}
                        </option>
                    ))}
                </select>
            </div>
            <Button className="swap-button" onClick={_ => setFeatures(features.reverse())}>
                Swap Axes <SwapAxesIcon width="14" height="14" />
            </Button>
        </React.Fragment>
    );
}

function MapGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [mapType, setMapType] = useWindowMapType(props.activeWindowId);
    if (!features) return null;

    return (
        <React.Fragment>
            <div className="header">Graph Details</div>
            <div className="axis">
                <label>Latitude</label>
                <span className="feature-name">{features.get(0)}</span>
            </div>
            <div className="axis">
                <label>Longitude</label>
                <span className="feature-name">{features.get(1)}</span>
            </div>
            {features.size === 3 ? (
                <div className="axis">
                    <label>Heat</label>
                    <span className="feature-name">{features.get(2)}</span>
                </div>
            ) : null}
            <div className="axis">
                <label>Map Type</label>
                <select onChange={e => setMapType(e.target.value)} value={mapType}>
                    {uiTypes.MAP_TYPES.map(f => (
                        <option value={f} key={f}>
                            {f}
                        </option>
                    ))}
                </select>
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
            case windowTypes.HEATMAP_3D_GRAPH:
                return <ThreeAxisGraphEditor activeWindowId={activeWindowId} />;
            case windowTypes.SINGLE_X_MULTIPLE_Y:
                return <MultiAxisGraphEditor activeWindowId={activeWindowId} />;
            case windowTypes.MAP_GRAPH:
                return <MapGraphEditor activeWindowId={activeWindowId} />;
            default:
                return null;
        }
    })();

    return <div className="propertyEditorContainer">{panelContent}</div>;
}

export default PropertyEditor;
