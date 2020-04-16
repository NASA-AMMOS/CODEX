import "./algorithmStyles.scss";

import React, { useEffect, useReducer } from "react";

import { getSubAlgorithmData } from "./algorithmFunctions";
import SubalgoChart from "./SubalgoChart";
import * as algorithmTypes from "../../constants/algorithmTypes";

function subalgoPreviewReducer(params, action) {
    switch (action.type) {
        case "updateServerData":
            return params.map(param =>
                param.name === action.name
                    ? Object.assign(param, {
                          serverData: Object.assign(param.serverData, {
                              [action.key]: action.serverData
                          })
                      })
                    : param
            );
    }
}

function makeParamPreviews(props, baseParam, serverData, paramValue) {
    const previews = [];
    for (let i = baseParam.min; i <= baseParam.max; i += baseParam.step) {
        paramValue = typeof paramValue === "number" ? paramValue.toString() : paramValue;
        const roundedValue = parseFloat(i.toPrecision(2)).toString();
        previews.push(
            <SubalgoChart
                key={i}
                name={i}
                humanName={i}
                serverData={serverData[i]}
                loaded={serverData[i]}
                selected={paramValue === roundedValue}
                onClick={_ =>
                    props.paramDispatch({
                        type: "changeParam",
                        name: props.subalgoState.name,
                        paramName: baseParam.name,
                        value: roundedValue
                    })
                }
                titleText={roundedValue}
            />
        );
    }
    return previews;
}

function makeParamField(props, baseParam, previewState) {
    const paramValue = props.subalgoState.parameters.find(param => param.name === baseParam.name)
        .value;

    const serverData = previewState.find(param => param.name === baseParam.name).serverData;

    return (
        <React.Fragment key={baseParam.title}>
            <div className="subalgo-param-field">
                <div className="param-title">{baseParam.title}</div>
                <input
                    type={baseParam.inputType}
                    min={baseParam.min}
                    max={baseParam.max}
                    step={baseParam.step}
                    value={paramValue}
                    onChange={e =>
                        props.paramDispatch({
                            type: "changeParam",
                            name: props.subalgoState.name,
                            paramName: baseParam.name,
                            value: e.target.value
                        })
                    }
                />
            </div>
            <div className="param-previews">
                {makeParamPreviews(props, baseParam, serverData, paramValue)}
            </div>
        </React.Fragment>
    );
}

function makeServerDataState(baseParam) {
    const data = {};
    for (let i = baseParam.min; i <= baseParam.max; i += baseParam.step) {
        data[i] = null;
    }
    return data;
}

function makePreviews(baseParams) {
    return baseParams.map(param => {
        return { name: param.name, serverData: makeServerDataState(param), socket: null };
    });
}

function SubalgoParams(props) {
    const baseParams = algorithmTypes.SUBALGORITHMS[props.algo].find(
        subalgo => subalgo.simplename === props.subalgoState.name
    ).parameters;

    const [previewState, previewDispatch] = useReducer(
        subalgoPreviewReducer,
        baseParams,
        makePreviews
    );

    useEffect(_ => {
        const sockets = [];
        previewState.forEach(param => {
            Object.keys(param.serverData).forEach(key => {
                const parameters = props.subalgoState.parameters.map((p, idx) => {
                    return { ...p, value: key };
                });

                const subalgo = { ...props.subalgoState, parameters };
                const socket = getSubAlgorithmData(
                    subalgo,
                    props.selectedFeatures,
                    props.filename,
                    500,
                    [],
                    inMsg =>
                        previewDispatch({
                            type: "updateServerData",
                            name: param.name,
                            key,
                            serverData: inMsg
                        })
                );
                sockets.push(socket);
            });
        }, []);

        return _ => sockets.forEach(socket => socket.closeSocket());
    }, []);

    return (
        <div hidden={props.hidden}>
            {baseParams.map(baseParam => makeParamField(props, baseParam, previewState))}
        </div>
    );
}

export default SubalgoParams;
