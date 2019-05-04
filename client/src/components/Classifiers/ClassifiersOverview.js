import React, { useEffect, useState, useReducer } from "react";
import * as classifierTypes from "constants/classifierTypes";
import * as classifierFunctions from "components/Classifiers/classifierFunctions";
import * as classifierActions from "actions/classifierActions";
import Button from "@material-ui/core/Button";
import { bindActionCreators } from "redux";
import "components/Classifiers/Classifiers.scss";
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
                          params: classifier.params.map(param =>
                              param.name === action.paramName
                                  ? { ...param, [action.paramValue]: action.value }
                                  : param
                          )
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
                label={param.minLabel}
                defaultValue={param.minDefault}
                helperText={`${param.min} or higher`}
                margin="normal"
                variant="standard"
                type="number"
                value={param.minValue}
                onChange={e =>
                    classifierStateDispatch({
                        type: "updateParam",
                        paramValue: "minValue",
                        value: e.target.value
                    })
                }
            />
            <TextField
                className="parameterInput"
                fullWidth
                label={param.maxLabel}
                defaultValue={param.maxDefault}
                helperText={`Up to ${param.max}`}
                margin="normal"
                variant="standard"
                type="number"
                value={param.maxValue}
                onChange={e =>
                    classifierStateDispatch({
                        type: "updateParam",
                        paramValue: "maxValue",
                        value: e.target.value
                    })
                }
            />
            <TextField
                className="parameterInput"
                fullWidth
                label={param.stepLabel}
                defaultValue={param.stepDefault}
                helperText={`Up to ${param.step}`}
                margin="normal"
                variant="standard"
                type="number"
                value={param.stepValue}
                onChange={e =>
                    classifierStateDispatch({
                        type: "updateParam",
                        paramValue: "maxValue",
                        value: e.target.value
                    })
                }
            />
        </React.Fragment>
    );
}

function makeParamInput(param, classifierName, classifierStateDispatch) {
    return (
        <React.Fragment key={classifierName}>
            <Typography variant="subtitle1">{classifierName}</Typography>
            {param.type === "int" || param.type === "float"
                ? makeNumericInput(param, classifierName, classifierStateDispatch)
                : null}
        </React.Fragment>
    );
}

function makeClassifierRow(
    activeClassifierName,
    setActiveClassifierName,
    classifierStateDispatch,
    classifier
) {
    const eta = classifier.eta && Math.ceil(classifier.eta);
    const etaLabel = eta ? `(${eta / 60} min)` : classifier.etaLoaded && "(n/a)";
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
        return {
            name: classifier,
            eta: null,
            etaLoaded: false,
            params: classifierTypes.CLASSIFIER_PARAMS[classifier] || [],
            selected: true
        };
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
    const [label, setLabel] = useState(selectedFeatures[0]);
    const [activeClassifierName, setActiveClassifierName] = useState(classifierStates[0].name);

    useEffect(_ => {
        classifierTypes.CLASSIFIER_TYPES.forEach(classifier =>
            classifierFunctions.getEta(classifier, selectedFeatures, 100, data => {
                classifierStateDispatch({
                    type: "updateEta",
                    name: classifier,
                    eta: data.eta && Math.ceil(data.eta)
                });
            })
        );
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
                                label
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
                        <div className="classifierCounts">
                            <span>{classifiersSelected} Classifiers selected</span>
                            <span>{waitTimeString}</span>
                        </div>
                        <TextField
                            className="parameterInput"
                            label="Cross Val"
                            margin="normal"
                            variant="standard"
                            type="number"
                            value={crossVal}
                        />
                    </div>
                    <hr />
                    <div className="classifierParams">
                        {classifierStates
                            .find(c => c.name === activeClassifierName)
                            .params.map(param =>
                                makeParamInput(param, activeClassifierName, classifierStateDispatch)
                            )}
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
