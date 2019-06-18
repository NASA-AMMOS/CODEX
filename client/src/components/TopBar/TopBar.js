import "components/TopBar/TopBar.css";

import { Button, ButtonGroup } from "reactstrap";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Dropdown, { MenuItem } from "@trendmicro/react-dropdown";
import PropTypes from "prop-types";
import React, { Component } from "react";

import { brushClear } from "actions/data";
import {
    openAlgorithm,
    openReport,
    openDevelopment,
    openWorkflow,
    brushtypeSet,
    modeSet
} from "actions/ui";
import LoadingBar from "components/LoadingBar/LoadingBar";
import * as algorithmActions from "actions/algorithmActions";
import * as algorithmTypes from "constants/algorithmTypes";
import * as graphActions from "actions/graphActions";
import * as uiTypes from "constants/uiTypes";
import * as windowTypes from "constants/windowTypes";
import * as workflowTypes from "constants/workflowTypes";
import * as workflowActions from "actions/workflowActions";
import * as windowManagerActions from "actions/windowManagerActions";
import * as classificationActions from "actions/classificationActions";
import * as regressionActions from "actions/regressionActions";
import * as sessionsActions from "actions/sessionsActions";
import * as dimensionalityReductionActions from "actions/dimensionalityReductionActions";
import * as exportActions from "actions/exportActions";
import * as dataActions from "actions/data";

class TopBar extends Component {
    constructor(props) {
        super(props);

        this.state = {
            rSelected: 2,
            brushSelected: "freehand",
            gridSize: 10
        };

        this.defaultBackground = "#05101f";

        this.ref = null;
        this.ref_loading = null;
        this.ref_message = null;

        this.timeout = null;

        // handler bindings
        this.setLoadingPercent = this.setLoadingPercent.bind(this);
        this.toggleIndeterminateLoading = this.toggleIndeterminateLoading.bind(this);
        this.setMessageText = this.setMessageText.bind(this);
    }

    createMenuItem(window_type, title) {
        return (
            <MenuItem key={window_type} onSelect={() => this.props.openWindow(window_type)}>
                {title || window_type}
            </MenuItem>
        );
    }
    getWorkflowMenuItems() {
        return workflowTypes.WORKFLOW_TYPES.map(workflow => (
            <MenuItem
                key={workflow}
                onSelect={() => {
                    this.props.createWorkflow(workflow);
                }}
            >
                {workflow}
            </MenuItem>
        ));
    }

    getGraphMenuItems() {
        // WINDOW TYPES
        return windowTypes.graphs.map(graph => this.createMenuItem(graph));
    }

    getAlgorithmsMenuItems() {
        return algorithmTypes.ALGORITHM_TYPES.map(algo => (
            <MenuItem
                key={algo}
                onSelect={() => {
                    this.props.createAlgorithm(algo);
                }}
            >
                {algo}
            </MenuItem>
        ));
    }

    getReportsMenuItems() {
        let menuItems = [];
        for (let r of this.vars.reports) {
            menuItems.push(
                <MenuItem
                    key={r.name}
                    onSelect={() => {
                        this.props.openReport(r.name);
                    }}
                >
                    {r.name}
                </MenuItem>
            );
        }
        return menuItems;
    }

    onRadioBtnClick(rSelected) {
        switch (rSelected) {
            case 1:
                this.props.modeSet("zoom");
                break;
            case 2:
                this.props.brushtypeSet(this.state.brushSelected);
                this.props.modeSet("select");
                break;
            case 3:
                this.props.modeSet("snap");
                break;
            default:
                break;
        }
        this.setState({ rSelected });
    }
    setBrushSelected(eventKey) {
        if (eventKey === "clear") {
            this.props.brushClear();
        } else {
            this.props.brushtypeSet(eventKey);
            this.setState({ brushSelected: eventKey });
        }
    }
    setGridSize(size) {}

    setLoadingPercent(p) {
        if (this.ref_loading) this.ref_loading.setLoadingPercent(p);
    }
    toggleIndeterminateLoading(on, message) {
        if (this.ref_loading) this.ref_loading.toggleIndeterminateLoading(on, message);
    }
    setMessageText(message, status) {
        if (this.ref && this.ref_message) {
            this.ref_message.textContent = message;
            this.ref_message.style.opacity = 1;

            let background = this.defaultBackground;
            switch (status.toLowerCase()) {
                case "note":
                    background = "#49baff";
                    break;
                case "warning":
                    background = "#ffa749";
                    break;
                case "error":
                    background = "#ff4949";
                    break;
                default:
                    break;
            }

            this.ref.style.background = background;

            clearTimeout(this.timeout);
            this.timeout = setTimeout(() => {
                this.ref_message.style.opacity = 0;
                this.ref.style.background = this.defaultBackground;
            }, 5000);
        }
    }

    render() {
        let devDisplay = "inline-block";
        // Don't show the development dropdown in production mode
        if (process.env.NODE_ENV === "production") devDisplay = "none";

        return (
            <div
                className="TopBar"
                ref={r => {
                    this.ref = r;
                }}
            >
                <LoadingBar
                    ref={r => {
                        this.ref_loading = r;
                    }}
                />
                <div id="topBarMenu">
                    <Dropdown className="dropdownMain" autoOpen={false}>
                        <Dropdown.Toggle className="dropdownToggle" title="Sessions" />
                        <Dropdown.Menu>
                            <MenuItem onSelect={this.props.openSessionsWindow}>
                                Load Session
                            </MenuItem>
                            <MenuItem
                                onSelect={() => {
                                    this.props.saveSession(
                                        `${this.props.filename}_${new Date().toISOString()}`
                                    );
                                }}
                            >
                                Save Session
                            </MenuItem>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown className="dropdownMain" autoOpen={false}>
                        <Dropdown.Toggle className="dropdownToggle" title="Files" />
                        <Dropdown.Menu>
                            <MenuItem style={{ position: "relative" }}>
                                <input
                                    className="inputfile"
                                    multiple={false}
                                    name="files[]"
                                    type="file"
                                    onChange={e => this.props.fileLoad(e.target.files)}
                                    accept=".csv,.npy,.h5"
                                />
                                Import
                            </MenuItem>
                            <MenuItem onSelect={this.props.requestServerExport}>Export</MenuItem>
                        </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown className="dropdownMain" autoOpen={false}>
                        <Dropdown.Toggle className="dropdownToggle" title="Graphs" />
                        <Dropdown.Menu>{this.getGraphMenuItems()}</Dropdown.Menu>
                    </Dropdown>

                    <Dropdown className="dropdownMain" autoOpen={false}>
                        <Dropdown.Toggle className="dropdownToggle" title="Algorithms" />
                        <Dropdown.Menu>
                            {this.createMenuItem(windowTypes.CLUSTER_ALGORITHM)}
                            {this.createMenuItem(
                                windowTypes.CLASSIFICATION_WINDOW,
                                "Classification"
                            )}
                            {this.createMenuItem(windowTypes.REGRESSION_WINDOW, "Regression")}

                            {this.createMenuItem(
                                windowTypes.DIMENSIONALITY_REDUCTION_RESULTS_WINDOW,
                                "Dimensionality Reduction"
                            )}
                            <MenuItem onSelect={this.props.openDimensionalityReductionWindow}>
                                Dimensionality Reduction (legacy)
                            </MenuItem>
                        </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown
                        style={{ display: devDisplay }}
                        className="dropdownMain"
                        autoOpen={false}
                    >
                        <Dropdown.Toggle className="dropdownToggle" title="Development" />
                        <Dropdown.Menu>
                            <MenuItem
                                onSelect={eventKey => {
                                    this.props.openDevelopment("nrandomscatters");
                                }}
                            >
                                8 Random Scatters
                            </MenuItem>
                            <MenuItem
                                onSelect={eventKey => {
                                    this.props.openDevelopment("sparklinerange");
                                }}
                            >
                                Create range slider window
                            </MenuItem>
                            <MenuItem
                                onSelect={() => this.props.openWindow(windowTypes.DEBUG_WINDOW)}
                            >
                                Open debug window
                            </MenuItem>
                        </Dropdown.Menu>
                    </Dropdown>
                    <Dropdown
                        style={{ display: devDisplay }}
                        className="dropdownMain"
                        autoOpen={false}
                    >
                        <Dropdown.Toggle className="dropdownToggle" title="Workflows" />
                        <Dropdown.Menu>{this.getWorkflowMenuItems()}</Dropdown.Menu>
                    </Dropdown>

                    <div className="triTopLeft" />
                </div>
                <div
                    id="topBarMessageText"
                    ref={r => {
                        this.ref_message = r;
                    }}
                />
                <div id="topBarTools">
                    <ButtonGroup>
                        <Dropdown>
                            <Dropdown.Toggle className="dropdownToggle" title="Windows" />
                            <Dropdown.Menu>
                                <MenuItem header>Arrange</MenuItem>
                                <MenuItem onSelect={() => this.props.setWindowTileAction(true)}>
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
}

// validation
TopBar.propTypes = {
    brushClear: PropTypes.func.isRequired,
    openAlgorithm: PropTypes.func.isRequired,
    openReport: PropTypes.func.isRequired,
    openWorkflow: PropTypes.func.isRequired,
    brushtypeSet: PropTypes.func.isRequired,
    modeSet: PropTypes.func.isRequired,
    createGraph: PropTypes.func.isRequired,
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
        brushClear: () => dispatch(brushClear()),
        openAlgorithm: (d, n, w, h) => dispatch(openAlgorithm(d, n, w, h)),
        openReport: (d, n, w, h) => dispatch(openReport(d, n, w, h)),
        openDevelopment: (d, n) => dispatch(openDevelopment(d, n)),
        openWorkflow: (d, n) => dispatch(openWorkflow(d, n)),
        brushtypeSet: t => dispatch(brushtypeSet(t)),
        modeSet: m => dispatch(modeSet(m)),
        openWindow: n => dispatch(windowManagerActions.openNewWindow({ windowType: n })),
        createGraph: name => dispatch(graphActions.createGraph(name)),
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
        openDimensionalityReductionWindow: bindActionCreators(
            dimensionalityReductionActions.openDimensionalityReductionWindow,
            dispatch
        ),
        requestServerExport: bindActionCreators(exportActions.requestServerExport, dispatch),
        fileLoad: bindActionCreators(dataActions.fileLoad, dispatch)
    };
}

export { TopBar };
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TopBar);
