import React, { useState, useEffect } from "react";
import * as algorithmTypes from "constants/algorithmTypes";
import "components/Algorithms/algorithmStyles.scss";
import AlgorithmHelpContent from "components/Algorithms/AlgorithmHelpContent";
import classnames from "classnames";
import SubalgoChart from "components/Algorithms/SubalgoChart";
import { getSubAlgorithmData } from "components/Algorithms/algorithmFunctions";
import SubalgoParams from "components/Algorithms/SubalgoParams";
import SubalgoOutputParams from "components/Algorithms/SubalgoOutputParams";
import HelpOutline from "@material-ui/icons/HelpOutline";
import Close from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import * as algorithmActions from "actions/algorithmActions";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import PropTypes from "prop-types";

function handleRunAlgorithm(props) {
    if (!props.subalgoState.serverData.eta) return; // Don't run the algorithm until we have a time estimate from the server
    props.runAlgorithm(props.subalgoState, props.selectedFeatures, props.winId);
}

function getTitle(props, helpModeState) {
    switch (props.subalgoState.editMode) {
        case algorithmTypes.SUBALGO_MODE_EDIT_PARAMS:
            return helpModeState.active
                ? `Help: ${props.subalgoState.humanName}`
                : "Choose Number of Clusters";
        case algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS:
            return helpModeState.active
                ? `Help : ${props.subalgoState.humanName}`
                : "Choose Clustering Parameters";
    }
}

function getActionButtons(props) {
    switch (props.subalgoState.editMode) {
        case algorithmTypes.SUBALGO_MODE_EDIT_PARAMS:
            return (
                <React.Fragment>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={_ =>
                            props.paramDispatch({
                                type: "changeEditMode",
                                name: props.subalgoState.name
                            })
                        }
                    >
                        Back
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={_ =>
                            props.paramDispatch({
                                type: "changeEditMode",
                                name: props.subalgoState.name,
                                editMode: algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                            })
                        }
                    >
                        Next
                    </Button>
                </React.Fragment>
            );
        case algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS:
            return (
                <React.Fragment>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={_ =>
                            props.paramDispatch({
                                type: "changeEditMode",
                                name: props.subalgoState.name,
                                editMode: algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                            })
                        }
                    >
                        Back
                    </Button>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={_ => handleRunAlgorithm(props)}
                    >
                        Run
                    </Button>
                </React.Fragment>
            );
    }
}

function getBreadcrumbs(props) {
    return (
        <React.Fragment>
            <a
                href="#"
                onClick={_ =>
                    props.paramDispatch({
                        type: "changeEditMode",
                        name: props.subalgoState.name,
                        editMode: null
                    })
                }
            >
                Choose Algorithm
            </a>
            <span>-></span>
            <a
                href="#"
                onClick={_ =>
                    props.paramDispatch({
                        type: "changeEditMode",
                        name: props.subalgoState.name,
                        editMode: algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                    })
                }
            >
                Edit Parameters
            </a>
            <span>-></span>
            <a
                href="#"
                onClick={_ =>
                    props.paramDispatch({
                        type: "changeEditMode",
                        name: props.subalgoState.name,
                        editMode: algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                    })
                }
                className={classnames({
                    "next-step":
                        props.subalgoState.editMode !== algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                })}
            >
                Outputs
            </a>
            <span>-></span>
            <a href="#" onClick={_ => handleRunAlgorithm(props)} className="next-step">
                Run
            </a>
        </React.Fragment>
    );
}

function SubalgoEdit(props) {
    const [helpModeState, setHelpModeState] = useState(false);

    return (
        <React.Fragment>
            <div className="subalgo-edit-header">
                <div className="title">
                    {getTitle(props, helpModeState)}
                    <div className="breadcrumbs">{getBreadcrumbs(props)}</div>
                </div>
                <div>
                    <IconButton onClick={_ => setHelpModeState(state => !state)}>
                        {helpModeState ? <Close /> : <HelpOutline />}
                    </IconButton>
                </div>
            </div>
            <div className="subalgo-detail">
                <div className="params">
                    <SubalgoParams
                        hidden={
                            props.subalgoState.editMode !== algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                        }
                        subalgoState={props.subalgoState}
                        algo={props.algo}
                        paramDispatch={props.paramDispatch}
                        selectedFeatures={props.selectedFeatures}
                        filename={props.filename}
                    />
                    <SubalgoOutputParams
                        hidden={
                            props.subalgoState.editMode !== algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                        }
                        paramDispatch={props.paramDispatch}
                        subalgoState={props.subalgoState}
                        selectedFeatures={props.selectedFeatures}
                    />
                </div>
                <AlgorithmHelpContent
                    hidden={!helpModeState}
                    guidancePath={`${props.baseGuidancePath}:${props.subalgoState.name}`}
                />
                <div className="preview">
                    <SubalgoChart
                        key={props.subalgoState.name}
                        name={props.subalgoState.name}
                        humanName={props.subalgoState.humanName}
                        serverData={props.subalgoState.serverData}
                        loaded={props.subalgoState.loaded}
                        previewMode
                    />
                    <div className="action-buttons">{getActionButtons(props)}</div>
                </div>
            </div>
        </React.Fragment>
    );
}

function mapDispatchToProps(dispatch) {
    return {
        runAlgorithm: bindActionCreators(algorithmActions.runAlgorithm, dispatch)
    };
}

export default connect(
    null,
    mapDispatchToProps
)(SubalgoEdit);
