import "components/TopBar/TopBar.css";

import { Button, ButtonGroup } from "reactstrap";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Dropdown, { MenuItem } from "@trendmicro/react-dropdown";
import PropTypes from "prop-types";
import React, { Component, useRef } from "react";

import { openAlgorithm, openDevelopment, openWorkflow } from "actions/ui";
import LoadingBar from "components/LoadingBar/LoadingBar";
import TextField from "@material-ui/core/TextField";
import * as algorithmActions from "actions/algorithmActions";
import * as algorithmTypes from "constants/algorithmTypes";
import * as uiTypes from "constants/uiTypes";
import * as windowTypes from "constants/windowTypes";
import * as workflowTypes from "constants/workflowTypes";
import * as workflowActions from "actions/workflowActions";
import * as windowManagerActions from "actions/windowManagerActions";
import * as classificationActions from "actions/classificationActions";
import * as regressionActions from "actions/regressionActions";
import * as sessionsActions from "actions/sessionsActions";
import * as exportActions from "actions/exportActions";
import * as dataActions from "actions/data";

function SessionBar(props) {
    return (
        <div className="session-bar">
            <ul className="session-bar-list">
                <li className="session-bar-list-element">
                    <input
                        className="session-bar-file-input inputfile"
                        multiple={false}
                        name="files[]"
                        type="file"
                        onChange={e => {
                            props.fileLoad(e.target.files);
                        }}
                        accept=".csv,.npy,.h5"
                    />
                </li>
                <li>
                    <Button className="session-bar-button" onClick={props.requestServerExport}>
                        Export File
                    </Button>
                </li>
                <li>
                    <Button className="session-bar-button" onClick={props.openSessionsWindow}>
                        Load Session
                    </Button>
                </li>
                <li>
                    <Button
                        className="session-bar-button"
                        onClick={() => {
                            props.saveSession(`${props.filename}_${new Date().toISOString()}`);
                        }}
                    >
                        Save Session
                    </Button>
                </li>
            </ul>
        </div>
    );
}

function NavigationBar(props) {
    const defaultBackground = "#05101f";

    const ref = useRef(null);
    const ref_loading = useRef(null);
    const ref_message = useRef(null);

    let timeout = null;

    function createMenuItem(window_type, title) {
        return (
            <MenuItem key={window_type} onSelect={() => props.openWindow(window_type)}>
                {title || window_type}
            </MenuItem>
        );
    }

    function getWorkflowMenuItems() {
        return workflowTypes.WORKFLOW_TYPES.map(workflow => (
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
        return windowTypes.graphs.map(graph => createMenuItem(graph));
    }

    function getAlgorithmsMenuItems() {
        return algorithmTypes.ALGORITHM_TYPES.map(algo => (
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
            <LoadingBar
                ref={r => {
                    ref_loading.current = r;
                }}
            />
            <div id="topBarMenu">
                <Dropdown className="dropdownMain" autoOpen={false}>
                    <Dropdown.Toggle className="dropdownToggle" title="Graphs" />
                    <Dropdown.Menu>{getGraphMenuItems()}</Dropdown.Menu>
                </Dropdown>

                <Dropdown className="dropdownMain" autoOpen={false}>
                    <Dropdown.Toggle className="dropdownToggle" title="Algorithms" />
                    <Dropdown.Menu>
                        {createMenuItem(windowTypes.CLUSTER_ALGORITHM)}
                        {createMenuItem(windowTypes.CLASSIFICATION_WINDOW, "Classification")}
                        {createMenuItem(windowTypes.REGRESSION_WINDOW, "Regression")}

                        {createMenuItem(
                            windowTypes.DIMENSIONALITY_REDUCTION_WINDOW,
                            "Dimensionality Reduction"
                        )}
                    </Dropdown.Menu>
                </Dropdown>

                <Dropdown className="dropdownMain" autoOpen={false}>
                    <Dropdown.Toggle className="dropdownToggle" title="Development" />
                    <Dropdown.Menu>
                        <MenuItem onSelect={() => props.openWindow(windowTypes.DEBUG_WINDOW)}>
                            Open debug window
                        </MenuItem>
                    </Dropdown.Menu>
                </Dropdown>
                <Dropdown className="dropdownMain" autoOpen={false}>
                    <Dropdown.Toggle className="dropdownToggle" title="Workflows" />
                    <Dropdown.Menu>
                        {createMenuItem(windowTypes.EXPLAIN_THIS_WINDOW, "Explain This")}
                        {createMenuItem(windowTypes.FILTER_WINDOW, "Filter")}
                        {createMenuItem(
                            windowTypes.FIND_MORE_LIKE_THIS_WINDOW,
                            "Find More Like This"
                        )}
                        {createMenuItem(
                            windowTypes.GENERAL_CLASSIFIER_WINDOW,
                            "General Classifier"
                        )}
                        {createMenuItem(windowTypes.TABLE_WINDOW, "Table")}
                    </Dropdown.Menu>
                </Dropdown>

                <div className="triTopLeft" />
            </div>
            <div
                id="topBarMessageText"
                ref={r => {
                    ref_message.current = r;
                }}
            />
            <div id="topBarTools">
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
            <SessionBar {...props} />
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
        filename: state.data.get("filename")
    };
};

function mapDispatchToProps(dispatch) {
    return {
        openAlgorithm: (d, n, w, h) => dispatch(openAlgorithm(d, n, w, h)),
        openDevelopment: (d, n) => dispatch(openDevelopment(d, n)),
        openWorkflow: (d, n) => dispatch(openWorkflow(d, n)),
        openWindow: n => dispatch(windowManagerActions.openNewWindow({ windowType: n })),
        createAlgorithm: name => dispatch(algorithmActions.createAlgorithm(name)),
        createWorkflow: name => dispatch(workflowActions.createWorkflow(name)),
        setWindowTileAction: bindActionCreators(windowManagerActions.setWindowTileAction, dispatch),
        openClassificationWindow: bindActionCreators(
            classificationActions.openClassificationWindow,
            dispatch
        ),
        openRegressionWindow: bindActionCreators(regressionActions.openRegressionWindow, dispatch),
        openSessionsWindow: bindActionCreators(sessionsActions.openSessionsWindow, dispatch),
        saveSession: bindActionCreators(sessionsActions.saveSession, dispatch),
        requestServerExport: bindActionCreators(exportActions.requestServerExport, dispatch),
        fileLoad: bindActionCreators(dataActions.fileLoad, dispatch)
    };
}

export { TopBar };
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TopBar);
