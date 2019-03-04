import React, { useState } from "react";
import * as algorithmTypes from "constants/algorithmTypes";
import "components/Algorithms/algorithmStyles.scss";

function makeParamField(props, baseParam) {
    const paramValue = props.subalgoState.params.find(param => param.name === baseParam.name).value;
    return (
        <div className="subalgo-param-field" key={baseParam.title}>
            <div className="param-title">{baseParam.title}</div>
            <input
                type={baseParam.inputType}
                min={baseParam.min}
                max={baseParam.max}
                step={baseParam.step}
                value={paramValue}
                onChange={e =>
                    props.changeParam(props.subalgoState.name, baseParam.name, e.target.value)
                }
            />
        </div>
    );
}

function makeParamFields(props, baseParams) {
    return (
        <React.Fragment>
            {baseParams.map(baseParam => makeParamField(props, baseParam))}
        </React.Fragment>
    );
}

function SubalgoEditParams(props) {
    const baseParams = algorithmTypes.SUBALGORITHMS[props.algo].find(
        subalgo => subalgo.simplename === props.subalgoState.name
    ).parameters;

    return (
        <div className="subalgo-detail">
            <div className="params">
                <div className="title">{props.subalgoState.humanName}: Edit Parameters</div>
                {makeParamFields(props, baseParams)}
                <button onClick={_ => props.setMode(props.subalgoState.name)}>
                    Back to previews
                </button>
                <button
                    onClick={_ =>
                        props.setMode(
                            props.subalgoState.name,
                            algorithmTypes.SUBALGO_MODE_EDIT_OUTPUTS
                        )
                    }
                >
                    Set outputs
                </button>
            </div>
            <div className="preview">{props.previewPlot}</div>
        </div>
    );
}

export default SubalgoEditParams;
