import React, { useEffect, useState, useReducer } from "react";
import * as classifierTypes from "constants/classifierTypes";
import Typography from "@material-ui/core/Typography";
import Plot from "react-plotly.js";
import classnames from "classnames";
import Button from "@material-ui/core/Button";
import "components/Classifiers/classifiers.scss";

function makeClassifierPlot(classifier) {
    const chartOptions = {
        data: [
            {
                x: classifier.classes,
                y: classifier.classes.sort((a, b) => b - a).map(idx => `Label ${idx}`),
                z: classifier.cm_data,
                type: "heatmap",
                showscale: false
            }
        ],
        layout: {
            xaxis: { type: "category", automargin: true, ticklen: 0 },
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: false, // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            yaxis: {
                automargin: true,
                ticklen: 0
            }
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    };
    return (
        <Plot
            data={chartOptions.data}
            layout={chartOptions.layout}
            config={chartOptions.config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
        />
    );
}

function ClassifierResults(props) {
    const [selectedAlgos, setSelectedAlgos] = useState([]);
    function toggleSelected(name) {
        setSelectedAlgos(
            selectedAlgos.includes(name)
                ? selectedAlgos.filter(algo => algo !== name)
                : selectedAlgos.concat([name])
        );
    }

    const bestClassifier = props.data.reduce((acc, classifier) => {
        if (!acc) return { name: classifier.algorithmName, score: classifier.best_score };
        return classifier.best_score > acc.score
            ? { name: classifier.algorithmName, score: classifier.best_score }
            : acc;
    }, null);

    return (
        <div>
            <div className="resultRow leftAligned">
                <div>
                    <Typography variant="h6">Best Classifier</Typography>
                    <div className="classifierResult">
                        <div className="classifierHeader">
                            {bestClassifier.name}
                            <span className="percentage">
                                {Math.ceil(bestClassifier.score * 100)}%
                            </span>
                        </div>
                        <div className="plot">
                            {makeClassifierPlot(
                                props.data.find(
                                    classifier => classifier.algorithmName === bestClassifier.name
                                )
                            )}
                        </div>
                    </div>
                </div>
                <div className="runParams">
                    <Typography variant="h6">Global Run Parameters</Typography>
                    <ul className="bestParms">
                        <li>Label: {props.runParams.labelName}</li>
                        <li>Label values: {props.runParams.selectedFeatures.join(", ")}</li>
                        <li>Cross-vals: {props.runParams.crossVal}</li>
                    </ul>
                </div>
            </div>

            <Typography variant="h6">All Classifiers</Typography>
            <div className="resultRow">
                {props.data.map(classifier => (
                    <div
                        key={classifier.algorithmName}
                        className={classnames({
                            classifierResult: true,
                            selected: selectedAlgos.includes(classifier.algorithmName)
                        })}
                    >
                        <div
                            className="classifierHeader"
                            onClick={_ => toggleSelected(classifier.algorithmName)}
                        >
                            {classifier.algorithmName.length <= 20
                                ? classifier.algorithmName
                                : classifier.algorithmName.slice(0, 17) + "..."}
                            <span className="percentage">
                                {Math.ceil(classifier.best_score * 100)}%
                            </span>
                        </div>
                        <div className="plot">{makeClassifierPlot(classifier)}</div>
                        <ul className="bestParms">
                            {Object.entries(classifier.best_parms).map(([name, val]) => (
                                <li key={name}>
                                    {name}: {val}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
            <div className="buttonRow" style={{ justifyContent: "flex-end" }}>
                <Button variant="contained" color="primary">
                    BUILD MODELS FOR SELECTED
                </Button>
            </div>
        </div>
    );
}

export default ClassifierResults;
