import "components/Graphs/HeatmapGraph3d.css";

import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";
import Plot from "react-plotly.js";
import * as utils from "utils/utils";
import GraphWrapper from "components/Graphs/GraphWrapper";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import {
    useCurrentSelection,
    useSavedSelections,
    usePinnedFeatures,
    useFileInfo
} from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UIHooks";
import * as uiTypes from "constants/uiTypes";
import * as graphFunctions from "components/Graphs/graphFunctions";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_BUCKET_COUNT = 50;

function squashDataIntoBuckets(data, numBuckets, features, zAxis) {
    const zAxisIndex = features.findIndex(colName => colName === zAxis);
    const maxes = data.map(col => Math.max(...col));
    const mins = data.map(col => Math.min(...col));
    const bucketSizes = data.map((_, idx) => (maxes[idx] - mins[idx]) / numBuckets);

    return utils
        .unzip(data)
        .reduce(
            (acc, dataPoint) => {
                const [xIdx, yIdx] = dataPoint.map((val, idx) =>
                    val === maxes[idx]
                        ? numBuckets - 1
                        : Math.floor((val - mins[idx]) / bucketSizes[idx])
                );
                acc[yIdx][xIdx].push(dataPoint[zAxisIndex]);
                return acc;
            },
            Array(numBuckets)
                .fill(0)
                .map(_ =>
                    Array(numBuckets)
                        .fill(0)
                        .map(_ => [0])
                )
        )
        .map(row => row.map(values => values.reduce((acc, val) => val + acc, 0) / values.length));
}

function dataRange(data) {
    let min = data[0];
    let max = data[0];
    data.forEach(row => {
        min = row < min ? row : min;
        max = row > max ? row : max;
    });

    return [min, max];
}

function generateRange(low, high, increment) {
    let range = [];
    for (let i = low; i < high; i += increment) {
        range.push(i);
    }

    return range;
}

function generateDataAxis(col) {
    const [min, max] = dataRange(col);
    return generateRange(min, max, (max - min) / DEFAULT_BUCKET_COUNT);
}

function HeatmapGraph3d(props) {
    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

    // Set x-axis averages as the z-axis
    useEffect(
        _ => props.win.setData(data => ({ ...data.toJS(), zAxis: props.win.data.features[0] })),
        []
    );

    //the number of interpolation steps that you can take caps at 5?
    const interpolatedColors = graphFunctions.interpolateColors(
        "rgb(255, 255, 255)",
        "rgb(255, 0, 0)",
        5,
        "linear"
    );

    const data = utils.removeSentinelValues(
        props.win.data.features.map(colName =>
            props.data
                .find(col => col.get("feature") === colName)
                .get("data")
                .toJS()
        ),
        props.fileInfo
    );

    //calculate range of data for axis labels
    const xAxis = props.win.data.features[0];
    const yAxis = props.win.data.features[1];

    const cols = squashDataIntoBuckets(
        data,
        DEFAULT_BUCKET_COUNT,
        props.win.data.features,
        props.win.data.features[0]
    );
    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: generateDataAxis(data[0]),
                y: generateDataAxis(data[1]),
                z: cols,
                type: "heatmap",
                showscale: true,
                colorscale: interpolatedColors
            }
        ],
        layout: {
            dragmode: "lasso",
            xaxis: {
                title: xAxis,
                automargin: true,
                ticklen: 0,
                scaleratio: 1.0
            },
            yaxis: {
                title: yAxis,
                automargin: true,
                ticklen: 0,
                anchor: "x"
            },
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: false, // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            annotations: []
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    });

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

    // Effect to keep axes updated if they've been swapped
    useEffect(
        _ => {
            chartState.data[0].x = generateDataAxis(data[0]);
            chartState.data[0].y = generateDataAxis(data[1]);
            chartState.data[0].z = squashDataIntoBuckets(
                data,
                DEFAULT_BUCKET_COUNT,
                props.win.data.features,
                props.win.data.zAxis
            );
            chartState.layout.xaxis.title = xAxis;
            chartState.layout.yaxis.title = yAxis;
            updateChartRevision();
        },
        [props.win.data.features]
    );

    // Effect to keep z-axis updated if it's changed
    useEffect(
        _ => {
            if (props.win.data.zAxis) {
                chartState.data[0].z = squashDataIntoBuckets(
                    data,
                    DEFAULT_BUCKET_COUNT,
                    props.win.data.features,
                    props.win.data.zAxis
                );
            }
        },
        [props.win.data.zAxis]
    );

    return (
        <GraphWrapper chart={chart} chartId={chartId} win={props.win}>
            <Plot
                ref={chart}
                data={chartState.data}
                layout={chartState.layout}
                config={chartState.config}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                onInitialized={figure => setChartState(figure)}
                onUpdate={figure => setChartState(figure)}
                onClick={e => {
                    if (e.event.button === 2) return;
                    props.setCurrentSelection([]);
                }}
                onSelected={e => {
                    if (e) props.setCurrentSelection(e.points.map(point => point.pointIndex));
                }}
                divId={chartId}
            />
        </GraphWrapper>
    );
}

export default props => {
    const win = useWindowManager(props, {
        width: 500,
        height: 500,
        resizeable: true,
        title: "Heat Map"
    });

    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    //const [savedSelections, saveCurrentSelection] = useSavedSelections();
    //const [globalChartState, setGlobalChartState] = useGlobalChartState();
    const fileInfo = useFileInfo();

    const features = usePinnedFeatures(win);

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    if (features.size === 2) {
        win.setTitle(win.data.features.join(" vs "));
        return (
            <HeatmapGraph3d
                currentSelection={currentSelection}
                setCurrentSelection={setCurrentSelection}
                data={features}
                fileInfo={fileInfo}
                win={win}
            />
        );
    } else {
        return (
            <WindowError>
                Please select exactly two features
                <br />
                in the features list to use this graph.
            </WindowError>
        );
    }
};
