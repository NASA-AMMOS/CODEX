// This component creates a window that allows users to configure a new classification run.
import React, { useEffect, useState, useReducer } from "react";
import * as classificationTypes from "constants/classificationTypes";
import * as classificationFunctions from "components/Classification/classificationFunctions";
import * as classificationActions from "actions/classificationActions";
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
                    onClick={_ => props.createClassificationOutput(...props.classificationOutputParams)}
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
            <h2>
                {props.title}
            </h2>
            <IconButton 
                className="closeButton" 
                onClick={_ => props.setHelpModeState(state => !state)}
            >
                <Close />
            </IconButton>
        </div>
    );
}

// Reducer to handle changes to each individual classification's state, which contains info
// about parameters and expected run times.
function classificationStateReducer(classificationState, action) {
    switch (action.type) {
        case "updateEta":
            return classificationState.map(classification =>
                classification.name === action.name
                    ? { ...classification, eta: action.eta, etaLoaded: true }
                    : classification
            );
        case "updateParam":
            return classificationState.map(classification =>
                classification.name === action.classificationName
                    ? {
                          ...classification,
                          paramData: {
                              ...classification.paramData,
                              params: classification.paramData.params.map(param =>
                                  param.name === action.paramName
                                      ? { ...param, value: action.value }
                                      : param
                              )
                          }
                      }
                    : classification
            );
        case "setSelection":
            return classificationState.map(classification =>
                classification.name === action.classificationName
                    ? { ...classification, selected: !classification.selected }
                    : classification
            );
        case "setAllSelections":
            return classificationState.map(classification => {
                return { ...classification, selected: action.selected };
            });
    }
}

function makeNumericInput(param, classificationName, classificationStateDispatch) {
    return (
        <React.Fragment key={param.name}>
            <TextField
                className="parameterInput"
                fullWidth
                label={param.label}
                helperText={param.helperText}
                margin="normal"
                variant="filled"
                type="number"
                value={param.value}
                onChange={e =>
                    classificationStateDispatch({
                        type: "updateParam",
                        classificationName,
                        paramName: param.name,
                        value:
                            param.type === "int"
                                ? parseInt(e.target.value)
                                : parseFloat(e.target.value)
                    })
                }
            />
        </React.Fragment>
    );
}

function makeStringChoiceInput(param, classificationName, classificationStateDispatch) {
    return (
        <FormControl key={param.name}>
            <InputLabel>{param.displayName}</InputLabel>
            <Select
                value={param.value || param.default}
                onChange={e =>
                    classificationStateDispatch({
                        type: "updateParam",
                        classificationName,
                        paramName: param.name,
                        value: e.target.value
                    })
                }
            >
                {param.options.map(f => (
                    <MenuItem key={f} value={f}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

function makeSubParamInput(param, classificationName, classificationStateDispatch) {
    switch (param.type) {
        case "int":
        case "float":
            return makeNumericInput(param, classificationName, classificationStateDispatch);
        case "string":
            return makeStringChoiceInput(param, classificationName, classificationStateDispatch);
    }
}

function makeClassificationRow(
    activeClassificationName,
    setActiveClassificationName,
    classificationStateDispatch,
    classification
) {
    const etaLabel = classification.eta
        ? `(${Math.ceil(classification.eta / 60)} min)`
        : classification.etaLoaded && "(n/a)";
    const rowClass = classnames({
        checkboxRow: true,
        active: classification.name === activeClassificationName
    });
    return (
        <React.Fragment key={classification.name}>
            <div
                key={classification.name}
                className={rowClass}
                onClick={_ => setActiveClassificationName(classification.name)}
            >
                <Checkbox
                    color="primary"
                    checked={classification.selected}
                    onChange={_ =>
                        classificationStateDispatch({
                            type: "setSelection",
                            classificationName: classification.name
                        })
                    }
                />
                <div className="checkboxLabels">
                    <Typography inline className="checkboxLabel">
                        {classification.name}
                    </Typography>
                    <Typography inline className="checkboxLabel" color="textSecondary">
                        {etaLabel}
                    </Typography>
                </div>
            </div>
        </React.Fragment>
    );
}

// Uses the Classification Types constants file to generate state objects for each classification.
function getInitialParamState() {
    return classificationTypes.CLASSIFICATION_TYPES.map(classification => {
        const state = {
            name: classification,
            eta: null,
            etaLoaded: false,
            paramData: classificationTypes.CLASSIFICATION_PARAMS[classification],
            selected: true
        };
        return state;
    });
}

function ClassificationOverview(props) {
    // Create and store classification states
    const [classificationStates, classificationStateDispatch] = useReducer(
        classificationStateReducer,
        getInitialParamState()
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
        const requests = classificationTypes.CLASSIFICATION_TYPES.map(classification => {
            const { req, cancel } = classificationFunctions.getEta(
                classification,
                selectedFeatures,
                100
            );
            req.then(data =>
                classificationStateDispatch({
                    type: "updateEta",
                    name: classification,
                    eta: data.eta && Math.ceil(data.eta)
                })
            );
            return cancel;
        });

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
        classificationStates,
        selectedFeatures,
        crossVal,
        label,
        searchType,
        scoring,
        props.winId
    ];

    return (
        <div className="classificationsContainer">
            { !helpModeState ?
                <ClassificationHeaderBar
                    selectedFeatures = {selectedFeatures}
                    classificationOutputParams = {classificationOutput}
                    createClassificationOutput = {props.createClassificationOutput}
                    setHelpModeState = {setHelpModeState}
                    label = {label}
                    setLabel = {setLabel}
                />
                :
                <HelpBarHeader
                    setHelpModeState = {setHelpModeState}
                    title={"Classification Page Help"}
                />
            }
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
                            makeClassificationRow(
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
                                <React.Fragment key={param.name}>
                                    <hr />
                                    <div>{param.name}</div>
                                    {param.subParams.map(subParam =>
                                        makeSubParamInput(
                                            subParam,
                                            activeClassificationName,
                                            classificationStateDispatch
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
        createClassificationOutput: bindActionCreators(
            classificationActions.createClassificationOutput,
            dispatch
        )
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ClassificationOverview);
