import React, { useEffect, useState, useReducer } from "react";
import * as classifierTypes from "constants/classifierTypes";
import * as classifierFunctions from "components/Classifiers/classifierFunctions";
import * as classifierActions from "actions/classifierActions";
import Button from "@material-ui/core/Button";
import { bindActionCreators } from "redux";
import "components/Classifiers/Classifiers.scss";
import { connect } from "react-redux";

function classifierStateReducer(classifierState, action) {
    switch (action.type) {
        case "updateEta":
            return classifierState.map(classifier =>
                classifier.name === action.name ? { ...classifier, eta: action.eta } : classifier
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
    }
}

function makeNumericInput(param, classifierName, classifierStateDispatch) {
    return (
        <React.Fragment>
            <div>Min:</div>
            <input
                type="number"
                value={param.min}
                onChange={e =>
                    classifierStateDispatch({
                        type: "updateParam",
                        classifierName,
                        paramName: param.name,
                        paramValue: "min",
                        value: e.target.value
                    })
                }
            />
            <div>Max:</div>
            <input
                type="number"
                value={param.max}
                onChange={e =>
                    classifierStateDispatch({
                        type: "updateParam",
                        classifierName,
                        paramName: param.name,
                        paramValue: "max",
                        value: e.target.value
                    })
                }
            />
            <div>Step:</div>
            <input
                type="number"
                value={param.step}
                onChange={e =>
                    classifierStateDispatch({
                        type: "updateParam",
                        classifierName,
                        paramName: param.name,
                        paramValue: "step",
                        value: e.target.value
                    })
                }
            />
        </React.Fragment>
    );
}

function makeParamInput(param, classifierName, classifierStateDispatch) {
    return (
        <div key={param.name}>
            {param.type === "int" || param.type === "float"
                ? makeNumericInput(param, classifierName, classifierStateDispatch)
                : null}
        </div>
    );
}

function getInitialParamState() {
    return classifierTypes.CLASSIFIER_TYPES.map(classifier => {
        return {
            name: classifier,
            eta: "waiting...",
            params: classifierTypes.CLASSIFIER_PARAMS[classifier] || []
        };
    });
}

function ClassifiersOverview(props) {
    const [classifierStates, classifierStateDispatch] = useReducer(
        classifierStateReducer,
        getInitialParamState()
    );

    useEffect(_ => {
        classifierTypes.CLASSIFIER_TYPES.forEach(classifier =>
            classifierFunctions.getEta(
                classifier,
                props.selectedFeatures,
                props.selectedFeatureLength,
                data => {
                    classifierStateDispatch({
                        type: "updateEta",
                        name: classifier,
                        eta: data.eta ? Math.ceil(data.eta) : "n/a"
                    });
                }
            )
        );
    }, []);

    return (
        <div className="classifiers-container">
            <ul>
                {classifierStates.map(classifierState => (
                    <li key={classifierState.name} className="classification-row">
                        <div>{classifierState.name}</div>
                        <div>ETA:{classifierState.eta}</div>
                        {classifierState.params.map(param =>
                            makeParamInput(param, classifierState.name, classifierStateDispatch)
                        )}
                    </li>
                ))}
            </ul>
            <Button
                variant="contained"
                onClick={_ =>
                    props.createClassifierOutput(classifierStates, props.selectedFeatures)
                }
            >
                Submit
            </Button>
        </div>
    );
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
    null,
    mapDispatchToProps
)(ClassifiersOverview);
