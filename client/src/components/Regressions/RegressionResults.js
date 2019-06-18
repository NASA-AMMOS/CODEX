import React, { useEffect, useState, useReducer } from "react";
import * as regressionTypes from "constants/regressionTypes";
import Typography from "@material-ui/core/Typography";
import Plot from "react-plotly.js";
import classnames from "classnames";
import Button from "@material-ui/core/Button";
import "components/Regressions/regressions.scss";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useWindowManager } from "hooks/WindowHooks";

// Utility to create a Plotly chart for each algorithm data return from the server.
// We show a loading progress indicator if the data hasn't arrived yet.
function makeRegressionPlot(algo) {
    if (!algo || !algo.data)
        return (
            <div className="chartLoading">
                <CircularProgress />
            </div>
        );
    // const annotations = [];

    // for (let x = 0; x < algo.data.classes.length; x++) {
    //     for (let y = 0; y < algo.data.classes.length; y++) {
    //         const annotation = {
    //             xref: "x1",
    //             yref: "y1",
    //             x: algo.data.classes[x],
    //             y: algo.data.classes[y],
    //             text: algo.data.cm_data[x][y]
    //         };
    //         annotations.push(annotation);
    //     }
    // }

    // Initial chart settings. These need to be kept in state and updated as necessary

    const dataMax = (function() {
        let max = algo.data.y[0];
        const concatData = algo.data.y.concat(algo.data.y_pred);
        for (let i = 0; i < concatData.length; i++) {
            max = concatData[i] > max ? concatData[i] : max;
        }

        return max;
    })();

    const chartOptions = {
        data: [
            {
                x: [...algo.data.y_pred],
                y: [...algo.data.y],
                type: "scattergl",
                mode: "markers",
                marker: { color: algo.data.y_pred.map((val, idx) => "#3386E6"), size: 2 },
                selected: { marker: { color: "#FF0000", size: 2 } },
                visible: true
            },
            {
                type: "line",
                x: [0, dataMax],
                y: [0, dataMax],
                mode: "lines"
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: "closest", // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            showlegend: false,
            xaxis: {
                automargin: true
            },
            yaxis: {
                automargin: true,
                scaleanchor: "x",
                scaleratio: 1
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

// Finds the highest-scoring regression and generates its chart data.
// (Doesn't display until all regression returns come back from server.)
function makeBestRegression(algoStates) {
    const bestRegression =
        algoStates.every(algo => algo.data) &&
        algoStates.reduce((acc, algo) => {
            if (!acc)
                return {
                    name: algo.algorithmName,
                    score: algo.data.best_score,
                    scoring: algo.scoring
                };
            //accesses a comparison funciton from regressionTypes because higher is not always better
            let comparison = regressionTypes.REGRESSION_SCORING_FUNCTIONS[algo.scoring](
                algo.data.best_score,
                acc.score
            );
            return comparison > 0
                ? { name: algo.algorithmName, score: algo.data.best_score, scoring: algo.scoring }
                : acc;
        }, null);
    return (
        <div>
            <Typography variant="h6">Best Regression</Typography>
            <div className="regressionResult">
                <div className="regressionHeader">
                    {bestRegression ? bestRegression.name : "Loading..."}
                    {makeRegressionScore(bestRegression)}
                </div>
                <div className="plot">
                    {makeRegressionPlot(
                        algoStates.find(algo => algo.algorithmName === bestRegression.name)
                    )}
                </div>
            </div>
        </div>
    );
}

function makeRegressionScore(algo) {
    const scoreStringFunctions = {};

    return <div>{algo.score != undefined ? algo.score.toString().substring(0, 4) : undefined}</div>;
}

function RegressionResults(props) {
    const win = useWindowManager(props, {
        width: 700,
        height: 700,
        resizeable: false,
        title: "Regression Results"
    });
    // Create state objects for each regression we're running so that we can keep track of them.
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

    // State getter and setter for the list of currently selected regressions
    const [selectedAlgos, setSelectedAlgos] = useState([]);
    function toggleSelected(name) {
        setSelectedAlgos(
            selectedAlgos.includes(name)
                ? selectedAlgos.filter(algo => algo !== name)
                : selectedAlgos.concat([name])
        );
    }

    return (
        <div className="regressionResults">
            <div className="resultRow leftAligned">
                {makeBestRegression(algoStates)}
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
            <Typography variant="h6">All Regressions</Typography>
            <div className="resultRow">
                {algoStates.map(algo => (
                    <div
                        key={algo.algorithmName}
                        className={classnames({
                            regressionResult: true,
                            selected: selectedAlgos.includes(algo.algorithmName)
                        })}
                    >
                        <div
                            className="regressionHeader"
                            onClick={_ => toggleSelected(algo.algorithmName)}
                        >
                            {algo.algorithmName.length <= 20
                                ? algo.algorithmName
                                : algo.algorithmName.slice(0, 17) + "..."}
                            {makeRegressionScore({
                                name: algo.algorithmName,
                                score: algo.data != undefined ? algo.data.best_score : 0.0,
                                scoring: algo.scoring
                            })}
                        </div>
                        <div className="plot">{makeRegressionPlot(algo)}</div>
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

export default RegressionResults;
