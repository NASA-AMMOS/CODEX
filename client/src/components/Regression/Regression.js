import "./Regression.scss";

import { Button, IconButton, Paper, Slider, Switch, Tooltip } from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";
import Plot from "react-plotly.js";
import React, { useState, useEffect, useRef } from "react";
import ReactResizeDetector from "react-resize-detector";
import * as portals from "react-reverse-portal";

import { WindowCircularProgress } from "../WindowHelpers/WindowCenter";
import { makeSimpleRequest, zip } from "../../utils/utils";
import { useFeatureDisplayNames, usePinnedFeatures } from "../../hooks/DataHooks";
import { useWindowManager, useCloseWindow } from "../../hooks/WindowHooks";
import HelpContent from "../Help/HelpContent";

const DEFAULT_POINT_COLOR = "#3988E3";
const GUIDANCE_PATH = "regression_page:general_regression";
const DECISION_TREE_REGRESSOR_PARAMS = [
    {
        name: "max_depth",
        value: 5,
        range: [2, 25],
        displayName: "Max Depth",
        helpText: "The maximum depth of the tree."
    },
    {
        name: "splitter",
        value: "best",
        options: ["default", "best"],
        displayName: "Splitter",
        helpText:
            "The strategy used to choose the split at each node. Supported strategies are “best” to choose the best split and “random” to choose the best random split."
    },
    {
        name: "max_features",
        value: null,
        helpText: "The maximum number of features to consider when looking for the best split."
    }
];

const K_NEIGHBORS_REGRESSOR_PARAMS = [
    {
        name: "leaf_size",
        value: 30,
        range: [1, 100],
        displayName: "Leaf Size",
        helpText:
            "Leaf size passed to BallTree or KDTree. This can affect the speed of the construction and query, as well as the memory required to store the tree."
    },
    {
        name: "algorithm",
        value: "auto",
        options: ["ball_tree", "kd_tree", "brute"],
        displayName: "Algorithm",
        helpText: "Algorithm used to compute the nearest neighbors"
    },
    {
        name: "p",
        value: 2,
        range: [1, 10],
        helpText:
            "Power parameter for the Minkowski metric. When p = 1, this is equivalent to using manhattan_distance (l1), and euclidean_distance (l2) for p = 2. For arbitrary p, minkowski_distance (l_p) is used."
    }
];

const LINEAR_REGRESSOR_PARAMS = [
    {
        name: "fit_intercept",
        value: true,
        displayName: "Fit Intercept",
        helpText:
            "Whether to calculate the intercept for this model. If set to False, no intercept will be used in calculations (i.e. data is expected to be centered)."
    },
    {
        name: "normalize",
        value: false,
        displayName: "Normalize",
        helpText:
            "This parameter is ignored when fit_intercept is set to False. If True, the regressors X will be normalized before regression by subtracting the mean and dividing by the l2-norm."
    }
];

const RANDOM_FOREST_REGRESSOR_PARAMS = [
    {
        name: "max_features",
        value: null,
        displayName: "Max Features",
        helpText: "The maximum number of features to consider when looking for the best split."
    },
    {
        name: "min_samples_leaf",
        value: 1,
        displayName: "Min Samples Leaf",
        helpText:
            "The minimum number of samples required to be at a leaf node. A split point at any depth will only be considered if it leaves at least min_samples_leaf training samples in each of the left and right branches. This may have the effect of smoothing the model."
    },
    {
        name: "bootstrap",
        value: false,
        displayName: "Bootstrap",
        helpText:
            "Whether bootstrap samples are used when building trees. If False, the whole datset is used to build each tree."
    },
    {
        name: "max_depth",
        value: 100,
        range: [1, 100],
        displayName: "Max Depth",
        helpText:
            "The maximum depth of the tree. If max depth >= the number of features selected, then nodes are expanded until all leaves are pure or until all leaves contain less than min_samples_split samples."
    }
];

function makeServerRequestObj(algorithmName, features, parameters, labelName) {
    return {
        routine: "algorithm",
        algorithmName,
        algorithmType: "regression",
        dataFeatures: features.map(feature => feature.feature),
        downsampled: false,
        file: null,
        guidance: null,
        identification: { id: "dev0" },
        parameters: parameters.reduce((acc, param) => {
            acc[param.name] = param.value !== "" ? param.value : null; // Turn empty strings to nulls
            return acc;
        }, {}),
        dataSelections: [],
        labelName,
        scoring: "r2",
        cross_val: null,
        search_type: "direct"
    };
}

function TrendPlot(props) {
    if (!props.data)
        return (
            <div className="regression-plot-wrapper">
                <div className="regression-loading">
                    <WindowCircularProgress />
                </div>
            </div>
        );

    if (!props.data.y || !props.data.y_pred) {
        console.log("Server Response:");
        console.log(props.data);
        return <div>Can't find return data. Check console for info.</div>;
    }

    const [showFeatureImportance, setShowFeatureImportance] = useState(false);
    const chartRevision = useRef(0);
    const [x, y] = zip(props.data.data);
    const [chartState, setChartState] = useState({
        data: [
            {
                x: props.data.y_pred,
                y: props.data.y,
                type: "scatter",
                mode: "markers",
                marker: { color: DEFAULT_POINT_COLOR, size: 5 },
                visible: true
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 50, r: 0, t: 0, b: 60, pad: 10 },
            hovermode: false,
            titlefont: { size: 5 },
            showlegend: false,
            datarevision: chartRevision.current,
            xaxis: {
                title: props.targetFeature
            },
            yaxis: {
                title: "Regression"
            },
            shapes: [
                {
                    type: "line",
                    xref: "x",
                    yref: "y",
                    x0: 0,
                    x1: Math.max(...props.data.y_pred),
                    y0: 0,
                    y1: Math.max(...props.data.y_pred),
                    line: {
                        color: "red",
                        width: 1
                    }
                }
            ]
        },
        config: {
            displaylogo: false,
            modeBarButtons: [["zoom2d", "pan2d", "zoomIn2d", "zoomOut2d", "autoScale2d"]]
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
            chartState.data[0].x = props.data.y_pred;
            chartState.data[0].y = props.data.y;
            updateChartRevision();
        },
        [props.data]
    );

    const chart = useRef();

    if (props.isUpdating)
        return (
            <div className="regression-plot-wrapper">
                <div className="regression-loading">
                    <WindowCircularProgress />
                </div>
            </div>
        );

    const featureImportance = props.hideFeatureImportance ? null : (
        <React.Fragment>
            <Button
                variant="contained"
                onClick={_ => setShowFeatureImportance(!showFeatureImportance)}
                color="primary"
            >
                {showFeatureImportance ? "Hide Feature Importance" : "Show Feature Importance"}
            </Button>
            {showFeatureImportance ? <ImportanceChart data={props.data} /> : null}
        </React.Fragment>
    );

    return (
        <React.Fragment>
            <ReactResizeDetector
                handleWidth
                handleHeight
                onResize={_ => !props.hidden && chart.current.resizeHandler()}
            />
            <div className="regression-plot-container">
                <div className="regression-algo-label">{props.algoLabel}</div>
                <div className="regression-axis-label">{props.name}</div>
                <div className="regression-scores">
                    <span>R&#178; = {props.data.score.toFixed(2)}</span>
                    <span>Variance Explained = {props.data.explained_variance | 0}%</span>
                </div>
                <div className="regression-plot-wrapper">
                    {props.isUpdating ? (
                        <div className="regression-loading overlay">
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
                </div>
            </div>
            {featureImportance}
        </React.Fragment>
    );
}

function ImportanceChart(props) {
    const sortedData = props.data.importances.sort((a, b) => a[1] - b[1]);
    const chartRevision = useRef(0);
    const [chartState, setChartState] = useState({
        data: [
            {
                x: sortedData.map(val => val[1]),
                y: sortedData.map(val => val[0]),
                type: "bar",
                orientation: "h",
                marker: { color: DEFAULT_POINT_COLOR, size: 5 },
                visible: true
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 50, r: 0, t: 0, b: 60, pad: 10 },
            hovermode: false,
            titlefont: { size: 5 },
            showlegend: false,
            datarevision: chartRevision.current,
            xaxis: {
                title: "Relative Importance"
            }
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
            chartState.data[0].x = sortedData.map(val => val[1]);
            chartState.data[0].y = sortedData.map(val => val[0]);
            updateChartRevision();
        },
        [props.data]
    );

    const chart = useRef();

    if (props.isUpdating)
        return (
            <div className="regression-plot-wrapper">
                <div className="regression-loading">
                    <WindowCircularProgress />
                </div>
            </div>
        );

    return (
        <React.Fragment>
            <ReactResizeDetector
                handleWidth
                handleHeight
                onResize={_ => !props.hidden && chart.current.resizeHandler()}
            />
            <div className="regression-plot-container">
                <div className="regression-algo-label">{props.algoLabel}</div>
                <div className="regression-axis-label">{props.name}</div>
                <div className="regression-plot-wrapper">
                    {props.isUpdating ? (
                        <div className="regression-loading overlay">
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
        <div className="regression-slider-control">
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

function OptionDropdown(props) {
    return (
        <div className="regression-dropdown">
            <Tooltip
                title={props.param.helpText || props.param.displayName || props.param.name}
                placement="top-start"
            >
                <div>
                    <label>{props.param.displayName}</label>
                    <select
                        value={props.param.value}
                        onChange={e => props.updateParam(props.param.name, e.target.value)}
                    >
                        {props.param.options.map(opt => (
                            <option key={opt} value={opt}>
                                {opt}
                            </option>
                        ))}
                    </select>
                </div>
            </Tooltip>
        </div>
    );
}

function ParamSwitch(props) {
    return (
        <Tooltip
            title={props.param.helpText || props.param.displayName || props.param.name}
            placement="top-start"
        >
            <div className="regression-switch">
                <label>{props.param.displayName}</label>
                <Switch
                    checked={props.param.value}
                    onChange={e => props.updateParam(props.param.name, e.target.checked)}
                    color="primary"
                    value="normalize"
                />
            </div>
        </Tooltip>
    );
}

function DecisionTreeRegressorAlgo(props) {
    const algoLabel = "Decision Tree";
    const algoAPIName = "DecisionTreeRegressor";
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const paramState = useState(
        DECISION_TREE_REGRESSOR_PARAMS.map(param =>
            param.name === "max_features"
                ? Object.assign(param, {
                      value: props.features.size,
                      range: [1, props.features.size]
                  })
                : param
        )
    );

    const [data, setData] = useState();
    useEffect(
        _ => {
            if (needsUpdate) {
                setIsUpdating(true);
                const requestObj = makeServerRequestObj(
                    algoAPIName,
                    props.features
                        .toJS()
                        .filter(feature => feature.feature !== props.targetFeature),
                    paramState[0],
                    props.targetFeature
                );

                const { req, cancel } = makeSimpleRequest(requestObj);
                req.then(data => {
                    setData(data);
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
        [paramState[0], props.targetFeature]
    );

    return (
        <Paper className="regression-algo-container">
            <div className="regression-algo-title">{algoLabel}</div>
            <TrendPlot data={data} isUpdating={isUpdating} targetFeature={props.targetFeature} />
            <div className="regression-control-area">
                <div className="regression-control-row">
                    <ParamSlider
                        paramState={paramState}
                        paramName="max_depth"
                        disabled={isUpdating}
                    />
                    <OptionDropdown
                        param={paramState[0].find(p => p.name === "splitter")}
                        updateParam={updateParam}
                    />
                    <ParamSlider
                        paramState={paramState}
                        paramName="max_features"
                        disabled={isUpdating}
                    />
                </div>
            </div>
        </Paper>
    );
}

function KNeighborsRegressorAlgo(props) {
    const algoLabel = "K Neighbors";
    const algoAPIName = "KNeighborsRegressor";
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const paramState = useState(
        K_NEIGHBORS_REGRESSOR_PARAMS.map(param =>
            param.name === "max_features"
                ? Object.assign(param, {
                      value: props.features.size,
                      range: [1, props.features.size]
                  })
                : param
        )
    );

    const [data, setData] = useState();
    useEffect(
        _ => {
            if (needsUpdate) {
                setIsUpdating(true);
                const requestObj = makeServerRequestObj(
                    algoAPIName,
                    props.features
                        .toJS()
                        .filter(feature => feature.feature !== props.targetFeature),
                    paramState[0],
                    props.targetFeature
                );

                const { req, cancel } = makeSimpleRequest(requestObj);
                req.then(data => {
                    setData(data);
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
        [paramState[0], props.targetFeature]
    );

    return (
        <Paper className="regression-algo-container">
            <div className="regression-algo-title">{algoLabel}</div>
            <TrendPlot
                data={data}
                isUpdating={isUpdating}
                targetFeature={props.targetFeature}
                hideFeatureImportance
            />
            <div className="regression-control-area">
                <div className="regression-control-row">
                    <OptionDropdown
                        param={paramState[0].find(p => p.name === "algorithm")}
                        updateParam={updateParam}
                    />
                    <ParamSlider
                        paramState={paramState}
                        paramName="leaf_size"
                        disabled={isUpdating}
                    />
                    <ParamSlider paramState={paramState} paramName="p" disabled={isUpdating} />
                </div>
            </div>
        </Paper>
    );
}

function LinearRegressorAlgo(props) {
    const algoLabel = "Linear";
    const algoAPIName = "LinearRegression";
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const paramState = useState(LINEAR_REGRESSOR_PARAMS);

    const [data, setData] = useState();
    useEffect(
        _ => {
            if (needsUpdate) {
                setIsUpdating(true);
                const requestObj = makeServerRequestObj(
                    algoAPIName,
                    props.features
                        .toJS()
                        .filter(feature => feature.feature !== props.targetFeature),
                    paramState[0],
                    props.targetFeature
                );

                const { req, cancel } = makeSimpleRequest(requestObj);
                req.then(data => {
                    setData(data);
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
        [paramState[0], props.targetFeature]
    );

    return (
        <Paper className="regression-algo-container">
            <div className="regression-algo-title">{algoLabel}</div>
            <TrendPlot
                data={data}
                isUpdating={isUpdating}
                targetFeature={props.targetFeature}
                hideFeatureImportance
            />
            <div className="regression-control-area">
                <div className="regression-control-row">
                    <ParamSwitch
                        param={paramState[0].find(p => p.name === "fit_intercept")}
                        updateParam={updateParam}
                    />
                    <ParamSwitch
                        param={paramState[0].find(p => p.name === "normalize")}
                        updateParam={updateParam}
                    />
                </div>
            </div>
        </Paper>
    );
}

function RandomForestRegressorAlgo(props) {
    const algoLabel = "Random Forest";
    const algoAPIName = "RandomForestRegressor";
    const [needsUpdate, setNeedsUpdate] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    const paramState = useState(
        RANDOM_FOREST_REGRESSOR_PARAMS.map(param => {
            if (param.name === "max_features") {
                return Object.assign(param, {
                    value: props.features.size,
                    range: [1, props.features.size]
                });
            }
            if (param.name === "min_samples_leaf") {
                return Object.assign(param, {
                    range: [1, props.features.size]
                });
            }
            return param;
        })
    );

    const [data, setData] = useState();
    useEffect(
        _ => {
            if (needsUpdate) {
                setIsUpdating(true);
                const requestObj = makeServerRequestObj(
                    algoAPIName,
                    props.features
                        .toJS()
                        .filter(feature => feature.feature !== props.targetFeature),
                    paramState[0],
                    props.targetFeature
                );

                const { req, cancel } = makeSimpleRequest(requestObj);
                req.then(data => {
                    setData(data);
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
        [paramState[0], props.targetFeature]
    );

    return (
        <Paper className="regression-algo-container">
            <div className="regression-algo-title">{algoLabel}</div>
            <TrendPlot data={data} isUpdating={isUpdating} targetFeature={props.targetFeature} />
            <div className="regression-control-area">
                <div className="regression-control-row">
                    <ParamSlider
                        paramState={paramState}
                        paramName="max_features"
                        disabled={isUpdating}
                    />
                    <ParamSlider
                        paramState={paramState}
                        paramName="min_samples_leaf"
                        disabled={isUpdating}
                    />
                    <ParamSwitch
                        param={paramState[0].find(p => p.name === "bootstrap")}
                        updateParam={updateParam}
                    />
                    <ParamSlider
                        paramState={paramState}
                        paramName="max_depth"
                        disabled={isUpdating}
                    />
                </div>
            </div>
        </Paper>
    );
}

function Regression(props) {
    // Window initialization
    const win = useWindowManager(props, {
        width: 726,
        height: 700,
        isResizable: true,
        title: "Regression"
    });

    // Hooks
    const [helpMode, setHelpMode] = useState(false);

    // We store the previews in a portal so we don't have to re-render them when the user switches back from help mode
    const previews = React.useMemo(() => portals.createPortalNode(), []);

    let features = usePinnedFeatures(win);
    const [featureNameList] = useFeatureDisplayNames();

    const closeWindow = useCloseWindow(win);
    const [targetFeature, setTargetFeature] = useState();
    useEffect(
        _ => {
            if (features && !targetFeature) setTargetFeature(features.get(0).get("displayName"));
        },
        [features]
    );

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    if (features.size < 3)
        return (
            <WindowError>
                Please select 2 or more features
                <br />
                in the features list to use this algorithm.
            </WindowError>
        );

    features = features.map(feature => {
        const featureName = featureNameList.get(feature.get("feature"), feature.get("feature"));
        return feature.set("displayName", featureName);
    });

    return (
        <React.Fragment>
            <div className="regression-container">
                <div className="regression-top-bar">
                    <div className="help-row">
                        <span>
                            Choose one of the selected Features as a Regression Target. The other
                            Features will be used in each Algorithm to estimate that target value,
                            and root-mean-square plots shown for each Algorithm.
                        </span>
                        <IconButton>
                            <HelpIcon onClick={_ => setHelpMode(mode => !mode)} />
                        </IconButton>
                    </div>
                </div>
                <portals.InPortal node={previews}>
                    <div className="regression-previews">
                        <div className="regression-global-controls">
                            <div className="regression-control-block">
                                <label>Regression target:</label>
                                <select
                                    value={targetFeature}
                                    onChange={e => setTargetFeature(e.target.value)}
                                >
                                    {features.map(feature => {
                                        const name = feature.get("displayName");
                                        return (
                                            <option value={name} key={name}>
                                                {name}
                                            </option>
                                        );
                                    })}
                                </select>
                            </div>
                        </div>
                        <DecisionTreeRegressorAlgo
                            features={features}
                            targetFeature={targetFeature}
                        />
                        <KNeighborsRegressorAlgo
                            features={features}
                            targetFeature={targetFeature}
                        />
                        <LinearRegressorAlgo features={features} targetFeature={targetFeature} />
                        <RandomForestRegressorAlgo
                            features={features}
                            targetFeature={targetFeature}
                        />
                    </div>
                </portals.InPortal>

                <div className="regression-content">
                    <HelpContent hidden={!helpMode} guidancePath={GUIDANCE_PATH} />
                    {helpMode ? null : <portals.OutPortal node={previews} />}
                </div>
                <div className="regression-action-row">
                    <div>
                        <Button
                            variant="contained"
                            size="small"
                            onClick={_ => (helpMode ? setHelpMode(false) : closeWindow())}
                        >
                            {helpMode ? "Close Help" : "Cancel"}
                        </Button>
                    </div>
                </div>
            </div>
        </React.Fragment>
    );
}

export default Regression;
