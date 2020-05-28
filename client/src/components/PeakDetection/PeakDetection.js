import "./PeakDetection.scss";

import { Button, IconButton, Slider, Switch, TextField, Tooltip } from "@material-ui/core";
import { useDispatch } from "react-redux";
import HelpIcon from "@material-ui/icons/Help";
import Plot from "react-plotly.js";
import React, { useState, useEffect, useRef } from "react";
import ReactResizeDetector from "react-resize-detector";
import * as portals from "react-reverse-portal";

import { WindowCircularProgress, WindowError } from "../WindowHelpers/WindowCenter";
import { makeSimpleRequest } from "../../utils/utils";
import {
    useFeatureDisplayNames,
    useNewFeature,
    usePinnedFeatures,
    useSavedSelections
} from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import HelpContent from "../Help/HelpContent";
import * as wmActions from "../../actions/windowManagerActions";
import * as utils from "../../utils/utils";

const DEFAULT_POINT_COLOR = "#3988E3";
const GUIDANCE_PATH = "peak_detection_page:general_peak_detection";
const CWT_PARAMS = [
    {
        name: "gap_threshold",
        value: 2,
        range: [0, 5],
        displayName: "Gap Threshold",
        helpText:
            "If a relative maximum is not found within max_distances, there will be a gap. A ridge line is discontinued if there are more than gap_thresh points without connecting a new relative maximum."
    },
    {
        name: "min_snr",
        value: 1,
        range: [0, 100],
        displayName: "Minimum SNR",
        helpText:
            "Minimum signal to noise ratio.The signal is the value of the cwt matrix at the shortest length scale, the noise is the 'noise percentage'`th percentile of datapoints contained within a window of 'window size'."
    },
    {
        name: "noise_perc",
        value: 10,
        range: [0, 100],
        displayName: "Noise Percentage",
        helpText:
            "When calculating the noise floor, percentile of data points examined below which to consider noise."
    },
    {
        name: "peak_width",
        value: 10,
        range: [1, 100],
        displayName: "Peak Width",
        helpText:
            "Maximum width to consider for a peak. This range should cover the expected width of peaks of interest."
    }
];
const FIND_PEAKS_PARAMS = [
    {
        name: "mph",
        value: 5,
        helpText: "Detect peaks that are greater than minimum peak height."
    },
    {
        name: "mpd",
        value: 1,
        range: [1, 10],
        helpText:
            "Detect peaks that are at least separated by minimum peak distance, in number of data."
    },
    {
        name: "edge",
        value: "rising",
        displayName: "Edge",
        helpText:
            "For a flat peak, keep only the rising edge ('rising'), only the falling edge ('falling'), both edges ('both'), or don't detect a flat peak (None)."
    },
    {
        name: "kpsh",
        value: false,
        helpText: "Keep peaks with same height even if they are closer than `mpd`."
    },
    {
        name: "valley",
        value: false,
        displayName: "Valley",
        helpText: "If True, detect valleys (local minima) instead of peaks."
    },
    {
        name: "peak_width",
        value: 10,
        range: [1, 100],
        displayName: "Peak Width",
        helpText:
            "Maximum width to consider for a peak. This range should cover the expected width of peaks of interest."
    },
    {
        name: "threshold",
        value: 0,
        range: [0, 100],
        displayName: "Threshold",
        helpText:
            "Detect peaks (valleys) that are greater (smaller) than `threshold` in relation to their immediate neighbors."
    }
];

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

    const [min, max] = utils.getMinMax(props.data.y_pred);
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
            margin: { l: 5, r: 0, t: 0, b: 0, pad: 10 },
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

    const chart = useRef();
    return (
        <React.Fragment>
            <ReactResizeDetector
                handleWidth
                handleHeight
                onResize={_ => !props.hidden && chart.current.resizeHandler()}
            />
            <div className="peak-detect-plot-container">
                <div className="peak-detect-algo-label">{props.algoLabel}</div>
                <div className="peak-detect-axis-label">{props.name}</div>
                <div className="peak-detect-plot-wrapper">
                    <div className="peak-detect-plot-top-row">
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
                        ref={chart}
                        data={chartState.data}
                        layout={chartState.layout}
                        config={chartState.config}
                        style={{ width: "100%", height: "100%" }}
                        onInitialized={figure => setChartState(figure)}
                        onUpdate={figure => setChartState(figure)}
                        useResizeHandler
                    />
                    <div className="peak-detect-plot-peak-count">{`${props.indexes.length} peaks`}</div>
                </div>
            </div>
        </React.Fragment>
    );
}

function ParamSlider(props) {
    const param = props.paramState[0].find(param => param.name === props.paramName);

    function changeParam(e, value) {
        props.paramState[1](params =>
            params.map(param => (param.name === props.paramName ? { ...param, value } : param))
        );
    }

    const marks = [
        { value: param.range[0], label: param.range[0] },
        { value: param.range[1], label: param.range[1] }
    ];
    return (
        <div className="peak-detect-slider-control">
            <Tooltip
                title={param.helpText || param.displayName || param.name}
                placement="top-start"
            >
                <label>{param.displayName || param.name}</label>
            </Tooltip>
            <Slider
                value={param.value}
                min={param.range[0]}
                max={param.range[1]}
                onChange={changeParam}
                valueLabelDisplay="auto"
                disabled={props.disabled}
                marks={marks}
            />
        </div>
    );
}

function CwtAlgo(props) {
    const algoLabel = "CWT";
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const paramState = useState(CWT_PARAMS);

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
                hidden={props.hidden}
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

    const paramState = useState(FIND_PEAKS_PARAMS);

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
                hidden={props.hidden}
            />
            <div className="peak-detect-control-area">
                <div className="peak-detect-control-row">
                    <Tooltip
                        title={
                            paramState[0].find(param => param.name === "mph").helpText ||
                            paramState[0].find(param => param.name === "mph").displayName
                        }
                        placement="top-start"
                    >
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
                    </Tooltip>
                    <ParamSlider paramState={paramState} paramName="mpd" disabled={isUpdating} />
                    <div className="peak-detect-dropdown">
                        <Tooltip
                            title={
                                paramState[0].find(param => param.name === "valley").helpText ||
                                paramState[0].find(param => param.name === "valley").displayName
                            }
                            placement="top-start"
                        >
                            <label>
                                {paramState[0].find(param => param.name === "valley").displayName}
                            </label>
                        </Tooltip>
                        <Switch
                            checked={paramState[0].find(param => param.name === "valley").value}
                            onChange={e => updateParam("valley", e.target.checked)}
                            color="primary"
                        />
                    </div>
                    <div className="peak-detect-dropdown">
                        <Tooltip
                            title={
                                paramState[0].find(param => param.name === "edge").helpText ||
                                paramState[0].find(param => param.name === "edge").displayName
                            }
                            placement="top-start"
                        >
                            <label>Edge</label>
                        </Tooltip>
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
                </div>
                <div className="peak-detect-control-row">
                    <ParamSlider
                        paramState={paramState}
                        paramName="threshold"
                        disabled={isUpdating}
                    />
                    <ParamSlider
                        paramState={paramState}
                        paramName="peak_width"
                        disabled={isUpdating}
                    />

                    <div className="peak-detect-dropdown">
                        <Tooltip
                            title={
                                paramState[0].find(param => param.name === "kpsh").helpText ||
                                paramState[0].find(param => param.name === "kpsh").displayName
                            }
                            placement="top-start"
                        >
                            <label>kpsh</label>
                        </Tooltip>
                        <Switch
                            checked={paramState[0].find(param => param.name === "kpsh").value}
                            onChange={e => updateParam("kpsh", e.target.checked)}
                            color="primary"
                        />
                    </div>
                    <div />
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

    // Hooks
    const [helpMode, setHelpMode] = useState(false);

    // We store the previews in a portal so we don't have to re-render them when the user switches back from help mode
    const previews = React.useMemo(() => portals.createPortalNode(), []);

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
        <React.Fragment>
            <portals.InPortal node={previews}>
                <CwtAlgo feature={features.get(0)} hidden={helpMode} />
                <FindPeaksAlgo feature={features.get(0)} hidden={helpMode} />
            </portals.InPortal>
            <div className="peak-detect-container">
                <div className="peak-detect-top-bar">
                    <div className="help-row">
                        <span className="peak-detect-title">{`Feature: ${features
                            .get(0)
                            .get("displayName")}`}</span>
                        <IconButton>
                            <HelpIcon onClick={_ => setHelpMode(mode => !mode)} />
                        </IconButton>
                    </div>
                </div>
                <div className="peak-detect-previews">
                    <HelpContent hidden={!helpMode} guidancePath={GUIDANCE_PATH} />
                    {!helpMode ? <portals.OutPortal node={previews} /> : null}
                </div>
                <div className="peak-detect-action-row">
                    <div>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={_ => (helpMode ? setHelpMode(false) : closeWindow())}
                        >
                            {helpMode ? "Close Help" : "Close"}
                        </Button>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default PeakDetection;
