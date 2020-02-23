import "./TemplateScan.scss";

import {
    Button,
    ExpansionPanel,
    ExpansionPanelDetails,
    ExpansionPanelSummary,
    IconButton
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import HelpIcon from "@material-ui/icons/Help";
import React, { useState, useEffect, useRef, useCallback } from "react";
import ReactResizeDetector from "react-resize-detector";
import * as portals from "react-reverse-portal";

import PlotlyPatched from "plotly-patched/src/core";
import classnames from "classnames";
import plotComponentFactory from "react-plotly-patched.js/factory";
import * as utils from "utils/utils";

import { WindowCircularProgress } from "../WindowHelpers/WindowCenter";
import { makeSimpleRequest } from "../../utils/utils";
import { useCloseWindow, useWindowManager } from "../../hooks/WindowHooks";
import { useFeatureDisplayNames, usePinnedFeatures } from "../../hooks/DataHooks";
import HelpContent from "../Help/HelpContent";

const DEFAULT_LINE_COLOR = "#3988E3";
const DEFAULT_POINT_COLOR = "rgba(0, 0, 0, 0.5)";
const POSITIVE_SELECTION_COLOR = "#56CCF2";
const NEGATIVE_SELECTION_COLOR = "#EB5757";
const GUIDANCE_PATH = "template_scan_page:template_scan_page";

const Plot = plotComponentFactory(PlotlyPatched);

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
    const [chartRevision, setChartRevision] = useState(0);
    const chart = useRef();

    const data = props.feature.get("data").toJS();
    const min = Math.min(...data);
    const max = Math.max(...data);

    const baseShapes = [
        {
            type: "line",
            x0: 0,
            y0: min - (max - min) * 0.25,
            x1: data.length,
            y1: min - (max - min) * 0.25,
            line: {
                width: 1
            }
        },
        {
            type: "line",
            x0: 0,
            y0: min - (max - min) * 0.25,
            x1: 0,
            y1: max + (max - min) * 0.25,
            line: {
                width: 1
            }
        }
    ];
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
            margin: { l: 10, r: 0, t: 0, b: 0, pad: 10 },
            hovermode: "closest",
            titlefont: { size: 5 },
            showlegend: false,
            dragmode: "select",
            selectdirection: "h",
            datarevision: chartRevision.current,
            xaxis: { showgrid: false, zeroline: false },
            yaxis: { showgrid: false, zeroline: false },
            shapes: baseShapes,
            images: []
        },
        config: {
            displaylogo: false,
            displayModeBar: true,
            modeBarButtons: [["zoomIn2d", "zoomOut2d", "autoScale2d", "select2d"], ["toggleHover"]],
            editable: true,
            edits: {
                annotationPosition: false,
                axisTitleText: false,
                annotationTail: false,
                annotationText: false,
                colorbarPosition: false,
                colorbarTitleText: false,
                legendPosition: false,
                legendText: false,
                shapePosition: true,
                titleText: false
            }
        }
    });

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

    const [selections, setSelections] = useState([]);
    useEffect(
        _ => {
            chartState.layout.shapes = baseShapes.concat(
                selections.map(selection => {
                    return {
                        type: "rect",
                        xref: "x",
                        yref: "paper",
                        x0: selection.range[0],
                        y0: 0,
                        x1: selection.range[1],
                        y1: 1,
                        fillcolor: selection.positive
                            ? POSITIVE_SELECTION_COLOR
                            : NEGATIVE_SELECTION_COLOR,
                        opacity: 0.2,
                        editable: true,
                        horizontalOnly: true,
                        shapeId: selection.shapeId
                    };
                })
            );

            updateChartRevision();
        },
        [selections]
    );

    const handleSelect = useCallback(
        e => {
            if (!e.range) return;
            setSelections(selections =>
                selections.concat([
                    {
                        positive: props.selectMode[0],
                        range: e.range.x,
                        shapeId: utils.createNewId()
                    }
                ])
            );
        },
        [props.selectMode[0]]
    );
    useEffect(_ => updateChartRevision(), [props.selectMode[0]]); // Update callback when the select mode changes

    const [hoveredSelection, setHoveredSelection] = useState();
    function clearShapeHover() {
        setHoveredSelection();
    }

    // Effect to update the global selection state
    useEffect(
        _ => {
            props.selectionState[1](state => ({
                ...state,
                [props.feature.get("feature")]: selections
            }));
        },
        [selections]
    );

    function handleShapeHover(e) {
        setHoveredSelection(selections.find(shape => shape.shapeId === e.shapeId));
    }

    function getCloseButtonPosition(containerWidth) {
        if (!hoveredSelection) return 0;
        const xPos =
            hoveredSelection.range[0] + (hoveredSelection.range[1] - hoveredSelection.range[0]) / 2;
        console.log(containerWidth);
        return (xPos * containerWidth + 48) / data.length + 20;
    }

    function handleCloseSelection() {
        setSelections(selections =>
            selections.filter(sel => sel.shapeId !== hoveredSelection.shapeId)
        );
        setHoveredSelection();
    }

    function updateSelections() {
        setSelections(selections =>
            selections.map(selection => {
                const shape = chartState.layout.shapes.find(
                    shape => shape.shapeId === selection.shapeId
                );
                return Object.assign(selection, { range: [shape.x0, shape.x1] });
            })
        );
    }

    return (
        <ExpansionPanel defaultExpanded>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <span className="template-scan-feature-name">
                    {props.feature.get("displayName")}
                </span>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <ReactResizeDetector
                    handleWidth
                    handleHeight
                    onResize={_ => chart.current.resizeHandler()}
                >
                    {({ height, width }) => (
                        <React.Fragment>
                            <div
                                className="template-scan-close-button"
                                style={{
                                    display: hoveredSelection ? "block" : "none",
                                    left: getCloseButtonPosition(width),
                                    top: 35
                                }}
                                onClick={handleCloseSelection}
                            >
                                <CloseIcon />
                            </div>
                            <div className="template-scan-axis-label">
                                {props.feature.get("feature")}
                            </div>
                            <Plot
                                ref={chart}
                                data={chartState.data}
                                layout={chartState.layout}
                                config={chartState.config}
                                style={{ width: "100%", height: "170px" }}
                                onInitialized={figure => setChartState(figure)}
                                onUpdate={figure => setChartState(figure)}
                                onSelected={handleSelect}
                                onShapeEnter={handleShapeHover}
                                onHover={clearShapeHover}
                                onRelayout={updateSelections}
                                useResizeHandler
                            />
                        </React.Fragment>
                    )}
                </ReactResizeDetector>
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

    const selectionState = useState({});
    const selectMode = useState(true);

    const [helpMode, setHelpMode] = useState(false);

    // We store the previews in a portal so we don't have to re-render them when the user switches back from help mode
    const previews = React.useMemo(() => portals.createPortalNode(), []);

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    features = features.map(feature => {
        const featureName = featureNameList.get(feature.get("feature"), feature.get("feature"));
        return feature.set("displayName", featureName);
    });

    const closeWindow = useCloseWindow(win);

    return (
        <div className="template-scan-container">
            <portals.InPortal node={previews}>
                <div className="template-scan-header">
                    <span>Create Template</span>
                </div>
                <div className="template-scan-controls">
                    <div className="template-scan-control-block">
                        <label> Feature to Exclude from Template Creation:</label>
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
                    <div className="template-scan-control-block">
                        <label>Draw Block:</label>
                        <div className="template-scan-block-draw-buttons">
                            <button
                                onClick={_ => selectMode[1](true)}
                                className={classnames({ active: selectMode[0] })}
                            >
                                <div
                                    className="color-swatch"
                                    style={{ background: POSITIVE_SELECTION_COLOR }}
                                />
                                Positive
                            </button>
                            <button
                                onClick={_ => selectMode[1](false)}
                                className={classnames({ active: !selectMode[0] })}
                            >
                                <div
                                    className="color-swatch"
                                    style={{ background: NEGATIVE_SELECTION_COLOR }}
                                />
                                Negative
                            </button>
                        </div>
                    </div>
                </div>
                {features
                    .filter(feature => feature.get("displayName") !== excludedFeature)
                    .map(feature => (
                        <FeaturePreview
                            feature={feature}
                            selectMode={selectMode}
                            key={feature.get("feature")}
                            selectionState={selectionState}
                        />
                    ))}
            </portals.InPortal>
            <div className="normalize-top-bar">
                <div className="help-row">
                    <span>
                        Select regions on your training Features that are positively- or
                        negatively-correlated with a pattern of interest. Then Scan another Feature
                        for that pattern using a choice of algorithm.
                    </span>
                    <IconButton>
                        <HelpIcon onClick={_ => setHelpMode(mode => !mode)} />
                    </IconButton>
                </div>
            </div>
            <div className="normalize-previews">
                <HelpContent hidden={!helpMode} guidancePath={GUIDANCE_PATH} />
                {!helpMode ? <portals.OutPortal node={previews} /> : null}
            </div>
            <div className="template-scan-action-row {">
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
