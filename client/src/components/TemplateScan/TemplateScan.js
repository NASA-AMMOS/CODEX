import "./TemplateScan.scss";

import {
    Button,
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    IconButton
} from "@material-ui/core";
import HelpIcon from "@material-ui/icons/Help";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import Plot from "react-plotly.js";
import React, { useState, useEffect, useRef } from "react";

import { WindowCircularProgress } from "../WindowHelpers/WindowCenter";
import { makeSimpleRequest } from "../../utils/utils";
import { useCloseWindow, useWindowManager } from "../../hooks/WindowHooks";
import { useFeatureDisplayNames, usePinnedFeatures } from "../../hooks/DataHooks";

const DEFAULT_LINE_COLOR = "#3988E3";
const DEFAULT_POINT_COLOR = "rgba(0, 0, 0, 0.5)";

function makeServerRequestObj(algorithmName, feature1, feature2) {
    return {
        routine: "algorithm",
        algorithmName,
        algorithmType: "template_scan",
        dataFeatures: [feature1.get("feature")],
        labelName: [feature2.get("feature")],
        downsampled: false,
        file: null,
        guidance: null,
        identification: { id: "dev0" },
        parameters: { radius: 10, dist: "euclidean" },
        dataSelections: []
    };
}

function FeaturePreview(props) {
    const chartRevision = useRef(0);

    const data = props.feature.get("data").toJS();
    const min = Math.min(...data);
    const max = Math.max(...data);
    const [chartState, setChartState] = useState({
        data: [
            {
                x: data.map((_, idx) => idx),
                y: data,
                type: "scatter",
                mode: "lines",
                marker: { color: DEFAULT_LINE_COLOR, size: 5 },
                visible: true,
                base: min - 0.1 * min
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
                    x0: 0 - 0.05 * data.length,
                    y0: min - (max - min) * 0.25,
                    x1: data.length + 0.05 * data.length,
                    y1: min - (max - min) * 0.25,
                    line: {
                        width: 1
                    }
                },
                {
                    type: "line",
                    x0: 0 - 0.05 * data.length,
                    y0: min - (max - min) * 0.25,
                    x1: 0 - 0.05 * data.length,
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

    return (
        <ExpansionPanel defaultExpanded>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <span className="template-scan-feature-name">
                    {props.feature.get("displayName")}
                </span>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <Plot
                    data={chartState.data}
                    layout={chartState.layout}
                    config={chartState.config}
                    style={{ width: "100%", height: "170px" }}
                    onInitialized={figure => setChartState(figure)}
                    onUpdate={figure => setChartState(figure)}
                    className="peak-detect-plot"
                />
            </ExpansionPanelDetails>
        </ExpansionPanel>
    );
}

function TemplateScan(props) {
    // Window initialization
    const win = useWindowManager(props, {
        width: 726,
        height: 600,
        isResizable: true,
        title: "Template Scan"
    });

    let features = usePinnedFeatures(win);
    const [featureNameList] = useFeatureDisplayNames();

    const requestObj = features && makeServerRequestObj("dtw", features.get(0), features.get(1));
    const [res, setRes] = useState();
    useEffect(
        _ => {
            if (!features || res) return;
            const { req, cancel } = makeSimpleRequest(requestObj);
            req.then(data => {
                setRes(data);
            });
        },
        [features]
    );

    const [excludedFeature, setExcludedFeature] = useState();
    useEffect(
        _ => {
            if (!features || excludedFeature) return;
            setExcludedFeature(features.get(0).get("displayName"));
        },
        [features]
    );

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    features = features.map(feature => {
        const featureName = featureNameList.get(feature.get("feature"), feature.get("feature"));
        return feature.set("displayName", featureName);
    });

    const closeWindow = useCloseWindow(win);

    return (
        <div className="normalize-container">
            <div className="normalize-top-bar">
                <div className="help-row">
                    <span>
                        Select regions on your training Features that are positively- or
                        negatively-correlated with a pattern of interest. Then Scan another Feature
                        for that pattern using a choice of algorithm.
                    </span>
                    <IconButton>
                        <HelpIcon />
                    </IconButton>
                </div>
            </div>
            <div className="normalize-previews">
                <div className="template-scan-header">
                    <span>Create Template</span>
                </div>
                <div className="template-scan-controls">
                    <div>
                        <div> Feature to Exclude from Template Creation:</div>
                        <select
                            value={excludedFeature}
                            onChange={e => setExcludedFeature(e.target.value)}
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
                    <div>
                        <div>Draw Block:</div>
                        <button>Positive</button>
                        <button>Negative</button>
                    </div>
                </div>
                {features
                    .filter(feature => feature.get("displayName") !== excludedFeature)
                    .map(feature => (
                        <FeaturePreview feature={feature} />
                    ))}
            </div>
            <div className="normalize-action-row">
                <div>
                    <Button variant="contained" size="small" onClick={_ => closeWindow()}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default TemplateScan;
