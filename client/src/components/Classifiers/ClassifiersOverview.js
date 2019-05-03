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
                variant="filled"
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
                variant="filled"
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
                variant="filled"
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
    return param.type === "int" || param.type === "float"
        ? makeNumericInput(param, classifierName, classifierStateDispatch)
        : null;
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
                <Button
                    variant="contained"
                    color="primary"
                    onClick={_ =>
                        props.createClassifierOutput(classifierStates, selectedFeatures, crossVal)
                    }
                >
                    Run
                </Button>
            </div>
            <hr />
            <div className="body">
                <div className="leftCol">
                    <h5>Select and Configure Classifier(s)</h5>
                    <div className="buttonRow">
                        <Button
                            variant="outlined"
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
                            variant="outlined"
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
                        {classifierStates.map(classifier => (
                            <FormControlLabel
                                key={classifier.name}
                                className="checkboxLabel"
                                control={
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
                                }
                                label={classifier.name}
                            />
                        ))}
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
                            variant="filled"
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
