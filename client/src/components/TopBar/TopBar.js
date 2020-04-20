import "./TopBar.scss";

import { ButtonGroup } from "reactstrap";
import { Tooltip } from "@material-ui/core";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Dropdown, { MenuItem } from "@trendmicro/react-dropdown";
import PropTypes from "prop-types";
import React, { useRef } from "react";

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
import { fileLoad } from "../../actions/data";
import { openAlgorithm, openDevelopment, openWorkflow } from "../../actions/ui";
import { openNewWindow, setWindowTileAction } from "../../actions/windowManagerActions";
import { useExportModalVisible } from "../../hooks/UIHooks";
import { useSavedSelections, useSelectedFeatureNames } from "../../hooks/DataHooks";
import ControlBar from "../ControlBar/ControlBar";
import SessionBar from "./SessionBar";

function NavigationBar(props) {
    const [features] = useSelectedFeatureNames();
    const defaultBackground = "#05101f";
    const [savedSelections] = useSavedSelections();

    const ref = useRef(null);
    const ref_loading = useRef(null);
    const ref_message = useRef(null);

    const [exportModalVisible, setExportModalVisible] = useExportModalVisible();

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
                onSelect={() => {
                    props.createWorkflow(workflow);
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
                onSelect={() => {
                    props.createAlgorithm(algo);
                }}
            >
                {algo}
            </MenuItem>
        ));
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
                    disabled={props.featureList.every(feature => !feature.get("selected"))}
                >
                    <Dropdown.Toggle className="dropdownToggle" title="Graphs" />
                    <Dropdown.Menu>{getGraphMenuItems()}</Dropdown.Menu>
                </Dropdown>

                <Dropdown className="dropdownMain" autoOpen={false}>
                    <Dropdown.Toggle className="dropdownToggle" title="Algorithms" />
                    <Dropdown.Menu>
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
                    <Dropdown.Menu>
                        <MenuItem onSelect={() => props.openWindow(DEBUG_WINDOW)}>
                            Open debug window
                        </MenuItem>
                    </Dropdown.Menu>
                </Dropdown>
            **/}
                <Dropdown className="dropdownMain" autoOpen={false}>
                    <Dropdown.Toggle className="dropdownToggle" title="Workflows" />
                    <Dropdown.Menu>
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
                <button
                    className="export-button"
                    onClick={_ => setExportModalVisible(!exportModalVisible)}
                >
                    <span>Export</span>
                </button>
                <ButtonGroup>
                    <Dropdown>
                        <Dropdown.Toggle className="dropdownToggle" title="Windows" />
                        <Dropdown.Menu>
                            <MenuItem header>Arrange</MenuItem>
                            <MenuItem onSelect={() => props.setWindowTileAction(true)}>
                                Tile
                            </MenuItem>
                        </Dropdown.Menu>
                    </Dropdown>
                </ButtonGroup>
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

// validation
TopBar.propTypes = {
    openAlgorithm: PropTypes.func.isRequired,
    openWorkflow: PropTypes.func.isRequired,
    setWindowTileAction: PropTypes.func.isRequired
};

// redux store
const mapStateToProps = state => {
    return {
        data: state.data,
        ui: state.ui,
        filename: state.data.get("filename"),
        featureList: state.data.get("featureList")
    };
};

function mapDispatchToProps(dispatch) {
    return {
        openAlgorithm: (d, n, w, h) => dispatch(openAlgorithm(d, n, w, h)),
        openDevelopment: (d, n) => dispatch(openDevelopment(d, n)),
        openWorkflow: (d, n) => dispatch(openWorkflow(d, n)),
        openWindow: n => dispatch(openNewWindow({ windowType: n })),
        createAlgorithm: name => dispatch(createAlgorithm(name)),
        createWorkflow: name => dispatch(createWorkflow(name)),
        setWindowTileAction: bindActionCreators(setWindowTileAction, dispatch),
        fileLoad: bindActionCreators(fileLoad, dispatch)
    };
}

export { TopBar };
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TopBar);
