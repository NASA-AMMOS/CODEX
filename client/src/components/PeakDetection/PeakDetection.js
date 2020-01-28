import "./PeakDetection.scss";

import { Button, IconButton, Paper } from "@material-ui/core";
import { useDispatch } from "react-redux";
import HelpIcon from "@material-ui/icons/Help";
import Plot from "react-plotly.js";
import React, { useState, useEffect, useContext } from "react";

import classnames from "classnames";

import { WindowCircularProgress, WindowError } from "../WindowHelpers/WindowCenter";
import { getMean, makeSimpleRequest, removeSentinelValuesRevised } from "../../utils/utils";
import {
    useFeatureDisplayNames,
    useFileInfo,
    useNewFeature,
    usePinnedFeatures
} from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import * as wmActions from "../../actions/windowManagerActions";

const DEFAULT_POINT_COLOR = "rgba(0, 0, 0, 0.5)";

const SelectionContext = React.createContext();

function makeServerRequestObj(algorithmName, feature, parameters) {
    console.log(parameters);
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
            acc[param.name] = param.value;
            return acc;
        }, {}),
        dataSelections: []
    };
}

function PreviewPlot(props) {
    if (!props.data)
        return (
            <div className="peak-detect-plot-container">
                <div className="peak-detect-plot-title">{props.title}</div>
                <div className="peak-detect-plot-wrapper">
                    <WindowCircularProgress />
                </div>
            </div>
        );

    const [hover, setHover] = useState(false);
    const [chartState, setChartState] = useState({
        data: [
            {
                x: props.data.map((_, idx) => idx),
                y: props.data,
                type: "scatter",
                mode: "lines",
                marker: { color: props.data.map((val, idx) => DEFAULT_POINT_COLOR), size: 5 },
                visible: true
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0, pad: 10 }, // Axis tick labels are drawn in the margin space
            hovermode: false,
            titlefont: { size: 5 }
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    });

    const containerClass = classnames({
        "peak-detect-plot-container": true,
        selected: props.selected
    });
    const titleClass = classnames({
        "peak-detect-plot-title": true,
        hover: hover || props.selected
    });

    return (
        <div
            className={containerClass}
            onMouseEnter={_ => setHover(true)}
            onMouseLeave={_ => setHover(false)}
            onClick={props.onSelect}
        >
            <div className={titleClass}>{props.title}</div>
            <div className="peak-detect-plot-wrapper">
                <Plot
                    data={chartState.data}
                    layout={chartState.layout}
                    config={chartState.config}
                    style={{ width: "189px", height: "170px" }}
                    onInitialized={figure => setChartState(figure)}
                    onUpdate={figure => setChartState(figure)}
                    className="peak-detect-plot"
                />
                <div className="peak-detect-plot-mean">{getMean(props.data).toFixed(2)}</div>
            </div>
        </div>
    );
}

function FeatureRow(props) {
    const fileInfo = useFileInfo();
    const originalData = removeSentinelValuesRevised([props.feature.get("data")], fileInfo);

    const [selections, setSelections] = useContext(SelectionContext);
    const featureState = selections[props.feature.get("feature")];

    // Seed context with empty data
    useEffect(_ => {
        setSelections(sels => ({
            ...sels,
            [props.feature.get("feature")]: {
                selection: 0,
                normalized: null,
                standardized: null
            }
        }));
    }, []);

    // Request standardized and normalized data from server and store it in the context
    useEffect(_ => {
        const requestObj = makeServerRequestObj("normalize", props.feature);
        const { req, cancel } = makeSimpleRequest(requestObj);
        req.then(data =>
            setSelections(sels => ({
                ...sels,
                [props.feature.get("feature")]: {
                    ...sels[props.feature.get("feature")],
                    normalized: data.scaled.flat()
                }
            }))
        );
        return _ => cancel();
    }, []);

    useEffect(_ => {
        const requestObj = makeServerRequestObj("standardize", props.feature);
        const { req, cancel } = makeSimpleRequest(requestObj);
        req.then(data =>
            setSelections(sels => ({
                ...sels,
                [props.feature.get("feature")]: {
                    ...sels[props.feature.get("feature")],
                    standardized: data.scaled.flat()
                }
            }))
        );
        return _ => cancel();
    }, []);

    function setSelection(val) {
        setSelections(sels => ({
            ...sels,
            [props.feature.get("feature")]: { ...featureState, selection: val }
        }));
    }

    const dataRows = [
        [originalData[0].toJS(), "original"],
        [featureState && featureState.normalized, "normalized"],
        [featureState && featureState.standardized, "standardized"]
    ];

    return (
        <React.Fragment>
            <div className="peak-detect-title">{props.feature.get("displayName")}</div>
            <div className="feature-row">
                {dataRows.map((row, idx) => (
                    <PreviewPlot
                        data={row[0]}
                        title={row[1]}
                        key={idx}
                        idx={idx}
                        onSelect={_ => setSelection(idx)}
                        selected={featureState && featureState.selection === idx}
                    />
                ))}
            </div>
        </React.Fragment>
    );
}

function CwtAlgo(props) {
    const [parameters, setParameters] = useState([
        { name: "gap_threshold", value: 2, range: [0, 5] },
        { name: "min_snr", value: 1, range: [0, 100] },
        { name: "noise_perc", value: 10, range: [0, 100] }
    ]);

    useEffect(_ => {
        const requestObj = makeServerRequestObj("cwt", props.feature, parameters);
        console.log("Sending request: ");
        console.log(requestObj);
        const { req, cancel } = makeSimpleRequest(requestObj);
        req.then(data => {
            console.log("Server response: ");
            console.log(data);
        });
    }, []);
    return <Paper>cwt</Paper>;
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

    const selectionContext = useState(_ => ({}));
    const [selections, setSelections] = selectionContext;

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
        <SelectionContext.Provider value={selectionContext}>
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
                </div>
                <div className="peak-detect-action-row">
                    <div>
                        <Button variant="contained" size="small" onClick={_ => closeWindow()}>
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </SelectionContext.Provider>
    );
}

export default PeakDetection;
