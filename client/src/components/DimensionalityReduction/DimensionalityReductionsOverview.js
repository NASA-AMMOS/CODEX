// This component creates a window that allows users to configure a new classifier run.

import React, { useEffect, useState, useReducer } from "react";
import * as dimensionalityReductionTypes from "constants/dimensionalityReductionTypes";
import * as dimensionalityReductionFunctions from "components/DimensionalityReduction/dimensionalityReductionFunctions";
import * as dimensionalityReductionActions from "actions/dimensionalityReductionActions";
import Button from "@material-ui/core/Button";
import { bindActionCreators } from "redux";
import "components/DimensionalityReduction/dimensionalityReductions.scss";
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

// Reducer to handle changes to each individual classifier's state, which contains info
// about parameters and expected run times.
function drStateReducer(drState, action) {
    switch (action.type) {
        case "updateEta":
            return drState.map(dr =>
                dr.name === action.name ? { ...dr, eta: action.eta, etaLoaded: true } : dr
            );
        case "updateParam":
            return drState.map(dr =>
                dr.name === action.drName
                    ? {
                          ...dr,
                          paramData: dr.paramData.map(param =>
                              param.name === action.paramName
                                  ? {
                                        ...param,
                                        subParams: param.subParams.map(subParam =>
                                            subParam.name === action.subParamName
                                                ? { ...subParam, value: action.value }
                                                : subParam
                                        )
                                    }
                                  : param
                          )
                      }
                    : dr
            );
        case "setSelection":
            return drState.map(dr =>
                dr.name === action.drName ? { ...dr, selected: !dr.selected } : dr
            );
        case "setAllSelections":
            return drState.map(dr => {
                return { ...dr, selected: action.selected };
            });
    }
}

function makeNumericInput(subParam, paramName, drName, drStateDispatch, options) {
    if (options.maxVal) {
        subParam = {
            ...subParam,
            max: options.maxVal,
            default: options.maxVal,
            helperText: `Up to ${options.maxVal}`
        };
    }

    return (
        <React.Fragment key={subParam.name}>
            <TextField
                className="parameterInput"
                fullWidth
                label={subParam.label}
                helperText={subParam.helperText}
                margin="normal"
                variant="filled"
                type="number"
                value={subParam.value}
                onChange={e =>
                    drStateDispatch({
                        type: "updateParam",
                        drName,
                        paramName: paramName,
                        subParamName: subParam.name,
                        value:
                            subParam.type === "int"
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
        <FormControl key={param.name}>
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

function makeSubParamInput(subParam, paramName, drName, drStateDispatch, options) {
    switch (subParam.type) {
        case "int":
        case "float":
            return makeNumericInput(subParam, paramName, drName, drStateDispatch, options);
        case "string":
            return makeStringChoiceInput(subParam, drName, drStateDispatch);
    }
}

function makeDrRow(activeDrName, setActiveDrName, drStateDispatch, dr) {
    const etaLabel = dr.eta ? `(${Math.ceil(dr.eta / 60)} min)` : dr.etaLoaded && "(n/a)";
    const rowClass = classnames({
        checkboxRow: true,
        active: dr.name === activeDrName
    });
    return (
        <React.Fragment key={dr.name}>
            <div key={dr.name} className={rowClass} onClick={_ => setActiveDrName(dr.name)}>
                <Checkbox
                    color="primary"
                    checked={dr.selected}
                    onChange={_ =>
                        drStateDispatch({
                            type: "setSelection",
                            drName: dr.name
                        })
                    }
                />
                <div className="checkboxLabels">
                    <Typography inline className="checkboxLabel">
                        {dr.name}
                    </Typography>
                    <Typography inline className="checkboxLabel" color="textSecondary">
                        {etaLabel}
                    </Typography>
                </div>
            </div>
        </React.Fragment>
    );
}

function getInitialParamState(props) {
    return dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_TYPES.map(dr => {
        const state = {
            name: dr,
            eta: null,
            etaLoaded: false,
            paramData: dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_PARAMS[dr].map(param =>
                Object.assign(param, {
                    subParams: param.subParams.map(subParam =>
                        Object.assign(subParam, {
                            value: props.featureList.filter(f => f.get("selected")).size
                        })
                    )
                })
            ),
            selected: true
        };
        return state;
    });
}

function DimensionalityReductionsOverview(props) {
    // Create and store classifier states
    const [drStates, drStateDispatch] = useReducer(drStateReducer, getInitialParamState(props));

    const selectedFeatures = props.featureList
        .filter(f => f.get("selected"))
        .map(f => f.get("name"))
        .toJS();

    // Create and store global options for this classifier run
    const [crossVal, setCrossVal] = useState(3);

    const searchTypeOptions = ["grid", "random"];
    const [searchType, setSearchType] = useState(searchTypeOptions[0]);

    const scoringOptions = ["accuracy", "precision", "recall"];
    const [scoring, setScoring] = useState(scoringOptions[0]);

    const [activeDrName, setActiveDrName] = useState(drStates[0].name);

    useEffect(_ => {
        const requests = dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_TYPES.map(dr => {
            const { req, cancel } = dimensionalityReductionFunctions.getEta(
                dr,
                selectedFeatures,
                100
            );
            req.then(data =>
                drStateDispatch({
                    type: "updateEta",
                    name: dr,
                    eta: data.eta && Math.ceil(data.eta)
                })
            );
            return cancel;
        });

        return function cleanup() {
            requests.forEach(cancel => cancel());
        };
    }, []);

    // Render the HTML for the page.
    // When the user clicks "run", we fire an action that closes this window, creates server requests for data for each selected
    // classifier, and then hands them off to a new window defined in ClassifierResult.
    const drsSelected = drStates.filter(c => c.selected).length;
    const waitTime = drStates.reduce((acc, c) => acc + c.eta, 0);
    const waitTimeString = drStates.every(c => c.etaLoaded)
        ? waitTime
            ? `${Math.ceil(waitTime / 60)} minutes approximate run time`
            : "Run time not available"
        : "Calculating approximate run time...";

    return (
        <div className="classifiersContainer">
            <div className="headerBar">
                <div>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={_ => props.createDrOutput(drStates, selectedFeatures, props.winId)}
                    >
                        Run
                    </Button>
                </div>
            </div>
            <hr />
            <div className="body">
                <div className="leftCol">
                    <Typography variant="subtitle1">Select and Configure Reductions(s)</Typography>
                    <div>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={_ =>
                                drStateDispatch({
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
                                drStateDispatch({
                                    type: "setAllSelections",
                                    selected: false
                                })
                            }
                        >
                            Select None
                        </Button>
                    </div>
                    <FormGroup classes={{ root: "classifierList" }}>
                        {drStates.map(dr =>
                            makeDrRow(activeDrName, setActiveDrName, drStateDispatch, dr)
                        )}
                    </FormGroup>
                </div>
                <div className="rightCol">
                    <div className="paramHeader">
                        <div className="row">
                            <div className="classifierCounts">
                                <span>{drsSelected} Reductions selected</span>
                                <span>{waitTimeString}</span>
                            </div>
                        </div>
                    </div>
                    <hr />
                    <div className="classifierParams">
                        <Typography variant="subtitle1">{activeDrName}</Typography>
                        {drStates
                            .find(c => c.name === activeDrName)
                            .paramData.map(param => (
                                <React.Fragment key={param.name}>
                                    <hr />
                                    <div>{param.name}</div>
                                    {param.subParams.map(subParam =>
                                        makeSubParamInput(
                                            subParam,
                                            param.name,
                                            activeDrName,
                                            drStateDispatch,
                                            {
                                                maxVal: props.featureList.filter(f =>
                                                    f.get("selected")
                                                ).size
                                            }
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
        createDrOutput: bindActionCreators(dimensionalityReductionActions.createDrOutput, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DimensionalityReductionsOverview);
