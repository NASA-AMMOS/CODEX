import "./PeakDetection.scss";

import { Button, IconButton, Slider, Switch, TextField } from "@material-ui/core";
import { useDispatch } from "react-redux";
import HelpIcon from "@material-ui/icons/Help";
import Plot from "react-plotly.js";
import React, { useState, useEffect, useRef } from "react";

import { WindowCircularProgress, WindowError } from "../WindowHelpers/WindowCenter";
import { makeSimpleRequest } from "../../utils/utils";
import {
    useFeatureDisplayNames,
    useNewFeature,
    usePinnedFeatures,
    useSavedSelections
} from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import * as wmActions from "../../actions/windowManagerActions";

const DEFAULT_POINT_COLOR = "#3988E3";

function makeServerRequestObj(algorithmName, feature, parameters) {
    return {
        routine: "algorithm",
        algorithmName,
        algorithmType: "peak_detect",
        dataFeatures: [feature.get("feature")],
        downsampled: false,
        file: null,
        guidance: null,
        identification: { id: "dev0" },
        parameters: parameters.reduce((acc, param) => {
            acc[param.name] = param.value !== "" ? param.value : null; // Turn empty strings to nulls
            return acc;
        }, {}),
        dataSelections: []
    };
}

function PeakPlot(props) {
    if (!props.indexes)
        return (
            <div className="peak-detect-plot-wrapper">
                <div className="peak-detect-loading">
                    <WindowCircularProgress />
                </div>
            </div>
        );

    const min = Math.min(...props.data);
    const max = Math.max(...props.data);
    const chartRevision = useRef(0);
    const [chartState, setChartState] = useState({
        data: [
            {
                x: props.data.map((_, idx) => idx),
                y: props.data,
                type: "scatter",
                mode: "lines",
                marker: { color: DEFAULT_POINT_COLOR, size: 5 },
                visible: true,
                base: min - 0.1 * min
            },
            {
                x: props.indexes,
                y: props.indexes.map(idx => props.data[idx]),
                type: "scatter",
                mode: "markers",
                marker: { color: "red", size: 5 },
                visible: true
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0, pad: 10 }, // Axis tick labels are drawn in the margin space
            hovermode: false,
            titlefont: { size: 5 },
            showlegend: false,
            datarevision: chartRevision.current,
            xaxis: { showgrid: false, zeroline: false },
            yaxis: { showgrid: false, zeroline: false },
            shapes: [
                {
                    type: "line",
                    x0: 0 - 0.05 * props.data.length,
                    y0: min - (max - min) * 0.25,
                    x1: props.data.length + 0.05 * props.data.length,
                    y1: min - (max - min) * 0.25,
                    line: {
                        width: 1
                    }
                },
                {
                    type: "line",
                    x0: 0 - 0.05 * props.data.length,
                    y0: min - (max - min) * 0.25,
                    x1: 0 - 0.05 * props.data.length,
                    y1: max + (max - min) * 0.25,
                    line: {
                        width: 1
                    }
                }
            ]
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    });

    function updateChartRevision() {
        chartRevision.current++;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: chartRevision.current }
        });
    }

    useEffect(
        _ => {
            chartState.data[1].x = props.indexes;
            chartState.data[1].y = props.indexes.map(idx => props.data[idx]);
            updateChartRevision();
        },
        [props.indexes]
    );

    const [_, saveNewSelection] = useSavedSelections();
    function saveSelection() {
        const selectionLabel = `${props.name}_${props.algoLabel}`;
        saveNewSelection(selectionLabel, props.indexes);
    }

    return (
        <div className="peak-detect-plot-container">
            <div className="peak-detect-axis-label">{props.name}</div>
            <div className="peak-detect-plot-wrapper">
                <div className="peak-detect-plot-top-row">
                    <div className="peak-detect-algo-label">{props.algoLabel}</div>
                    <Button
                        size="small"
                        variant="contained"
                        color="primary"
                        onClick={saveSelection}
                    >
                        Save Selection
                    </Button>
                </div>
                {props.isUpdating ? (
                    <div className="peak-detect-loading overlay">
                        <WindowCircularProgress />
                    </div>
                ) : null}
                <Plot
                    data={chartState.data}
                    layout={chartState.layout}
                    config={chartState.config}
                    style={{ width: "100%", height: "170px" }}
                    onInitialized={figure => setChartState(figure)}
                    onUpdate={figure => setChartState(figure)}
                    className="peak-detect-plot"
                />
                <div className="peak-detect-plot-peak-count">{`${props.indexes.length} peaks`}</div>
            </div>
        </div>
    );
}

function ParamSlider(props) {
    const param = props.paramState[0].find(param => param.name === props.paramName);

    function changeParam(e, value) {
        props.paramState[1](params =>
            params.map(param => (param.name === props.paramName ? { ...param, value } : param))
        );
    }

    return (
        <div className="peak-detect-slider-control">
            <label>{props.paramName}</label>
            <Slider
                value={param.value}
                min={param.range[0]}
                max={param.range[1]}
                onChange={changeParam}
                valueLabelDisplay="auto"
                disabled={props.disabled}
            />
        </div>
    );
}

function CwtAlgo(props) {
    const algoLabel = "CWT";
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const paramState = useState([
        { name: "gap_threshold", value: 2, range: [0, 5] },
        { name: "min_snr", value: 1, range: [0, 100] },
        { name: "noise_perc", value: 10, range: [0, 100] },
        { name: "peak_width", value: 10, range: [1, 100] }
    ]);

    const [indexes, setIndexes] = useState();

    useEffect(
        _ => {
            if (needsUpdate) {
                setIsUpdating(true);
                const requestObj = makeServerRequestObj("cwt", props.feature, paramState[0]);
                const { req, cancel } = makeSimpleRequest(requestObj);
                req.then(data => {
                    setIndexes(data.indexes);
                    setNeedsUpdate(false);
                    setIsUpdating(false);
                });
                return cancel;
            }
        },
        [needsUpdate]
    );

    const timeout = useRef();
    useEffect(
        _ => {
            timeout.current = setTimeout(_ => setNeedsUpdate(true), 500);
            return _ => clearTimeout(timeout.current);
        },
        [paramState[0]]
    );

    return (
        <div className="peak-detect-algo-container">
            <PeakPlot
                name={props.feature.get("feature")}
                data={props.feature.get("data").toJS()}
                indexes={indexes}
                isUpdating={isUpdating}
                algoLabel={algoLabel}
            />
            <div className="peak-detect-control-area">
                <div className="peak-detect-control-row">
                    {paramState[0].map(param => (
                        <ParamSlider
                            paramState={paramState}
                            paramName={param.name}
                            key={param.name}
                            disabled={isUpdating}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

function FindPeaksAlgo(props) {
    const algoLabel = "Find Peaks";
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const paramState = useState([
        { name: "mph", value: "" },
        { name: "mpd", value: 1, range: [1, 10] },
        { name: "edge", value: "rising" },
        { name: "kpsh", value: false },
        { name: "valley", value: false },
        { name: "peak_width", value: 10, range: [1, 100] },
        { name: "threshold", value: 0, range: [0, 100] }
    ]);

    const edgeOptions = ["rising", "falling", "both", "none"];

    const [indexes, setIndexes] = useState();

    useEffect(
        _ => {
            if (needsUpdate) {
                setIsUpdating(true);
                const requestObj = makeServerRequestObj(
                    "matlab_findpeaks",
                    props.feature,
                    paramState[0]
                );

                const { req, cancel } = makeSimpleRequest(requestObj);
                req.then(data => {
                    setIndexes(data.indexes);
                    setNeedsUpdate(false);
                    setIsUpdating(false);
                });
                return cancel;
            }
        },
        [needsUpdate]
    );

    function updateParam(name, value) {
        paramState[1](params =>
            params.map(param => (param.name === name ? { ...param, value } : param))
        );
    }

    const timeout = useRef();
    useEffect(
        _ => {
            timeout.current = setTimeout(_ => setNeedsUpdate(true), 500);
            return _ => clearTimeout(timeout.current);
        },
        [paramState[0]]
    );

    return (
        <div className="peak-detect-algo-container">
            <PeakPlot
                name={props.feature.get("feature")}
                data={props.feature.get("data").toJS()}
                indexes={indexes}
                isUpdating={isUpdating}
                algoLabel={algoLabel}
            />
            <div className="peak-detect-control-area">
                <div className="peak-detect-control-row">
                    <TextField
                        label="mph"
                        variant="filled"
                        className="text-input with-helper-text"
                        value={paramState[0].find(param => param.name === "mph").value}
                        type="number"
                        InputProps={{ classes: { root: "input-box" } }}
                        FormHelperTextProps={{ classes: { root: "helper-text" } }}
                        onChange={e => e.target.value > 0 && updateParam("mph", e.target.value)}
                    />
                    <ParamSlider paramState={paramState} paramName="mpd" disabled={isUpdating} />
                    <ParamSlider
                        paramState={paramState}
                        paramName="peak_width"
                        disabled={isUpdating}
                    />
                </div>
                <div className="peak-detect-control-row">
                    <ParamSlider
                        paramState={paramState}
                        paramName="threshold"
                        disabled={isUpdating}
                    />
                    <div className="peak-detect-dropdown">
                        <label>Edge</label>
                        <select
                            value={paramState[0].find(param => param.name === "edge").value}
                            onChange={e => updateParam("edge", e.target.value)}
                        >
                            {edgeOptions.map(f => (
                                <option value={f} key={f}>
                                    {f}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="peak-detect-dropdown">
                        <label>kpsh</label>
                        <Switch
                            checked={paramState[0].find(param => param.name === "kpsh").value}
                            onChange={e => updateParam("kpsh", e.target.checked)}
                            color="primary"
                        />
                    </div>
                    <div className="peak-detect-dropdown">
                        <label>valley</label>
                        <Switch
                            checked={paramState[0].find(param => param.name === "valley").value}
                            onChange={e => updateParam("valley", e.target.checked)}
                            color="primary"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function PeakDetection(props) {
    // Window initialization
    const win = useWindowManager(props, {
        width: 726,
        height: 600,
        isResizable: true,
        title: "Peak Detection"
    });

    let features = usePinnedFeatures(win);
    const [featureNameList] = useFeatureDisplayNames();

    const addNewFeature = useNewFeature();

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    if (features.size !== 1)
        return (
            <WindowError>
                Please select exactly 1 feature
                <br />
                in the features list to use this graph.
            </WindowError>
        );

    features = features.map(feature => {
        const featureName = featureNameList.get(feature.get("feature"), feature.get("feature"));
        return feature.set("displayName", featureName);
    });

    const dispatch = useDispatch();
    function closeWindow() {
        dispatch(wmActions.closeWindow(win.id));
    }

    return (
        <div className="peak-detect-container">
            <div className="peak-detect-top-bar">
                <div className="help-row">
                    <span className="peak-detect-title">{`Feature: ${features
                        .get(0)
                        .get("displayName")}`}</span>
                    <IconButton>
                        <HelpIcon />
                    </IconButton>
                </div>
            </div>
            <div className="peak-detect-previews">
                <CwtAlgo feature={features.get(0)} />
                <FindPeaksAlgo feature={features.get(0)} />
            </div>
            <div className="peak-detect-action-row">
                <div>
                    <Button variant="contained" size="small" onClick={_ => closeWindow()}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default PeakDetection;
