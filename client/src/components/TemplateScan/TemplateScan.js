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

import { WindowCircularProgress, WindowError } from "../WindowHelpers/WindowCenter";
import { makeSimpleRequest, range } from "../../utils/utils";
import { useCloseWindow, useWindowManager } from "../../hooks/WindowHooks";
import {
    useFeatureDisplayNames,
    usePinnedFeatures,
    useSavedSelections
} from "../../hooks/DataHooks";
import HelpContent from "../Help/HelpContent";

const DEFAULT_LINE_COLOR = "#3988E3";
const DEFAULT_POINT_COLOR = "rgba(0, 0, 0, 0.5)";
const POSITIVE_SELECTION_COLOR = "#56CCF2";
const NEGATIVE_SELECTION_COLOR = "#EB5757";
const OUTPUT_SELECTION_COLOR = "#27AE60";
const GUIDANCE_PATH = "template_scan_page:general_template_scan";

const Plot = plotComponentFactory(PlotlyPatched);

const ALGOS = [{ name: "dtw", displayName: "Dynamic Time Warping" }];

function makeServerRequestObj(algorithmName, features, labelName, activeLabels) {
    return {
        routine: "algorithm",
        algorithmName,
        algorithmType: "template_scan",
        dataFeatures: features,
        labelName: [labelName],
        downsampled: false,
        file: null,
        guidance: null,
        identification: { id: "dev0" },
        parameters: { radius: 10, dist: "euclidean" },
        dataSelections: [],
        activeLabels
    };
}

function AlgoReturnPreview(props) {
    if (!props.algo.data) return <WindowCircularProgress />;

    const [chartRevision, setChartRevision] = useState(0);
    const chart = useRef();

    const data = props.features
        .find(feature => feature.get("feature") === props.excludedFeature)
        .get("data")
        .toJS();
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
            hovermode: "zoom",
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
            modeBarButtons: [["zoomIn2d", "zoomOut2d", "autoScale2d"], ["toggleHover"]],
            editable: false
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

    const [returnedSelections, setReturnedSelections] = useState([]);
    useEffect(
        _ => {
            if (!props.algo.data.results) return;
            setReturnedSelections(
                props.algo.data.results.reduce((acc, val, idx, ary) => {
                    const lastGroup = acc[acc.length - 1];
                    if (val === 1) {
                        if (!lastGroup || lastGroup.length === 2) acc.push([idx]);
                        if (idx === ary.length - 1 && lastGroup.length === 1) lastGroup.push(idx);
                        return acc;
                    }
                    if (val === 0) {
                        if (lastGroup && lastGroup.length === 1) lastGroup.push(idx - 1);
                        return acc;
                    }
                }, [])
            );
        },
        [props.algo.data.results]
    );

    useEffect(
        _ => {
            chartState.layout.shapes = baseShapes.concat(
                returnedSelections.map(range => ({
                    type: "rect",
                    xref: "x",
                    yref: "paper",
                    x0: range[0],
                    y0: 0,
                    x1: range[1],
                    y1: 1,
                    fillcolor: OUTPUT_SELECTION_COLOR,
                    opacity: 0.5,
                    editable: true,
                    horizontalOnly: true,
                    line: {
                        width: 0
                    }
                }))
            );
            updateChartRevision();
        },
        [returnedSelections]
    );

    const [_, createNewSelection] = useSavedSelections();
    function saveScanClick() {
        const newSelection = returnedSelections.reduce((acc, sel) => {
            range(sel[0], sel[1] + 1).forEach(idx => acc.add(idx));
            return acc;
        }, new Set());
        createNewSelection(`Template_Scan_${props.excludedFeature}`, Array.from(newSelection));
    }

    return (
        <ExpansionPanel defaultExpanded>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                <span className="template-scan-feature-name">{props.algo.displayName}</span>
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
                                className="template-scan-loading-overlay"
                                hidden={!props.algo.needsRefresh}
                            >
                                <WindowCircularProgress />
                            </div>
                            <div className="template-scan-axis-label">{props.excludedFeature}</div>
                            <button
                                className="template-scan-save-selection-button"
                                onClick={saveScanClick}
                            >
                                Save Scan as Selection
                            </button>
                            <Plot
                                ref={chart}
                                data={chartState.data}
                                layout={chartState.layout}
                                config={chartState.config}
                                style={{ width: "100%", height: "170px" }}
                                onInitialized={figure => setChartState(figure)}
                                onUpdate={figure => setChartState(figure)}
                                useResizeHandler
                            />
                        </React.Fragment>
                    )}
                </ReactResizeDetector>
            </ExpansionPanelDetails>
        </ExpansionPanel>
    );
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

    const [selections, setSelections] = props.selectionState;
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
                        shapeId: selection.shapeId,
                        line: {
                            width: 0
                        }
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
                        range: e.range.x.map(Math.floor),
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

    function handleShapeHover(e) {
        setHoveredSelection(selections.find(shape => shape.shapeId === e.shapeId));
    }

    function getCloseButtonPosition(containerWidth) {
        if (!hoveredSelection) return 0;
        const xPos =
            hoveredSelection.range[0] + (hoveredSelection.range[1] - hoveredSelection.range[0]) / 2;
        return (xPos * containerWidth + 48) / data.length + 20;
    }

    function handleCloseSelection() {
        setSelections(selections =>
            selections.filter(sel => sel.shapeId !== hoveredSelection.shapeId)
        );
        setHoveredSelection();
    }

    // Plotly relayout happens a lot on startup, so we only want to
    ///update the global selection state if anything has actually changed
    function updateSelections() {
        const newSelections = selections.map(selection => {
            const shape = chartState.layout.shapes.find(
                shape => shape.shapeId === selection.shapeId
            );
            return Object.assign(selection, { range: [shape.x0, shape.x1].map(Math.floor) });
        });
        if (JSON.stringify(selections) !== JSON.stringify(newSelections))
            setSelections(newSelections);
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

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    if (features.size <= 1)
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

    return <TemplateScanContent features={features} win={win} />;
}

function TemplateScanContent(props) {
    const win = props.win;
    const features = props.features;
    const [excludedFeature, setExcludedFeature] = useState();

    useEffect(
        _ => {
            if (!features || excludedFeature) return;
            setExcludedFeature(features.get(0).get("displayName"));
        },
        [features]
    );

    const selectionState = useState([]);
    const selectMode = useState(true);

    const containerRef = useRef();

    const [helpMode, setHelpMode] = useState(false);

    // We store the previews in a portal so we don't have to re-render them when the user switches back from help mode
    const previews = React.useMemo(() => portals.createPortalNode(), []);

    // Handle to re-request algo information when selections/parameters have changed
    const [algoData, setAlgoData] = useState(ALGOS);
    useEffect(
        _ => {
            if (!features || !excludedFeature) return;
            setAlgoData(algoData =>
                algoData.map(algo => Object.assign(algo, { needsRefresh: true }))
            );
            const dataFeatures = features
                .filter(feature => feature.get("displayName") !== excludedFeature)
                .map(feature => feature.get("feature"));
            const labelName = features
                .find(feature => feature.get("displayName") === excludedFeature)
                .get("feature");
            const activeLabels = selectionState[0].reduce(
                (acc, sel) => {
                    range(sel.range[0], sel.range[1] + 1).forEach(
                        idx => (acc[idx] = sel.positive ? 1 : -1)
                    );
                    return acc;
                },
                features
                    .get(0)
                    .get("data")
                    .map(_ => 0)
                    .toJS()
            );
            const handles = algoData.map(algo => {
                const reqObj = makeServerRequestObj(
                    algo.name,
                    dataFeatures.toJS(),
                    labelName,
                    activeLabels
                );
                const { req, cancel } = makeSimpleRequest(reqObj);
                req.then(data => {
                    setAlgoData(
                        algoData.map(algo =>
                            algo.name === algo.name
                                ? Object.assign(algo, { data, needsRefresh: false })
                                : algo
                        )
                    );
                });
                return cancel;
            });
            return _ => handles.forEach(cancel => cancel());
        },
        [selectionState[0], features.size, excludedFeature]
    );

    const closeWindow = useCloseWindow(win);

    function scrollToTop() {
        containerRef.current.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }

    return (
        <div className="template-scan-container">
            <portals.InPortal node={previews}>
                <div className="template-scan-content">
                    <div className="template-scan-header">
                        <span>Create Template</span>
                    </div>
                    <div className="template-scan-controls">
                        <div className="template-scan-control-block">
                            <label>Feature to Exclude from Template Creation:</label>
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
                </div>
                <div className="template-scan-content">
                    <div className="template-scan-header">
                        <span>Scan Features With Template</span>
                    </div>
                    <div className="template-scan-controls">
                        <div className="template-scan-control-block">
                            <label>
                                Feature to Visualize: {excludedFeature}{" "}
                                <a href="#" onClick={scrollToTop}>
                                    (change)
                                </a>
                            </label>
                        </div>
                    </div>
                    {algoData.map(algo => (
                        <AlgoReturnPreview
                            algo={algo}
                            excludedFeature={excludedFeature}
                            key={algo.name}
                            selectionState={selectionState}
                            features={features}
                        />
                    ))}
                </div>
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
            <div className="template-scan-previews" ref={containerRef}>
                <HelpContent hidden={!helpMode} guidancePath={GUIDANCE_PATH} />
                {!helpMode ? <portals.OutPortal node={previews} /> : null}
            </div>
            <div className="template-scan-action-row">
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
    );
}
export default TemplateScan;
