import "./TopBar.scss";

import { ButtonGroup } from "reactstrap";
import { Tooltip } from "@material-ui/core";
import { useDispatch } from "react-redux";
import Dropdown, { MenuItem } from "@trendmicro/react-dropdown";
import React, { useRef, useState } from "react";

import { ALGORITHM_TYPES } from "../../constants/algorithmTypes";
import {
    CLUSTER_ALGORITHM,
    CORRELATION_WINDOW,
    DIMENSIONALITY_REDUCTION_WINDOW,
    EXPLAIN_THIS_WINDOW,
    NORMALIZATION_WINDOW,
    NUM_FEATURES_REQUIRED,
    PEAK_DETECTION_WINDOW,
    REGRESSION_WINDOW,
    TABLE_WINDOW,
    TEMPLATE_SCAN_WINDOW,
    graphs
} from "../../constants/windowTypes";
import { WORKFLOW_TYPES } from "../../constants/workflowTypes";
import { createAlgorithm } from "../../actions/algorithmActions";
import { createWorkflow } from "../../actions/workflowActions";
import { openNewWindow, setWindowTileAction } from "../../actions/windowManagerActions";
import { useActiveWindow, useWindowList } from "../../hooks/WindowHooks";
import { useExportModalVisible } from "../../hooks/UIHooks";
import {
    useFeatureMetadata,
    useSavedSelections,
    useSelectedFeatureNames
} from "../../hooks/DataHooks";
import ControlBar from "../ControlBar/ControlBar";
import SessionBar from "./SessionBar";

function NavigationBar(props) {
    const [featureNames] = useSelectedFeatureNames();
    const features = new Set(featureNames);
    const defaultBackground = "#05101f";
    const [savedSelections] = useSavedSelections();
    const dispatch = useDispatch();

    const ref = useRef(null);
    const ref_loading = useRef(null);
    const ref_message = useRef(null);

    const [exportModalVisible, setExportModalVisible] = useExportModalVisible();
    const featureList = useFeatureMetadata();
    const windows = useWindowList();
    const [activeWindow, setActiveWindow] = useActiveWindow();
    const [pinnedActiveWindow, setPinnedActiveWindow] = useState();

    let timeout = null;

    function createMenuItem(window_type, title) {
        const [disabled, errMsg] = (function() {
            const requiredNumFeatures = NUM_FEATURES_REQUIRED[window_type];
            if (requiredNumFeatures === undefined) return [false, null];
            if (typeof requiredNumFeatures === "number") {
                if (features.size !== requiredNumFeatures) {
                    return [true, `Requires ${requiredNumFeatures} selected features`];
                }
                return [false, null];
            }

            const [featuresErr, featuresErrMsg] = (function() {
                if (requiredNumFeatures[1]) {
                    if (requiredNumFeatures[0] === requiredNumFeatures[1])
                        return features.size !== requiredNumFeatures[0]
                            ? [
                                  true,
                                  `Requires selection of ${requiredNumFeatures[0]} feature${
                                      requiredNumFeatures[0] > 1 ? "s" : ""
                                  }`
                              ]
                            : [false, ""];
                    return features.size < requiredNumFeatures[0] ||
                        features.size > requiredNumFeatures[1]
                        ? [
                              true,
                              `Requires between ${requiredNumFeatures[0]} and ${
                                  requiredNumFeatures[1]
                              } selected features`
                          ]
                        : [false, null];
                }
                return features.size < requiredNumFeatures[0]
                    ? [
                          true,
                          `Requires at least ${requiredNumFeatures[0]} selected feature${
                              requiredNumFeatures[0] > 1 ? "s" : ""
                          }`
                      ]
                    : [false, null];
            })();

            const [selErr, selErrMsg] =
                requiredNumFeatures[2] && savedSelections.length < requiredNumFeatures[2]
                    ? [
                          true,
                          featuresErr
                              ? ` and at least ${requiredNumFeatures[2]} selection${
                                    requiredNumFeatures > 1 ? "s" : ""
                                }`
                              : `At least ${requiredNumFeatures[2]} selection${
                                    requiredNumFeatures > 1 ? "s" : ""
                                } required`
                      ]
                    : [false, null];

            const err = featuresErr || selErr;
            const errMsg = (featuresErr ? featuresErrMsg : "") + (selErr ? selErrMsg : "");
            return [err, errMsg];
        })();

        return (
            <MenuItem
                key={window_type}
                classes={{root: "actionMenuItem"}}
                onSelect={() => props.openWindow(window_type)}
                disabled={disabled}
            >
                <Tooltip
                    title={errMsg}
                    disableFocusListener={!disabled}
                    disableHoverListener={!disabled}
                >
                    <span>{title || window_type}</span>
                </Tooltip>
            </MenuItem>
        );
    }

    function getWorkflowMenuItems() {
        return WORKFLOW_TYPES.map(workflow => (
            <MenuItem
                key={workflow}
                classes={{root: "actionMenuItem"}}
                onSelect={() => {
                    dispatch(createWorkflow(workflow));
                }}
            >
                {workflow}
            </MenuItem>
        ));
    }

    function getGraphMenuItems() {
        // WINDOW TYPES
        return graphs.map(graph => createMenuItem(graph));
    }

    function getAlgorithmsMenuItems() {
        return ALGORITHM_TYPES.map(algo => (
            <MenuItem
                key={algo}
                classes={{root: "actionMenuItem"}}
                onSelect={() => {
                    dispatch(createAlgorithm(algo));
                }}
            >
                {algo}
            </MenuItem>
        ));
    }

    function handleWindowMenuItemClick(id) {
        return _ => {
            setPinnedActiveWindow(null);
            setActiveWindow(id);
        };
    }

    function handleWindowMenuItemHoverOver(id) {
        return _ => {
            if (!pinnedActiveWindow) {
                setPinnedActiveWindow(activeWindow);
            }
            setActiveWindow(id);
        };
    }

    function handleWindowMenuMouseLeave() {
        if (!pinnedActiveWindow) return;
        setActiveWindow(pinnedActiveWindow);
        setPinnedActiveWindow(null);
    }

    return (
        <div
            className="navigation-bar"
            ref={r => {
                ref.current = r;
            }}
        >
            <div id="topBarMenu">
                <Dropdown
                    className="dropdownMain"
                    autoOpen={false}
                    disabled={featureList.every(feature => !feature.get("selected"))}
                >
                    <Dropdown.Toggle className="dropdownToggle actionMenuLabel" title="Graphs" />
                    <Dropdown.Menu className="actionMenu">{getGraphMenuItems()}</Dropdown.Menu>
                </Dropdown>

                <Dropdown className="dropdownMain" autoOpen={false}>
                    <Dropdown.Toggle className="dropdownToggle actionMenuLabel" title="Algorithms" />
                    <Dropdown.Menu className="actionMenu">
                        {createMenuItem(CLUSTER_ALGORITHM, "Clustering")}
                        {createMenuItem(
                            DIMENSIONALITY_REDUCTION_WINDOW,
                            "Dimensionality Reduction"
                        )}
                        {createMenuItem(NORMALIZATION_WINDOW, "Normalization")}
                        {createMenuItem(PEAK_DETECTION_WINDOW, "Peak Detection")}
                        {createMenuItem(REGRESSION_WINDOW, "Regression")}
                        {createMenuItem(TEMPLATE_SCAN_WINDOW, "Template Scan")}
                        {createMenuItem(CORRELATION_WINDOW, "Correlation")}
                    </Dropdown.Menu>
                </Dropdown>

                {/** <Dropdown className="dropdownMain" autoOpen={false}>
                    <Dropdown.Toggle className="dropdownToggle" title="Development" />
                    <Dropdown.Menu className="actionMenu">
                        <MenuItem onSelect={() => props.openWindow(DEBUG_WINDOW)}>
                            Open debug window
                        </MenuItem>
                    </Dropdown.Menu>
                </Dropdown>
            **/}
                <Dropdown className="dropdownMain" autoOpen={false}>
                    <Dropdown.Toggle className="dropdownToggle actionMenuLabel" title="Workflows" />
                    <Dropdown.Menu className="actionMenu">
                        {createMenuItem(EXPLAIN_THIS_WINDOW, "Explain This")}
                        {createMenuItem(TABLE_WINDOW, "Table")}
                    </Dropdown.Menu>
                </Dropdown>

                <div className="triTopLeft" />
            </div>
            {/*
                <div
                    id="topBarMessageText"
                    ref={r => {
                        ref_message.current = r;
                    }}
                />
            */}
            <ControlBar />
            <div id="topBarTools">
                <ButtonGroup>
                    <Dropdown>
                        <Dropdown.Toggle className="dropdownToggle actionMenuLabel" title="Windows" />
                        <Dropdown.Menu>
                            <MenuItem header>Arrange</MenuItem>
                            <MenuItem onSelect={() => dispatch(setWindowTileAction(true))}>
                                Tile
                            </MenuItem>
                            <MenuItem divider />
                            {windows.map(win => (
                                <MenuItem
                                    key={win.get("id")}
                                    onClick={handleWindowMenuItemClick(win.get("id"))}
                                    onMouseOver={handleWindowMenuItemHoverOver(win.get("id"))}
                                >
                                    {win.get("title")}
                                </MenuItem>
                            ))}
                        </Dropdown.Menu>
                    </Dropdown>
                </ButtonGroup>
                <button
                    className="export-button"
                    onClick={_ => setExportModalVisible(!exportModalVisible)}
                >
                    <span>Export</span>
                </button>
                <div className="triTopRight" />
            </div>
        </div>
    );
}

function TopBar(props) {
    return (
        <div className="top-bar">
            <SessionBar />
            <NavigationBar {...props} />
        </div>
    );
}

export default TopBar;
