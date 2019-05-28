import "components/Graphs/ContourGraph.css";

import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";
import Popover from "@material-ui/core/Popover";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Plot from "react-plotly.js";
import * as utils from "utils/utils";
import ReactResizeDetector from "react-resize-detector";

const DEFAULT_POINT_COLOR = "#3386E6";

// Returns a single rgb color interpolation between given rgb color
// based on the factor given; via https://codepen.io/njmcode/pen/axoyD?editors=0010
function interpolateColor(color1, color2, factor) {
    if (arguments.length < 3) { 
        factor = 0.5; 
    }
    let result = color1.slice();
    for (let i = 0; i < 3; i++) {
        result[i] = Math.round(result[i] + factor * (color2[i] - color1[i]));
    }
    return result;
}

// My function to interpolate between two colors completely, returning an array
function interpolateColors(color1, color2, steps, scaling) {
    let stepFactor = 1 / (steps - 1),
        interpolatedColorArray = [];

    color1 = color1.match(/\d+/g).map(Number);
    color2 = color2.match(/\d+/g).map(Number);

    let percentage = 0.0;

    if(scaling === "log") {
        percentage = 1.0/(Math.pow(10, steps));
    } else { //assumed linear
        percentage = 0.0;
    }

    for(let i = 0; i < steps; i++) {
        const interpolatedColor = interpolateColor(color1, color2, stepFactor * i);
        interpolatedColorArray.push([percentage , "rgb("+interpolatedColor[0]+","+interpolatedColor[1]+","+interpolatedColor[2]+")"]);
        
        if (scaling === "log") {
            percentage *= 10; 
        } else { //assumed linear
            percentage += (1.0/steps);
        }
    }

    return interpolatedColorArray;
}

function dataRange(data) {
    let min = data[0];
    let max = data[0];

    for (let i = 0; i < data.length; i++) {
        min = data[i] < min ? data[i] : min;
        max = data[i] > max ? data[i] : max;
    }

    return [min, max];
}

function squashDataIntoBuckets(data, numBuckets){

    const unzippedCols = utils.unzip(data.slice(1));
    const cols = data.slice(1);

    let ret = new Array(numBuckets).fill(0).map(() => new Array(numBuckets).fill(0));

    const [xMin, xMax] = dataRange(unzippedCols[0]);
    const [yMin, yMax] = dataRange(unzippedCols[1]);

    const xDivisor = (xMax - xMin) / numBuckets;
    const yDivisor = (yMax - yMin) / numBuckets;

    for (let i = 0; i<cols.length; i++) {
            let xValue = Math.floor((cols[i][0] - xMin) / xDivisor);
            xValue = xValue > 0 && xValue < numBuckets ? xValue : 0;
            let yValue = Math.floor((cols[i][1] - yMin) / yDivisor);
            yValue = yValue > 0 && yValue < numBuckets ? yValue : 0;

            ret[yValue][xValue]++;
    }
    return ret;
}

function generateRange(low, high, increment) {

    let range = [];
    for(let i = low; i < high; i+=increment) {
        range.push(i);
    }

    return range;
}

function HeatmapGraph(props) {
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });

    function handleContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuVisible(true);
        setContextMenuPosition({ top: e.clientY, left: e.clientX });
    }

    const chart = useRef(null);

    let defaultBucketCount = 50;

    const interpolatedColors = interpolateColors("rgb(255, 255, 255)", "rgb(255, 0, 0)", 10, "linear");
    console.log(interpolatedColors);
    
    //calculate range of data for axis labels
    const unzippedCols = utils.unzip(props.data.get("data").slice(1));
    const [xMin, xMax] = dataRange(unzippedCols[0]);
    const [yMin, yMax] = dataRange(unzippedCols[1]);

    const cols = squashDataIntoBuckets(props.data.get("data"), defaultBucketCount);
    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: generateRange(xMin, xMax, (xMax - xMin)/defaultBucketCount),
                y: generateRange(yMin, yMax, (yMax - yMin)/defaultBucketCount),
                z: cols,
                type: "heatmap",
                showscale: true,
                colorscale: interpolatedColors,
            }
        ],
        layout: {
            xaxis: { 
                automargin: true, 
                ticklen: 0 
            },
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
    });

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

    return (
        <React.Fragment>
            <ReactResizeDetector
                handleWidth
                handleHeight
                onResize={_ => chart.current.resizeHandler()}
            />
            <div className="chart-container" onContextMenu={handleContextMenu}>
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
                />
            </div>

            <Popover
                id="simple-popper"
                open={contextMenuVisible}
                anchorReference="anchorPosition"
                anchorPosition={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left"
                }}
            >
                <ClickAwayListener onClickAway={_ => setContextMenuVisible(false)}>
                    <List>
                        <ListItem
                            button
                            onClick={_ => {
                                setContextMenuVisible(false);
                                props.saveCurrentSelection();
                            }}
                        >
                            Save Selection
                        </ListItem>
                    </List>
                </ClickAwayListener>
            </Popover>
        </React.Fragment>
    );
}

function mapStateToProps(state) {
    return {
        currentSelection: state.selections.currentSelection,
        savedSelections: state.selections.savedSelections
    };
}

function mapDispatchToProps(dispatch) {
    return {
        setCurrentSelection: bindActionCreators(selectionActions.setCurrentSelection, dispatch),
        saveCurrentSelection: bindActionCreators(selectionActions.saveCurrentSelection, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(HeatmapGraph);
