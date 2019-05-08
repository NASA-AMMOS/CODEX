import React, { useEffect, useState, useReducer } from "react";
import * as classifierTypes from "constants/classifierTypes";
import * as classifierFunctions from "components/Classifiers/classifierFunctions";
import * as classifierActions from "actions/classifierActions";
import Button from "@material-ui/core/Button";
import { bindActionCreators } from "redux";
import "components/Classifiers/classifiers.scss";
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

function classifierStateReducer(classifierState, action) {
    switch (action.type) {
        case "updateEta":
            return classifierState.map(classifier =>
                classifier.name === action.name
                    ? { ...classifier, eta: action.eta, etaLoaded: true }
                    : classifier
            );
        case "updateParam":
            return classifierState.map(classifier =>
                classifier.name === action.classifierName
                    ? {
                          ...classifier,
                          paramData: {
                              ...classifier.paramData,
                              params: classifier.paramData.params.map(param =>
                                  param.name === action.paramName
                                      ? { ...param, value: action.value }
                                      : param
                              )
                          }
                      }
                    : classifier
            );
        case "setSelection":
            return classifierState.map(classifier =>
                classifier.name === action.classifierName
                    ? { ...classifier, selected: !classifier.selected }
                    : classifier
            );
        case "setAllSelections":
            return classifierState.map(classifier => {
                return { ...classifier, selected: action.selected };
            });
    }
}

function makeNumericInput(param, classifierName, classifierStateDispatch) {
    return (
        <React.Fragment>
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
                    classifierStateDispatch({
                        type: "updateParam",
                        classifierName,
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

function makeStringChoiceInput(param, classifierName, classifierStateDispatch) {
    return (
        <FormControl>
            <InputLabel>{param.displayName}</InputLabel>
            <Select
                value={param.value || param.default}
                onChange={e =>
                    classifierStateDispatch({
                        type: "updateParam",
                        classifierName,
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

function makeParamInput(param, classifierName, classifierStateDispatch) {
    switch (param.type) {
        case "int":
        case "float":
            return makeNumericInput(param, classifierName, classifierStateDispatch);
        case "string":
            return makeStringChoiceInput(param, classifierName, classifierStateDispatch);
    }
}

function makeClassifierRow(
    activeClassifierName,
    setActiveClassifierName,
    classifierStateDispatch,
    classifier
) {
    const etaLabel = classifier.eta
        ? `(${Math.ceil(classifier.eta / 60)} min)`
        : classifier.etaLoaded && "(n/a)";
    const rowClass = classnames({
        checkboxRow: true,
        active: classifier.name === activeClassifierName
    });
    return (
        <React.Fragment key={classifier.name}>
            <div
                key={classifier.name}
                className={rowClass}
                onClick={_ => setActiveClassifierName(classifier.name)}
            >
                <Checkbox
                    color="primary"
                    checked={classifier.selected}
                    onChange={_ =>
                        classifierStateDispatch({
                            type: "setSelection",
                            classifierName: classifier.name
                        })
                    }
                />
                <div className="checkboxLabels">
                    <Typography inline className="checkboxLabel">
                        {classifier.name}
                    </Typography>
                    <Typography inline className="checkboxLabel" color="textSecondary">
                        {etaLabel}
                    </Typography>
                </div>
            </div>
        </React.Fragment>
    );
}

function getInitialParamState() {
    return classifierTypes.CLASSIFIER_TYPES.map(classifier => {
        const state = {
            name: classifier,
            eta: null,
            etaLoaded: false,
            paramData: classifierTypes.CLASSIFIER_PARAMS[classifier],
            selected: true
        };
        return state;
    });
}

function ClassifiersOverview(props) {
    const [classifierStates, classifierStateDispatch] = useReducer(
        classifierStateReducer,
        getInitialParamState()
    );

    const selectedFeatures = props.featureList
        .filter(f => f.get("selected"))
        .map(f => f.get("name"))
        .toJS();

    const [crossVal, setCrossVal] = useState(3);

    const searchTypeOptions = ["grid", "random"];
    const [searchType, setSearchType] = useState(searchTypeOptions[0]);

    const scoringOptions = ["accuracy", "precision", "recall"];
    const [scoring, setScoring] = useState(scoringOptions[0]);

    const [label, setLabel] = useState(selectedFeatures[0]);
    const [activeClassifierName, setActiveClassifierName] = useState(classifierStates[0].name);

    useEffect(_ => {
        const requests = classifierTypes.CLASSIFIER_TYPES.map(classifier => {
            const { req, cancel } = classifierFunctions.getEta(classifier, selectedFeatures, 100);
            req.then(data =>
                classifierStateDispatch({
                    type: "updateEta",
                    name: classifier,
                    eta: data.eta && Math.ceil(data.eta)
                })
            );
            return cancel;
        });

        return _ => requests.forEach(cancel => cancel());
    }, []);

    const classifiersSelected = classifierStates.filter(c => c.selected).length;
    const waitTime = classifierStates.reduce((acc, c) => acc + c.eta, 0);
    const waitTimeString = classifierStates.every(c => c.etaLoaded)
        ? waitTime
            ? `${Math.ceil(waitTime / 60)} minutes approximate run time`
            : "Run time not available"
        : "Calculating approximate run time...";

    return (
        <div className="classifiersContainer">
            <div className="headerBar">
                <FormControl>
                    <InputLabel>Labels</InputLabel>
                    <Select value={label} onChange={e => setLabel(e.target.value)}>
                        {selectedFeatures.map(f => (
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
                        onClick={_ =>
                            props.createClassifierOutput(
                                classifierStates,
                                selectedFeatures,
                                crossVal,
                                label,
                                searchType,
                                scoring,
                                props.winId
                            )
                        }
                    >
                        Run
                    </Button>
                </div>
            </div>
            <hr />
            <div className="body">
                <div className="leftCol">
                    <Typography variant="subtitle1">Select and Configure Classifier(s)</Typography>
                    <div>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={_ =>
                                classifierStateDispatch({
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
                                classifierStateDispatch({
                                    type: "setAllSelections",
                                    selected: false
                                })
                            }
                        >
                            Select None
                        </Button>
                    </div>
                    <FormGroup classes={{ root: "classifierList" }}>
                        {classifierStates.map(classifier =>
                            makeClassifierRow(
                                activeClassifierName,
                                setActiveClassifierName,
                                classifierStateDispatch,
                                classifier
                            )
                        )}
                    </FormGroup>
                </div>
                <div className="rightCol">
                    <div className="paramHeader">
                        <div className="row">
                            <div className="classifierCounts">
                                <span>{classifiersSelected} Classifiers selected</span>
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
                    <div className="classifierParams">
                        <Typography variant="subtitle1">{activeClassifierName}</Typography>
                        {classifierStates
                            .find(c => c.name === activeClassifierName)
                            .paramData.params.map(param => (
                                <React.Fragment key={param.name}>
                                    {makeParamInput(
                                        param,
                                        activeClassifierName,
                                        classifierStateDispatch
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
        createClassifierOutput: bindActionCreators(
            classifierActions.createClassifierOutput,
            dispatch
        )
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ClassifiersOverview);
