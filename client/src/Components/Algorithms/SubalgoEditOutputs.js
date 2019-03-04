import React, { useState } from "react";
import * as algorithmTypes from "constants/algorithmTypes";
import "components/Algorithms/algorithmStyles.scss";

function SubalgoEditOutputs(props) {
    return (
        <div className="subalgo-detail">
            <div className="params">
                <div className="title">{props.subalgoState.humanName}: Edit Outputs</div>
                <div className="subalgo-param-field">
                    <div className="param-title">Name</div>
                    <input
                        type="text"
                        value={props.subalgoState.outputParams.name}
                        onChange={e =>
                            props.changeOutputParam(props.subalgoState.name, "name", e.target.value)
                        }
                    />
                </div>
                <hr />
                <div className="output-section">Features</div>
                <div className="subalgo-param-field">
                    <div className="param-title">Name</div>
                    <input
                        type="checkbox"
                        checked={props.subalgoState.outputParams.pca}
                        onChange={e =>
                            props.changeOutputParam(
                                props.subalgoState.name,
                                "pca",
                                e.target.checked
                            )
                        }
                    />
                </div>
                <div className="subalgo-param-field">
                    <div className="param-title">Cluster ID</div>
                    <input
                        type="checkbox"
                        checked={props.subalgoState.outputParams.clusterId}
                        onChange={e =>
                            props.changeOutputParam(
                                props.subalgoState.name,
                                "clusterId",
                                e.target.checked
                            )
                        }
                    />
                </div>
                <hr />
                <div className="output-section">Selections</div>
                <div className="subalgo-param-field">
                    <div className="param-title">Clusters</div>
                    <input
                        type="checkbox"
                        checked={props.subalgoState.outputParams.clusters}
                        onChange={e =>
                            props.changeOutputParam(
                                props.subalgoState.name,
                                "clusters",
                                e.target.checked
                            )
                        }
                    />
                </div>
                <button
                    onClick={_ =>
                        props.setMode(
                            props.subalgoState.name,
                            algorithmTypes.SUBALGO_MODE_EDIT_PARAMS
                        )
                    }
                >
                    Edit parameters
                </button>
                <button>Run</button>
                <button
                    style={{ display: "block" }}
                    onClick={_ => props.setMode(props.subalgoState.name)}
                >
                    Back To Previews
                </button>
            </div>
            <div className="preview">{props.previewPlot}</div>
        </div>
    );
}

export default SubalgoEditOutputs;
