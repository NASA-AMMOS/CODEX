import React, { useEffect, useState, useReducer } from "react";
import * as classificationTypes from "constants/classificationTypes";
import Typography from "@material-ui/core/Typography";
import Plot from "react-plotly.js";
import classnames from "classnames";
import Button from "@material-ui/core/Button";
import "components/Classification/classification.scss";
import CircularProgress from "@material-ui/core/CircularProgress";
import HelpContent from "components/Help/HelpContent";
import HelpOutline from "@material-ui/icons/HelpOutline";
import Close from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import { useWindowManager } from "hooks/WindowHooks";

// Utility to create a Plotly chart for each algorithm data return from the server.
// We show a loading progress indicator if the data hasn't arrived yet.
function makeClassificationPlot(algo) {
    if (!algo || !algo.get("serverResponse") || !algo.get("serverResponse").classes)
        return (
            <div className="chartLoading">
                <CircularProgress />
            </div>
        );

    const data = algo.get("serverResponse");
    const chartOptions = {
        data: [
            {
                x: [...data.classes].sort((a, b) => a - b),
                y: [...data.classes].sort((a, b) => b - a).map(idx => `Label ${idx}`),
                z: data.cm_data,
                type: "heatmap",
                colorscale: "Reds",
                showscale: false,
                xgap: 2,
                ygap: 2
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
            },
            annotations: []
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    };

    //add annotations
    for (let i = 0; i < data.cm_data.length; i++) {
        for (let j = 0; j < data.cm_data[i].length; j++) {
            let value = data.cm_data[i][j];

            let colorValue = value < 0.5 ? "black" : "white";

            let annotation = {
                xref: "x1",
                yref: "y1",
                x: data.classes[j],
                y: data.classes[i],
                text: value + "%",
                font: {
                    family: "Arial",
                    size: 12,
                    color: colorValue
                },
                showarrow: false
            };

            chartOptions.layout.annotations.push(annotation);
        }
    }

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

// Finds the highest-scoring classification and generates its chart data.
// (Doesn't display until all classification returns come back from server.)
function makeBestClassification(algoStates) {
    const bestClassification =
        algoStates.every(algo => algo.get("serverResponse")) &&
        algoStates.reduce((acc, algo) => {
            const retVal = {
                name: algo.get("serverResponse").algorithmName,
                score: algo.get("serverResponse").best_score
            };

            return !acc ? retVal : algo.get("serverResponse").best_score > acc.score ? retVal : acc;
        }, null);

    return (
        <div>
            <Typography variant="h6">Best Classification</Typography>
            <div className="classificationResult">
                <div className="classificationHeader">
                    {bestClassification ? bestClassification.name : "Loading..."}
                    <span hidden={!bestClassification} className="percentage">
                        {Math.ceil(bestClassification.score * 100)}%
                    </span>
                </div>
                <div className="plot">
                    {makeClassificationPlot(
                        algoStates.find(
                            algo => algo.get("algorithmName") === bestClassification.name
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

function ClassificationResults(props) {
    const win = useWindowManager(props, {
        width: 700,
        height: 700,
        resizeable: false,
        title: "Classification Results"
    });

    // Create state objects for each classification we're running so that we can keep track of them.
    const [algoStates, setAlgoStates] = useState(_ =>
        props.requests.map(req => req.get("requestObj"))
    );
    useEffect(_ => {
        // As each request promise resolves with server data, update the state.
        props.requests.forEach(request => {
            request.get("req").then(data => {
                setAlgoStates(algos =>
                    algos.map(algo =>
                        algo.get("algorithmName") === data.algorithmName
                            ? algo.set("serverResponse", data)
                            : algo
                    )
                );
            });
        });

        // If the window is closed before the requests have all resolved, cancel all of them.
        return function cleanup() {
            props.requests.map(req => req.get("cancel")());
        };
    }, []);

    // State getter and setter for the list of currently selected classifications
    const [selectedAlgos, setSelectedAlgos] = useState([]);
    function toggleSelected(name) {
        setSelectedAlgos(
            selectedAlgos.includes(name)
                ? selectedAlgos.filter(algo => algo !== name)
                : selectedAlgos.concat([name])
        );
    }

    return (
        <div className="classificationResults">
            <div className="resultRow leftAligned">
                {makeBestClassification(algoStates)}
                <div className="runParams">
                    <Typography variant="h6">Global Run Parameters</Typography>
                    <ul className="bestParms">
                        <li>Label: {props.runParams.get("labelName")}</li>
                        <li>
                            Features:{" "}
                            {props.runParams
                                .get("selectedFeatures")
                                .filter(l => l !== props.runParams.get("labelName"))
                                .join(", ")}
                        </li>
                        <li>Cross-vals: {props.runParams.get("crossVal")}</li>
                        <li>Scoring: {props.runParams.get("scoring")}</li>
                        <li>Search Type: {props.runParams.get("searchType")}</li>
                    </ul>
                </div>
            </div>
            <Typography variant="h6">All Classifications</Typography>
            <div className="resultRow">
                {algoStates.map(algo => (
                    <div
                        key={algo.get("algorithmName")}
                        className={classnames({
                            classificationResult: true,
                            selected: selectedAlgos.includes(algo.get("algorithmName"))
                        })}
                    >
                        <div
                            className="classificationHeader"
                            onClick={_ => toggleSelected(algo.get("algorithmName"))}
                        >
                            {algo.get("algorithmName").length <= 20
                                ? algo.get("algorithmName")
                                : algo.get("algorithmName").slice(0, 17) + "..."}
                            <span className="percentage" hidden={!algo.get("loaded")}>
                                {algo.get("loaded") &&
                                    Math.ceil(algo.getIn(["serverResponse", "best_score"]) * 100)}
                                %
                            </span>
                        </div>
                        <div className="plot">{makeClassificationPlot(algo)}</div>
                        <ul className="bestParms" hidden={!algo.get("data")}>
                            {algo.getIn(["serverResponse", "best_parms"]) &&
                                Object.entries(algo.getIn(["serverResponse", "best_parms"])).map(
                                    ([name, val]) => (
                                        <li key={name}>
                                            {name}: {val}
                                        </li>
                                    )
                                )}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ClassificationResults;
