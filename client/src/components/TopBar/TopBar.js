import "components/TopBar/TopBar.css";

import { Button, ButtonGroup } from "reactstrap";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import Dropdown, { MenuItem } from "@trendmicro/react-dropdown";
import PropTypes from "prop-types";
import React, { Component } from "react";

import { brushClear } from "actions/data";
import { openAlgorithm, openReport, openDevelopment, brushtypeSet, modeSet } from "actions/ui";
import Import from "components/Import/Import";
import LoadingBar from "components/LoadingBar/LoadingBar";
import * as algorithmActions from "actions/algorithmActions";
import * as algorithmTypes from "constants/algorithmTypes";
import * as graphActions from "actions/graphActions";
import * as uiTypes from "constants/uiTypes";
import * as windowManagerActions from "actions/windowManagerActions";
import * as classifierActions from "actions/classifierActions";

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

    getGraphMenuItems() {
        return uiTypes.GRAPH_TYPES.map(graph => (
            <MenuItem
                key={graph}
                onSelect={() => {
                    this.props.createGraph(graph);
                }}
            >
                {graph}
            </MenuItem>
        ));
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

    componentDidMount() {
        //controller.setMessageText = this.setMessageText;
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
                        <Dropdown.Toggle className="dropdownToggle" title="Files" />
                        <Dropdown.Menu>
                            <MenuItem>
                                <Import
                                    setProgress={p => {
                                        this.setLoadingPercent(p);
                                    }}
                                    completedLoad={() => {}}
                                />
                            </MenuItem>
                        </Dropdown.Menu>
                    </Dropdown>

                    <Dropdown className="dropdownMain" autoOpen={false}>
                        <Dropdown.Toggle className="dropdownToggle" title="Graphs" />
                        <Dropdown.Menu>{this.getGraphMenuItems()}</Dropdown.Menu>
                    </Dropdown>

                    <Dropdown className="dropdownMain" autoOpen={false}>
                        <Dropdown.Toggle className="dropdownToggle" title="Algorithms" />
                        <Dropdown.Menu>
                            {this.getAlgorithmsMenuItems()}
                            <MenuItem onSelect={this.props.openClassifierWindow}>
                                Classifiers
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
                        </Dropdown.Menu>
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
    brushtypeSet: PropTypes.func.isRequired,
    modeSet: PropTypes.func.isRequired,
    createGraph: PropTypes.func.isRequired,
    setWindowTileAction: PropTypes.func.isRequired
};

// redux store
const mapStateToProps = state => {
    return {
        data: state.data,
        ui: state.ui
    };
};

function mapDispatchToProps(dispatch) {
    return {
        brushClear: () => dispatch(brushClear()),

        openAlgorithm: (d, n, w, h) => dispatch(openAlgorithm(d, n, w, h)),
        openReport: (d, n, w, h) => dispatch(openReport(d, n, w, h)),
        openDevelopment: (d, n) => dispatch(openDevelopment(d, n)),
        brushtypeSet: t => dispatch(brushtypeSet(t)),
        modeSet: m => dispatch(modeSet(m)),
        createGraph: name => dispatch(graphActions.createGraph(name)),
        createAlgorithm: name => dispatch(algorithmActions.createAlgorithm(name)),
        setWindowTileAction: bindActionCreators(windowManagerActions.setWindowTileAction, dispatch),
        openClassifierWindow: bindActionCreators(classifierActions.openClassifierWindow, dispatch)
    };
}

export { TopBar };
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(TopBar);
