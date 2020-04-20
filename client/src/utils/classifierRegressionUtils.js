import { Checkbox, Typography } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import React from "react";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";

import classnames from "classnames";

import * as classificationRegressionTypes from "../constants/classificationRegressionTypes";

// Uses the Classification Types constants file to generate state objects for each classification.
export function getInitialParamState(algos) {
    return Object.entries(algos).map(([name, classification]) => {
        const state = {
            name: name,
            eta: null,
            etaLoaded: false,
            paramData: classification,
            selected: true
        };
        return state;
    });
}

// Reducer to handle changes to each individual classification's state, which contains info
// about parameters and expected run times.
export function stateReducer(classificationState, action) {
    switch (action.type) {
        case "updateEta":
            return classificationState.map(classification =>
                classification.name === action.name
                    ? { ...classification, eta: action.eta, etaLoaded: true }
                    : classification
            );
        case "updateParam": //TODO: This really needs to be collapsed w/ some kind of utility function for mapping
            return classificationState.map(classification =>
                classification.name === action.classificationName
                    ? {
                          ...classification,
                          paramData: classification.paramData.map(param =>
                              param.name === action.paramName
                                  ? {
                                        ...param,
                                        subParams: param.subParams.map(subParam =>
                                            subParam.name === action.subParam
                                                ? { ...subParam, value: action.value }
                                                : subParam
                                        )
                                    }
                                  : param
                          )
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

function formatHelperText(text, featureList) {
    return text
        .replace(classificationRegressionTypes.NUM_OF_FEATURES_MINUS_ONE, featureList.size - 1)
        .replace(classificationRegressionTypes.NUM_OF_FEATURES, featureList.size);
}

export function makeNumericInput(
    paramName,
    subParam,
    classificationName,
    classificationStateDispatch,
    focus,
    featureList
) {
    return (
        <React.Fragment key={subParam.name}>
            <TextField
                autoFocus={focus}
                className="parameterInput"
                fullWidth
                label={subParam.label}
                helperText={formatHelperText(subParam.helperText, featureList)}
                margin="normal"
                variant="filled"
                type="number"
                value={subParam.value}
                onChange={e =>
                    classificationStateDispatch({
                        type: "updateParam",
                        classificationName,
                        paramName,
                        subParam: subParam.name,
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

export function makeStringChoiceInput(
    paramName,
    subParam,
    classificationName,
    classificationStateDispatch,
    focus
) {
    return (
        <FormControl key={subParam.name}>
            <InputLabel>{subParam.name}</InputLabel>
            <Select
                autoFocus={focus}
                value={subParam.value || subParam.default}
                onChange={e =>
                    classificationStateDispatch({
                        type: "updateParam",
                        classificationName,
                        paramName,
                        subParam: subParam.name,
                        value: e.target.value
                    })
                }
            >
                {subParam.options.map(f => (
                    <MenuItem key={f} value={f}>
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}

export function makeSubParamInput(
    paramName,
    subParam,
    classificationName,
    classificationStateDispatch,
    focus,
    featureList
) {
    switch (subParam.type) {
        case "int":
        case "float":
            return makeNumericInput(
                paramName,
                subParam,
                classificationName,
                classificationStateDispatch,
                focus,
                featureList
            );
        case "string":
            return makeStringChoiceInput(
                paramName,
                subParam,
                classificationName,
                classificationStateDispatch,
                focus
            );
    }
}

export function makeAlgoRow(
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
