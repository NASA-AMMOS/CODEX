// This component creates a window that allows users to configure a new classification run.
import React, { useEffect, useState, useReducer } from "react";
import * as classificationRegressionTypes from "constants/classificationRegressionTypes";
import * as classificationFunctions from "components/Classification/classificationFunctions";
import * as classificationActions from "actions/classificationRegressionActions";
import Button from "@material-ui/core/Button";
import { bindActionCreators } from "redux";
import "components/Classification/classification.scss";
import { connect } from "react-redux";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormGroup from "@material-ui/core/FormGroup";
import Checkbox from "@material-ui/core/Checkbox";
import TextField from "@material-ui/core/TextField";
import Typography from "@material-ui/core/Typography";
import classnames from "classnames";
import HelpContent from "components/Help/HelpContent";
import HelpOutline from "@material-ui/icons/HelpOutline";
import Close from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import * as classifierRegressionUtils from "utils/classifierRegressionUtils";
import { useWindowManager } from "hooks/WindowHooks";

function ClassificationHeaderBar(props) {
    return (
        <div className="headerBar">
            <FormControl className="labelDropdown">
                <InputLabel>Labels</InputLabel>
                <Select value={props.label} onChange={e => props.setLabel(e.target.value)}>
                    {props.selectedFeatures.map(f => (
                        <MenuItem key={f} value={f}>
                            {f}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <div>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={_ => props.createAlgoOutput(...props.classificationOutputParams)}
                >
                    Run
                </Button>

                <IconButton onClick={_ => props.setHelpModeState(state => !state)}>
                    <HelpOutline />
                </IconButton>
            </div>
        </div>
    );
}

function HelpBarHeader(props) {
    return (
        <div className="headerBar">
            <h2>{props.title}</h2>
            <IconButton
                className="closeButton"
                onClick={_ => props.setHelpModeState(state => !state)}
            >
                <Close />
            </IconButton>
        </div>
    );
}

function ClassificationOverview(props) {
    const win = useWindowManager(props, {
        width: 850,
        height: 600,
        resizable: false,
        title: "Classification"
    });

    // Create and store classification states
    const [classificationStates, classificationStateDispatch] = useReducer(
        classifierRegressionUtils.stateReducer,
        classifierRegressionUtils.getInitialParamState(
            classificationRegressionTypes.CLASSIFICATION_PARAMS
        )
    );

    const selectedFeatures = props.featureList
        .filter(f => f.get("selected"))
        .map(f => f.get("name"))
        .toJS();

    // Create and store global options for this classification run
    const [crossVal, setCrossVal] = useState(3);

    const searchTypeOptions = ["grid", "random"];
    const [searchType, setSearchType] = useState(searchTypeOptions[0]);

    const scoringOptions = ["accuracy", "precision", "recall"];
    const [scoring, setScoring] = useState(scoringOptions[0]);

    const [activeClassificationName, setActiveClassificationName] = useState(
        classificationStates[0].name
    );

    // When the window loads, we request time estimates from the server for each classification -- this effect
    // handles those Promise returns and updates the classification states as necessary. It also includes
    // a cleanup function that will cancel all requests if the user closes the window.
    useEffect(_ => {
        const requests = Object.entries(classificationRegressionTypes.CLASSIFICATION_PARAMS).map(
            ([name]) => {
                const { req, cancel } = classificationFunctions.getEta(name, selectedFeatures, 100);
                req.then(data =>
                    classificationStateDispatch({
                        type: "updateEta",
                        name,
                        eta: data.eta && Math.ceil(data.eta)
                    })
                );
                return cancel;
            }
        );

        return function cleanup() {
            requests.forEach(cancel => cancel());
        };
    }, []);

    const [helpModeState, setHelpModeState] = useState(false);
    const algoVerb = "classification";

    // Render the HTML for the page.
    // When the user clicks "run", we fire an action that closes this window, creates server requests for data for each selected
    // classification, and then hands them off to a new window defined in ClassificationResult.
    const classificationsSelected = classificationStates.filter(c => c.selected).length;
    const waitTime = classificationStates.reduce((acc, c) => acc + c.eta, 0);
    const waitTimeString = classificationStates.every(c => c.etaLoaded)
        ? waitTime
            ? `${Math.ceil(waitTime / 60)} minutes approximate run time`
            : "Run time not available"
        : "Calculating approximate run time...";

    const [label, setLabel] = useState(selectedFeatures[0]);

    const classificationOutput = [
        classificationRegressionTypes.CLASSIFICATION_ALGO,
        classificationStates,
        selectedFeatures,
        crossVal,
        label,
        searchType,
        scoring,
        props.winId,
        classificationRegressionTypes.CLASSIFICATION_RESULTS_WINDOW
    ];

    return (
        <div className="classificationsContainer">
            {!helpModeState ? (
                <ClassificationHeaderBar
                    selectedFeatures={selectedFeatures}
                    classificationOutputParams={classificationOutput}
                    createAlgoOutput={props.createAlgoOutput}
                    setHelpModeState={setHelpModeState}
                    label={label}
                    setLabel={setLabel}
                />
            ) : (
                <HelpBarHeader
                    setHelpModeState={setHelpModeState}
                    title={"Classification Page Help"}
                />
            )}
            <hr />
            <HelpContent
                hidden={!helpModeState}
                guidancePath={`${algoVerb}_page:general_${algoVerb}`}
            />
            <div className="body" hidden={helpModeState}>
                <div className="leftCol">
                    <Typography variant="subtitle1">
                        Select and Configure Classification(s)
                    </Typography>
                    <div>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={_ =>
                                classificationStateDispatch({
                                    type: "setAllSelections",
                                    selected: true
                                })
                            }
                        >
                            Select All
                        </Button>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={_ =>
                                classificationStateDispatch({
                                    type: "setAllSelections",
                                    selected: false
                                })
                            }
                        >
                            Select None
                        </Button>
                    </div>
                    <FormGroup classes={{ root: "classificationList" }}>
                        {classificationStates.map(classification =>
                            classifierRegressionUtils.makeAlgoRow(
                                activeClassificationName,
                                setActiveClassificationName,
                                classificationStateDispatch,
                                classification
                            )
                        )}
                    </FormGroup>
                </div>
                <div className="rightCol">
                    <div className="paramHeader">
                        <div className="row">
                            <div className="classificationCounts">
                                <span>{classificationsSelected} Classifications selected</span>
                                <span>{waitTimeString}</span>
                            </div>
                            <TextField
                                className="parameterInput"
                                label="Cross Val"
                                margin="normal"
                                variant="filled"
                                type="number"
                                value={crossVal}
                            />
                        </div>
                        <div className="row">
                            <FormControl classes={{ root: "dropdown" }}>
                                <InputLabel>Search Type</InputLabel>
                                <Select
                                    value={searchType}
                                    onChange={e => setSearchType(e.target.value)}
                                >
                                    {searchTypeOptions.map(o => (
                                        <MenuItem key={o} value={o}>
                                            {o.charAt(0).toUpperCase() + o.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <FormControl classes={{ root: "dropdown" }}>
                                <InputLabel>Scoring</InputLabel>
                                <Select value={scoring} onChange={e => setScoring(e.target.value)}>
                                    {scoringOptions.map(o => (
                                        <MenuItem key={o} value={o}>
                                            {o.charAt(0).toUpperCase() + o.slice(1)}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </div>
                    </div>
                    <hr />
                    <div className="classificationParams">
                        <Typography variant="subtitle1">{activeClassificationName}</Typography>
                        {classificationStates
                            .find(c => c.name === activeClassificationName)
                            .paramData.map(param => (
                                <React.Fragment key={activeClassificationName + param.name}>
                                    <hr />
                                    <div>{param.name}</div>
                                    {param.subParams.map((subParam, idx) =>
                                        classifierRegressionUtils.makeSubParamInput(
                                            param.name,
                                            subParam,
                                            activeClassificationName,
                                            classificationStateDispatch,
                                            idx === 0,
                                            props.featureList
                                        )
                                    )}
                                </React.Fragment>
                            ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return {
        featureList: state.data.get("featureList")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        createAlgoOutput: bindActionCreators(classificationActions.createAlgoOutput, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ClassificationOverview);
