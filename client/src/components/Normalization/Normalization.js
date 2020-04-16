import "./Normalization.scss";

import { Button, IconButton } from "@material-ui/core";
import { useDispatch } from "react-redux";
import HelpIcon from "@material-ui/icons/Help";
import Plot from "react-plotly.js";
import React, { useState, useEffect } from "react";
import * as portals from "react-reverse-portal";

import classnames from "classnames";

import { WindowCircularProgress } from "../WindowHelpers/WindowCenter";
import { makeSimpleRequest, removeSentinelValuesRevised } from "../../utils/utils";
import {
    useFeatureDisplayNames,
    useFileInfo,
    useNewFeature,
    usePinnedFeatures
} from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import HelpContent from "../Help/HelpContent";
import * as wmActions from "../../actions/windowManagerActions";

const DEFAULT_POINT_COLOR = "#3988E3";
const GUIDANCE_PATH = "normalization_page:general_normalization";

function makeServerRequestObj(algorithmName, feature) {
    return {
        routine: "algorithm",
        algorithmName,
        algorithmType: "normalize",
        dataFeatures: [feature.get("feature")],
        downsampled: false,
        file: null,
        guidance: null,
        identification: { id: "dev0" },
        parameters: {},
        dataSelections: []
    };
}

function PreviewPlot(props) {
    if (!props.data)
        return (
            <div className="normalize-plot-container">
                <div className="normalize-plot-title">{props.title}</div>
                <div className="normalize-plot-wrapper">
                    <WindowCircularProgress />
                </div>
            </div>
        );

    const [hover, setHover] = useState(false);

    const min = Math.min(...props.data).toFixed(2);
    const max = Math.max(...props.data).toFixed(2);

    const [chartState, setChartState] = useState({
        data: [
            {
                x: props.data,
                type: "histogram",
                hoverinfo: "x+y",
                marker: { color: props.data.map((val, idx) => DEFAULT_POINT_COLOR), size: 5 },
                visible: true
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 40, r: 10, t: 5, b: 20 },
            hovermode: false,
            titlefont: { size: 5 }
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    });

    const containerClass = classnames({
        "normalize-plot-container": true,
        selected: props.selected
    });
    const titleClass = classnames({
        "normalize-plot-title": true,
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
            <div className="normalize-plot-wrapper">
                <Plot
                    data={chartState.data}
                    layout={chartState.layout}
                    config={chartState.config}
                    style={{ width: "189px", height: "170px" }}
                    onInitialized={figure => setChartState(figure)}
                    onUpdate={figure => setChartState(figure)}
                    className="normalize-plot"
                />
            </div>
        </div>
    );
}

function FeatureRow(props) {
    const fileInfo = useFileInfo();
    const originalData = removeSentinelValuesRevised([props.feature.get("data")], fileInfo);

    const [selections, setSelections] = props.selectionState;
    const featureState = selections[props.feature.get("feature")];

    // Seed state with empty data
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

    // Request standardized and normalized data from server and store it in the state
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
            <div className="normalize-title">{props.feature.get("displayName")}</div>
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

function Normalization(props) {
    // Window initialization
    const win = useWindowManager(props, {
        width: 726,
        height: 820,
        isResizable: true,
        title: "Normalization and Standardization"
    });

    let features = usePinnedFeatures(win);
    const [featureNameList] = useFeatureDisplayNames();

    const selectionState = useState(_ => ({}));
    const [selections, setSelections] = selectionState;

    const addNewFeature = useNewFeature();
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

    function globalSelect(idx) {
        return _ => {
            Object.keys(selections).forEach(key => {
                setSelections(sels => ({ ...sels, [key]: { ...sels[key], selection: idx } }));
            });
        };
    }

    const dispatch = useDispatch();
    function closeWindow() {
        dispatch(wmActions.closeWindow(win.id));
    }

    function runNormalization() {
        Object.entries(selections).forEach(([key, sel]) => {
            if (!sel.selection) return; // Ignore anything that's unselected or set to "original"
            const [descriptor, data] =
                sel.selection === 1
                    ? ["normalized", sel.normalized]
                    : ["standardized", sel.standardized];
            const title = `${key}_${descriptor}`;
            addNewFeature(title, data);
        });
        closeWindow();
    }

    return (
        <div className="normalize-container">
            <div className="normalize-top-bar">
                <div className="help-row">
                    <span>
                        Select whether you wish to normalize or standardize each feature below.
                    </span>
                    <IconButton onClick={_ => setHelpMode(!helpMode)}>
                        <HelpIcon />
                    </IconButton>
                </div>
                <div className="normalize-top-button-row" hidden={helpMode}>
                    <Button onClick={globalSelect(0)}>set all original</Button>
                    <Button onClick={globalSelect(1)}>set all normalized</Button>
                    <Button onClick={globalSelect(2)}>set all standardized</Button>
                </div>
            </div>
            <portals.InPortal node={previews}>
                {features.map(feature => (
                    <FeatureRow
                        key={feature.get("feature")}
                        feature={feature}
                        selectionState={selectionState}
                    />
                ))}
            </portals.InPortal>
            <div className="normalize-previews">
                <HelpContent hidden={!helpMode} guidancePath={GUIDANCE_PATH} />
                {helpMode ? null : <portals.OutPortal node={previews} />}
            </div>
            <div className="normalize-action-row">
                <div>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={_ => (helpMode ? setHelpMode(false) : closeWindow())}
                    >
                        {helpMode ? "Close Help" : "Cancel"}
                    </Button>
                </div>
                <div hidden={helpMode}>
                    <Button
                        color="primary"
                        variant="contained"
                        size="small"
                        onClick={runNormalization}
                    >
                        Run
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default Normalization;
