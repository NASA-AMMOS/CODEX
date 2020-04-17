import "./Correlation.scss";

import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    TextField,
    Typography
} from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import HelpIcon from "@material-ui/icons/Help";
import Plot from "react-plotly.js";
import React, { useState, useEffect, useRef } from "react";
import ReactResizeDetector from "react-resize-detector";

import classnames from "classnames";

import { WindowCircularProgress, WindowError } from "../WindowHelpers/WindowCenter";
import { useAllowGraphHotkeys } from "../../hooks/UIHooks";
import {
    useChangeFeatureGroup,
    useFeatureDisplayNames,
    useFeatureGroups,
    usePinnedFeatures
} from "../../hooks/DataHooks";
import { useCloseWindow, useWindowManager } from "../../hooks/WindowHooks";
import HelpContent from "../Help/HelpContent";
import * as utils from "../../utils/utils";

const GUIDANCE_PATH = "correlation_page:general_correlation";
const CORRELATION_OPTIONS = [
    { name: "sorted", displayName: "Correlation" },
    { name: "alphabetical", displayName: "Alphabetical" }
];

function makeServerRequestObj(algorithmName, features, parameters) {
    return {
        routine: "algorithm",
        algorithmName,
        algorithmType: "correlation",
        dataFeatures: features.map(feature => feature.get("feature")).toJS(),
        downsampled: false,
        file: null,
        guidance: null,
        identification: { id: "dev0" },
        parameters: [],
        dataSelections: []
    };
}

function GroupSelectDialog(props) {
    const [groups, createFeatureGroup] = useFeatureGroups();
    const changeGroup = useChangeFeatureGroup();
    const [groupNameInputBuffer, setGroupNameInputBuffer] = useState("");
    const [_, setAllowHotkeys] = useAllowGraphHotkeys();

    function onClose() {
        setGroupNameInputBuffer("");
        props.groupSelectDialogVisibleState[1](false);
    }

    function onGroupNameInput(e) {
        setGroupNameInputBuffer(e.target.value);
    }

    function onGroupSelect(group) {
        props.selectedFeatures.forEach(featureName => changeGroup(featureName, group.get("id")));
        onClose();
    }

    function onGroupCreate() {
        createFeatureGroup(groupNameInputBuffer, props.selectedFeatures, true);
        onClose();
    }

    const filteredGroups = groups.filter(group =>
        group
            .get("name")
            .toLowerCase()
            .startsWith(groupNameInputBuffer.toLowerCase())
    );

    const canCreateNewGroup =
        groupNameInputBuffer && groups.every(group => group.get("name") !== groupNameInputBuffer);

    return (
        <Dialog
            open={props.groupSelectDialogVisibleState[0]}
            onClose={onClose}
            className="group-select-dialog"
        >
            <DialogTitle disableTypography className="group-select-dialog-title">
                <Typography variant="h6">Choose group</Typography>
                <IconButton onClick={onClose} style={{ color: "white" }}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent className="group-select-dialog-content">
                <TextField
                    autoFocus
                    variant="filled"
                    className="group-select-text-input"
                    label="Group name"
                    value={groupNameInputBuffer}
                    type="text"
                    InputLabelProps={{ shrink: true }}
                    onChange={onGroupNameInput}
                    InputProps={{ classes: { root: "input-box" } }}
                    FormHelperTextProps={{ classes: { root: "helper-text" } }}
                    onFocus={_ => setAllowHotkeys(false)}
                    onBlur={_ => setAllowHotkeys(true)}
                />
                <List className="group-select-dialog-group-list">
                    {canCreateNewGroup ? (
                        <ListItem
                            button
                            onClick={onGroupCreate}
                            className="group-select-dialog-group-list-item"
                        >
                            + Create: {groupNameInputBuffer}
                        </ListItem>
                    ) : null}
                    {filteredGroups.map(group => (
                        <ListItem
                            key={group.get("id")}
                            button
                            onClick={_ => onGroupSelect(group)}
                            className="group-select-dialog-group-list-item"
                        >
                            {group.get("name")}
                        </ListItem>
                    ))}
                </List>
            </DialogContent>
        </Dialog>
    );
}

function CorrelationContent(props) {
    const features = props.features;
    const [lastReq, setLastReq] = useState();
    const [data, setData] = useState({ ordering: [], corr_matrix: [] });
    const [needsUpdate, setNeedsUpdate] = useState(true);
    const [selectedFeatures, setSelectedFeatures] = useState([]);
    const [currentSortOption, setCurrentSortOption] = useState(CORRELATION_OPTIONS[0].name);
    const groupSelectDialogVisibleState = useState(false);
    const [groupSelectDialogVisible, setGroupSelectDialogVisible] = groupSelectDialogVisibleState;
    const closeWindow = useCloseWindow(props.win);
    const [helpMode, setHelpMode] = useState(false);
    useEffect(
        _ => {
            if (!needsUpdate || !features) return;
            const requestObj = makeServerRequestObj(currentSortOption, features);
            setLastReq(requestObj);
            const { req, cancel } = utils.makeSimpleRequest(requestObj);
            req.then(data => {
                setData(data);
                setNeedsUpdate(false);
            });
            return cancel;
        },
        [needsUpdate, currentSortOption, features]
    );

    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());
    const [chartRevision, setChartRevision] = useState(0);
    const [chartState, setChartState] = useState({
        data: [
            {
                x: data.ordering,
                y: data.ordering,
                z: utils.unzip(data.corr_matrix),
                type: "heatmap",
                showscale: true,
                colorscale: [
                    [0, "rgb(255,255,255)"],
                    [1, "rgb(8,48,107)"]
                ]
            }
        ],
        layout: {
            xaxis: {
                tickangle: -45
            },
            yaxis: {},
            autosize: true,
            margin: { t: 0, r: 32 },
            hovermode: false,
            titlefont: { size: 5 },
            annotations: []
        },
        config: {
            displaylogo: false,
            displayModeBar: false,
            staticPlot: true
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

    useEffect(
        _ => {
            chartState.data[0].x = data.ordering;
            chartState.data[0].y = data.ordering;
            chartState.data[0].z = data.corr_matrix;
            chartState.layout.annotations = data.ordering
                .map((feature, idx, ary) => {
                    const selected = selectedFeatures.includes(feature);
                    return {
                        text: feature,
                        xref: "paper",
                        yref: "y",
                        xanchor: "right",
                        x: 0,
                        xshift: -5,
                        y: idx,
                        font: {
                            color: selected ? "rgb(255,255,255)" : "rgb(0,0,0)"
                        },
                        bgcolor: selected ? "rgb(8,48,107)" : "rgb(255,255,255)",
                        opacity: 1,
                        showarrow: false,
                        captureevents: true,
                        borderpad: 2
                    };
                })
                .concat(
                    data.corr_matrix
                        .map((row, rowIdx) =>
                            row.map((val, colIdx) => ({
                                xref: "x",
                                yref: "y",
                                x: data.ordering[colIdx],
                                y: data.ordering[rowIdx],
                                text: +val.toFixed(2), // https://stackoverflow.com/questions/11832914/round-to-at-most-2-decimal-places-only-if-necessary
                                showarrow: false,
                                font: { color: val <= 0.5 ? "rgb(0,0,0)" : "rgb(255,255,255)" }
                            }))
                        )
                        .flat()
                );
            updateChartRevision();
        },
        [data, selectedFeatures]
    );

    function handleClickAnnotation(e) {
        const clickedFeature = e.annotation.text;
        setSelectedFeatures(selectedFeatures =>
            selectedFeatures.includes(clickedFeature)
                ? selectedFeatures.filter(feature => feature !== clickedFeature)
                : selectedFeatures.concat([clickedFeature])
        );
    }

    function handleDeselectAll() {
        setSelectedFeatures([]);
    }

    function handleChangeSorting(e) {
        setCurrentSortOption(e.target.value);
        setNeedsUpdate(true);
    }

    function handleAddSelectedToGroup() {
        setGroupSelectDialogVisible(true);
    }

    const selectButtonClasses = classnames({
        ["select-button"]: true,
        disabled: !selectedFeatures.length
    });

    return (
        <div className="correlation-container">
            <ReactResizeDetector
                handleWidth
                handleHeight
                onResize={_ => chart.current.resizeHandler()}
            >
                <div className="correlation-top-bar">
                    <IconButton>
                        <HelpIcon onClick={_ => setHelpMode(mode => !mode)} />
                    </IconButton>
                </div>
                {helpMode ? (
                    <HelpContent hidden={!helpMode} guidancePath={GUIDANCE_PATH} />
                ) : (
                    <React.Fragment>
                        <div className="correlation-controls">
                            <div className="correlation-controls-buttons">
                                <button
                                    className={selectButtonClasses}
                                    onClick={handleAddSelectedToGroup}
                                    disabled={!selectedFeatures.length}
                                >
                                    add selected to group
                                </button>
                                <button className="deselect-button" onClick={handleDeselectAll}>
                                    de-select all
                                </button>
                            </div>
                            <div className="correlation-sort-select">
                                <label>Sort Features by</label>
                                <select onChange={handleChangeSorting} value={currentSortOption}>
                                    {CORRELATION_OPTIONS.map(opt => (
                                        <option value={opt.name} key={opt.name}>
                                            {opt.displayName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="correlation-circular-progress" hidden={!needsUpdate}>
                            <WindowCircularProgress />
                        </div>
                        <div className="correlation-plot-container">
                            <Plot
                                ref={chart}
                                data={chartState.data}
                                layout={chartState.layout}
                                config={chartState.config}
                                style={{ width: "100%", height: "430px" }}
                                useResizeHandler
                                onInitialized={figure => setChartState(figure)}
                                onUpdate={figure => setChartState(figure)}
                                divId={chartId}
                                onClickAnnotation={handleClickAnnotation}
                            />
                        </div>
                        <div className="correlation-cancel-button-row">
                            <button onClick={closeWindow}>done</button>
                        </div>
                        <GroupSelectDialog
                            groupSelectDialogVisibleState={groupSelectDialogVisibleState}
                            selectedFeatures={selectedFeatures}
                        />
                    </React.Fragment>
                )}
            </ReactResizeDetector>
        </div>
    );
}

function Correlation(props) {
    // Window initialization
    const win = useWindowManager(props, {
        width: 600,
        height: 680,
        isResizable: true,
        title: "Correlation"
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

    return <CorrelationContent features={features} win={win} />;
}
export default Correlation;
