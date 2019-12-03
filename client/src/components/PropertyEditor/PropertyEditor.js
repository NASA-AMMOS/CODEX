import "components/PropertyEditor/PropertyEditor.scss";

import { InputAdornment } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import EditIcon from "@material-ui/icons/Edit";
import Immutable from "immutable";
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

import {
    useSwapAxes,
    useWindowGraphBinSize,
    useWindowMapType,
    useWindowYAxis,
    useWindowZAxis
} from "../../hooks/WindowHooks";

function WindowRenameInput(props) {
    const [windowTitle, setWindowTitle] = useWindowTitle(props.activeWindowId);
    return (
        <TextField
            className="title-field"
            value={windowTitle}
            onChange={e => setWindowTitle(e.target.value)}
            InputProps={{
                endAdornment: (
                    <InputAdornment position="end">
                        <EditIcon />
                    </InputAdornment>
                )
            }}
        />
    );
}

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

function HeatmapGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [binSize, setBinSize] = useWindowGraphBinSize(props.activeWindowId);
    if (!features) return null;

    function handleChangeBinSize(axis) {
        return e => {
            setBinSize(binSize.set(axis, parseInt(e.target.value)));
        };
    }

    return (
        <React.Fragment>
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
            <div className="input-field-container">
                <TextField
                    label="Grid-width"
                    variant="filled"
                    className="text-input"
                    value={binSize && binSize.get("x")}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeBinSize("x")}
                />
                <TextField
                    label="Grid-height"
                    variant="filled"
                    className="text-input"
                    value={binSize && binSize.get("y")}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeBinSize("y")}
                />
            </div>
        </React.Fragment>
    );
}

function TwoAxisGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    if (!features) return null;

    return (
        <React.Fragment>
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
    const [binSize, setBinSize] = useWindowGraphBinSize(props.activeWindowId);

    if (!features) return null;

    function handleChangeBinSize(axis) {
        return e => {
            setBinSize(binSize.set(axis, parseInt(e.target.value)));
        };
    }

    return (
        <React.Fragment>
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
            <div className="input-field-container">
                <TextField
                    label="Grid-width"
                    variant="filled"
                    className="text-input"
                    value={binSize && binSize.get("x")}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeBinSize("x")}
                />
                <TextField
                    label="Grid-height"
                    variant="filled"
                    className="text-input"
                    value={binSize && binSize.get("y")}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeBinSize("y")}
                />
            </div>
        </React.Fragment>
    );
}

function HistogramGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [binSize, setBinSize] = useWindowGraphBinSize(props.activeWindowId);
    if (!features) return null;

    function handleChangeBinSize(axis) {
        return e => {
            setBinSize(Immutable.fromJS({ x: parseInt(e.target.value) }));
        };
    }

    return (
        <React.Fragment>
            <div className="input-field-container">
                <TextField
                    label="Number of bins"
                    variant="filled"
                    className="text-input"
                    value={binSize && binSize.get("x")}
                    type="number"
                    InputLabelProps={{ shrink: true }}
                    onChange={handleChangeBinSize("x")}
                />
            </div>
        </React.Fragment>
    );
}

function MapGraphEditor(props) {
    const [features, setFeatures] = useWindowFeatureList(props.activeWindowId);
    const [mapType, setMapType] = useWindowMapType(props.activeWindowId);
    const [xAxis, setXAxis] = useWindowXAxis(props.activeWindowId);
    const [yAxis, setYAxis] = useWindowYAxis(props.activeWindowId);
    const [zAxis, setZAxis] = useWindowZAxis(props.activeWindowId);
    const swapAxes = useSwapAxes(props.activeWindowId);

    if (!features) return null;

    if (features.size === 2)
        return (
            <React.Fragment>
                <div className="axis">
                    <label>Latitude</label>
                    <span className="feature-name">{xAxis}</span>
                </div>
                <div className="axis">
                    <label>Longitude</label>
                    <span className="feature-name">{yAxis}</span>
                </div>
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
                <Button className="swap-button" onClick={swapAxes}>
                    Swap Axes <SwapAxesIcon width="14" height="14" />
                </Button>
            </React.Fragment>
        );

    return (
        <React.Fragment>
            <div className="header">Graph Details</div>
            <div className="axis">
                <label>Latitude</label>
                <select onChange={e => setXAxis(e.target.value)} value={xAxis}>
                    {features.map(f => (
                        <option value={f} key={f}>
                            {f}
                        </option>
                    ))}
                </select>
            </div>
            <div className="axis">
                <label>Longitude</label>
                <select onChange={e => setYAxis(e.target.value)} value={yAxis}>
                    {features.map(f => (
                        <option value={f} key={f}>
                            {f}
                        </option>
                    ))}
                </select>
            </div>
            <div className="axis">
                <label>Heat</label>
                <select onChange={e => setZAxis(e.target.value)} value={zAxis}>
                    {features.map(f => (
                        <option value={f} key={f}>
                            {f}
                        </option>
                    ))}
                </select>
            </div>
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
                return <TwoAxisGraphEditor activeWindowId={activeWindowId} />;
            case windowTypes.HEATMAP_GRAPH:
                return <HeatmapGraphEditor activeWindowId={activeWindowId} />;
            case windowTypes.HEATMAP_3D_GRAPH:
                return <ThreeAxisGraphEditor activeWindowId={activeWindowId} />;
            case windowTypes.SINGLE_X_MULTIPLE_Y:
                return <MultiAxisGraphEditor activeWindowId={activeWindowId} />;
            case windowTypes.MAP_GRAPH:
                return <MapGraphEditor activeWindowId={activeWindowId} />;
            case windowTypes.HISTOGRAM_GRAPH:
                return <HistogramGraphEditor activeWindowId={activeWindowId} />;

            default:
                return null;
        }
    })();

    return (
        <div className="propertyEditorContainer">
            <div className="header">Graph Details</div>
            <WindowRenameInput activeWindowId={activeWindowId} />
            {panelContent}
        </div>
    );
}

export default PropertyEditor;
