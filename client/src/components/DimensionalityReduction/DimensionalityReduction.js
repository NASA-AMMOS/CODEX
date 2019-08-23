import "components/DimensionalityReduction/dimensionalityReductions.scss";

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import Plot from "react-plotly.js";
import React, { useEffect, useState } from "react";
import Slider from "@material-ui/lab/Slider";
import Typography from "@material-ui/core/Typography";

import { WindowCircularProgress, WindowError } from "components/WindowHelpers/WindowCenter";
import {
    WindowLayout,
    ExpandingContainer,
    FixedContainer
} from "components/WindowHelpers/WindowLayout";
import { WindowXScroller } from "components/WindowHelpers/WindowScroller";
import { useSelectedFeatureNames, useFilename, useNewFeature } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import HelpButton from "components/WindowHelpers/WindowHelp";
import * as dimensionalityReductionTypes from "constants/dimensionalityReductionTypes";
import * as utils from "utils/utils";

/**
 * Create the dimensionality reduction window
 * @param state current state
 * @return tuple of (requests, runParams)
 */
async function createAllDrRequests(selectedFeatures, filename) {
    selectedFeatures = selectedFeatures.toJS();

    // create all the requests
    let requests = dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_TYPES.map(dr => {
        return {
            name: dr,
            paramData: dimensionalityReductionTypes.DIMENSIONALITY_REDUCTION_PARAMS[dr].map(param =>
                Object.assign(param, {
                    subParams: param.subParams.map(subParam =>
                        Object.assign(subParam, {
                            value: selectedFeatures.length
                        })
                    )
                })
            )
        };
    })
        .map(drstate => createDrRequest(filename, selectedFeatures, drstate))
        .map(request => {
            const { req, cancel } = utils.makeSimpleRequest(request);
            return { req, cancel, requestObj: request };
        });

    // wait on everything
    requests = await Promise.all(requests);

    return [requests, { selectedFeatures }];
}

// Creates a request object for a regression run that can be converted to JSON and sent to the server.
function createDrRequest(filename, selectedFeatures, drstate) {
    return {
        routine: "algorithm",
        algorithmName: drstate.name,
        algorithmType: "dimensionality_reduction",
        dataFeatures: selectedFeatures,
        filename,
        identification: { id: "dev0" },
        parameters: { [drstate.paramData[0].name]: drstate.paramData[0].subParams[0].value }, // UGH! This is really hacky and should be fixed when we refactor all these algo functions.
        dataSelections: [],
        downsampled: false
    };
}

// Utility to create a Plotly chart for each algorithm data return from the server.
// We show a loading progress indicator if the data hasn't arrived yet.
function makeDRPlot(algo, maxYRange, changeSliderVal, featureAdd) {
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
                    //Plotly.Fx.hover(id, [{ curveNumber: 0, pointNumber: val - 1 }]);
                    changeSliderVal(algo.algorithmName, val);
                }}
            />
            <Button fullWidth onClick={e => featureAdd(algo)}>
                Save
            </Button>
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
                //this is subject to change
                //let featureName = data.algorithm;
                //let featureData = data.data;
                //props.featureAdd(featureName, featureData);
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

    const [helpModeState, setHelpModeState] = useState(false);
    const algoVerb = "dimensionality_reduction";

    const algoGraphs = algoStates.map(algo => (
        <FixedContainer key={algo.algorithmName}>
            <div className="regressionHeader" onClick={() => toggleSelected(algo.algorithmName)}>
                {algo.algorithmName.length <= 20
                    ? algo.algorithmName
                    : algo.algorithmName.slice(0, 17) + "..."}
            </div>
            <div className="plot">
                {makeDRPlot(algo, maxYRange, changeSliderVal, props.featureAdd)}
            </div>
        </FixedContainer>
    ));

    return (
        <WindowLayout>
            <FixedContainer>
                <WindowLayout fluid direction="row" align="center">
                    <Typography variant="h6">All Reductions</Typography>
                    <ExpandingContainer />
                    <FixedContainer>
                        <HelpButton
                            title={"Dimensionality Reduction Help"}
                            guidancePath={`${algoVerb}_page:general_${algoVerb}`}
                        />
                    </FixedContainer>
                </WindowLayout>
            </FixedContainer>
            <ExpandingContainer>
                <WindowXScroller>
                    <WindowLayout fluid direction="row">
                        {algoGraphs}
                    </WindowLayout>
                </WindowXScroller>
            </ExpandingContainer>
        </WindowLayout>
    );
}

// the overhead of noodling with the dimred internals isn't worth it
// here be dragons
const DimensionalityReduction = props => {
    const win = useWindowManager(props, {
        title: "Dimensionality Reduction",
        width: 600,
        height: 375,
        resizeable: true,
        minSize: {
            width: 400,
            height: 375
        }
    });

    const [isResolved, setIsResolved] = useState(null);
    const [currentError, setCurrentError] = useState(null);
    const [selectedFeatures, setSelectedFeatures] = useSelectedFeatureNames();
    const filename = useFilename();
    const featureAdd = useNewFeature();

    // wrap the request creation
    useEffect(() => {
        if (selectedFeatures.size < 2) {
            setCurrentError("Dimensionality reduction requires at least two selected features!");
            return;
        }
        createAllDrRequests(selectedFeatures, filename).then(r => setIsResolved(r));
    }, []);

    if (currentError !== null) {
        return <WindowError>{currentError}</WindowError>;
    } else if (isResolved === null) {
        return <WindowCircularProgress />;
    } else {
        const [requests, runParams] = isResolved; // hackish but works A-OK
        const getVectorFromSlider = a => a.data.data.map(r => r[a.sliderVal - 1]);

        return (
            <DimensionalityReductionResults
                requests={requests}
                runParams={runParams}
                featureAdd={a => {
                    featureAdd(
                        `${a.data.algorithm}_${selectedFeatures.join("_")}/${a.sliderVal}`,
                        getVectorFromSlider(a)
                    );
                }}
            />
        );
    }
};

export default DimensionalityReduction;
