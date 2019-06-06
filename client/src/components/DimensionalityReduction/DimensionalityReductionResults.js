import React, { useEffect, useState, useReducer, useRef } from "react";
import * as regressionTypes from "constants/regressionTypes";
import * as dataActions from "actions/data";
import Typography from "@material-ui/core/Typography";
import Plot from "react-plotly.js";
import classnames from "classnames";
import Button from "@material-ui/core/Button";
import "components/DimensionalityReduction/dimensionalityReductions.scss";
import CircularProgress from "@material-ui/core/CircularProgress";
import * as utils from "utils/utils";
import Slider from "@material-ui/lab/Slider";
import Plotly from "plotly.js";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";

// Utility to create a Plotly chart for each algorithm data return from the server.
// We show a loading progress indicator if the data hasn't arrived yet.
function makeDRPlot(algo, maxYRange, changeSliderVal) {
    if (!algo || !algo.data)
        return (
            <div className="chartLoading">
                <CircularProgress />
            </div>
        );

    const xVals = utils.range(1, algo.dataFeatures.length + 1);
    const chartOptions = {
        data: [
            {
                x: xVals,
                y: algo.data.explained_variance_ratio,
                type: "scatter",
                mode: "lines+markers",
                visible: true,
                marker: {
                    color: xVals.map(val => (val === algo.sliderVal ? "#F5173E" : "#3386E6")),
                    size: 6
                },
                hoverinfo: "text",
                text: algo.data.explained_variance_ratio.map(
                    (r, idx) => `Components: ${idx + 1} <br> Explained Variance: ${r}%`
                )
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 0, r: 5, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: "closest", // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            showlegend: false,
            xaxis: {
                automargin: true
            },
            yaxis: {
                automargin: true,
                range: [0, maxYRange]
            }
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    };

    const id = Math.random()
        .toString(36)
        .substring(8);
    return (
        <React.Fragment>
            <Plot
                data={chartOptions.data}
                layout={chartOptions.layout}
                config={chartOptions.config}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                divId={id}
                //onBeforeHover={e => console.log(e)}
            />
            <Slider
                classes={{ root: "chartSlider" }}
                value={algo.sliderVal}
                min={1}
                max={algo.dataFeatures.length}
                step={1}
                onChange={(_, val) => {
                    Plotly.Fx.hover(id, [{ curveNumber: 0, pointNumber: val - 1 }]);
                    changeSliderVal(algo.algorithmName, val);
                }}
            />
        </React.Fragment>
    );
}

function makeAlgoState(req) {
    // Separate the request object from the promise and cleanup functions
    const state = req.requestObj;
    state.sliderVal = 1;
    return state;
}

function DimensionalityReductionResults(props) {
    // Create state objects for each DR we're running so that we can keep track of them.
    const [algoStates, setAlgoStates] = useState(_ => props.requests.map(makeAlgoState));

    function changeSliderVal(algorithmName, val) {
        setAlgoStates(
            algoStates.map(algo =>
                algo.algorithmName === algorithmName ? { ...algo, sliderVal: val } : algo
            )
        );
    }

    useEffect(_ => {
        // As each request promise resolves with server data, update the state.
        props.requests.forEach(request => {
            request.req.then(data => {
                setAlgoStates(
                    algoStates.map(algo =>
                        algo.algorithmName === data.algorithmName
                            ? Object.assign(algo, { data })
                            : algo
                    )
                );
                //update the redux feature state with the new data
                console.log(data);
                //this is subject to change
                let featureName = data.algorithm;
                let featureData = data.data;
                props.featureAdd(featureName,featureData);
            });
        });

        // If the window is closed before the requests have all resolved, cancel all of them.
        return function cleanup() {
            props.requests.map(({ cancel }) => cancel());
        };
    }, []);

    // State getter and setter for the list of currently selected drs
    const [selectedAlgos, setSelectedAlgos] = useState([]);
    function toggleSelected(name) {
        setSelectedAlgos(
            selectedAlgos.includes(name)
                ? selectedAlgos.filter(algo => algo !== name)
                : selectedAlgos.concat([name])
        );
    }

    const maxYRange = Math.max(
        ...algoStates.reduce(
            (acc, algo) => (algo.data ? acc.concat(algo.data.explained_variance_ratio) : acc),
            []
        )
    );

    return (
        <div className="drResults">
            <Typography variant="h6">All Reductions</Typography>
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
                        </div>
                        <div className="plot">{makeDRPlot(algo, maxYRange, changeSliderVal)}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return {};
}

function mapDispatchToProps(dispatch) {
    return {
        featureAdd: bindActionCreators(dataActions.featureAdd, dispatch),
        //featureAdd:function(){console.log("Yeety");}
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DimensionalityReductionResults);