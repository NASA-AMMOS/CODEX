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

// Utility to create a Plotly chart for each algorithm data return from the server.
// We show a loading progress indicator if the data hasn't arrived yet.
function makeClassificationPlot(algo) {
    if (!algo || !algo.data)
        return (
            <div className="chartLoading">
                <CircularProgress />
            </div>
        );

    const chartOptions = {
        data: [
            {
                x: [...algo.data.classes].sort((a, b) => a - b),
                y: [...algo.data.classes].sort((a, b) => b - a).map(idx => `Label ${idx}`),
                z: algo.data.cm_data,
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
    for (let i = 0; i < algo.data.cm_data.length; i++) {
        for (let j = 0; j < algo.data.cm_data[i].length; j++) {
            let value = algo.data.cm_data[i][j];

            let colorValue = value < 0.5 ? "black" : "white";

            let annotation = {
                xref: "x1",
                yref: "y1",
                x: algo.data.classes[j],
                y: algo.data.classes[i],
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
        algoStates.every(algo => algo.data) &&
        algoStates.reduce((acc, algo) => {
            if (!acc) return { name: algo.data.algorithmName, score: algo.data.best_score };
            return algo.data.best_score > acc.score
                ? { name: algo.data.algorithmName, score: algo.data.best_score }
                : acc;
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
                        algoStates.find(algo => algo.algorithmName === bestClassification.name)
                    )}
                </div>
            </div>
        </div>
    );
}

function ClassificationResults(props) {
    // Create state objects for each classification we're running so that we can keep track of them.
    const [algoStates, setAlgoStates] = useState(_ => props.requests.map(req => req.requestObj));
    useEffect(_ => {
        // As each request promise resolves with server data, update the state.
        props.requests.forEach(request => {
            request.req.then(data =>
                setAlgoStates(
                    algoStates.map(algo =>
                        algo.algorithmName === data.algorithmName
                            ? Object.assign(algo, { data })
                            : algo
                    )
                )
            );
        });

        // If the window is closed before the requests have all resolved, cancel all of them.
        return function cleanup() {
            props.requests.map(({ cancel }) => cancel());
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
                        <li>Label: {props.runParams.labelName}</li>
                        <li>
                            Features:{" "}
                            {props.runParams.selectedFeatures
                                .filter(l => l !== props.runParams.labelName)
                                .join(", ")}
                        </li>
                        <li>Cross-vals: {props.runParams.crossVal}</li>
                        <li>Scoring: {props.runParams.scoring}</li>
                        <li>Search Type: {props.runParams.searchType}</li>
                    </ul>
                </div>
            </div>
            <Typography variant="h6">All Classifications</Typography>
            <div className="resultRow">
                {algoStates.map(algo => (
                    <div
                        key={algo.algorithmName}
                        className={classnames({
                            classificationResult: true,
                            selected: selectedAlgos.includes(algo.algorithmName)
                        })}
                    >
                        <div
                            className="classificationHeader"
                            onClick={_ => toggleSelected(algo.algorithmName)}
                        >
                            {algo.algorithmName.length <= 20
                                ? algo.algorithmName
                                : algo.algorithmName.slice(0, 17) + "..."}
                            <span className="percentage" hidden={!algo.loaded}>
                                {algo.loaded && Math.ceil(algo.data.best_score * 100)}%
                            </span>
                        </div>
                        <div className="plot">{makeClassificationPlot(algo)}</div>
                        <ul className="bestParms" hidden={!algo.data}>
                            {algo.data &&
                                Object.entries(algo.data.best_parms).map(([name, val]) => (
                                    <li key={name}>
                                        {name}: {val}
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default ClassificationResults;
