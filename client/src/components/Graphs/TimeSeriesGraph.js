import "components/Graphs/TimeSeriesGraph.css";

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
import GraphWrapper from "components/Graphs/GraphWrapper";

const DEFAULT_POINT_COLOR = "#3386E6";

function generatePlotData(features) {
    //generate time axis list
    let timeAxis = [];
    for (let i = 0; i < features[0].length; i++) {
        timeAxis.push(i);
    }

    let data = [];

    for (let i = 0; i < features.length; i++) {
        data[i] = {
            x: timeAxis,
            y: features[i],
            xaxis: 'x'+(i+1),
            yaxis: 'y1',
            mode: "lines+markers",
            type: "scatter",
            marker: { color: features[i].map((val, idx) => DEFAULT_POINT_COLOR), size:2 },
            selected: { marker: { color: "#FF0000", size: 5 } },
        };
    }
    return data;
}

function generateLayouts(features) {
    let layouts = [];

    for(let index = 0; index < features.length; index++) {
        let layout = {
            dragmode: 'select',
            selectdirection: 'h',
            margin: { l: 40, r: 5, t: 5, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            yaxis: {
                title:features[index][0],
                fixedrange: true,
            },
        };

        let axisLabel = "xaxis"+(index+1);
        layout[axisLabel] = {};

        if (index != (features.length - 1)) {
            layout[axisLabel].visible = false;
        } else {
            layout.margin.b = 25;
        }

        layouts.push(layout);
    }

    return layouts;
}

function TimeSeriesGraph(props) {
    const features = utils.unzip(props.data.get("data"));

    const chartRefs = features.map((feat) => useRef(null));

    let data = generatePlotData(features);

    let layouts = generateLayouts(features);
    
    return (
        <GraphWrapper
            resizeHandler = {_ => (chartRefs.forEach((chart) => chart.current.resizeHandler()))}
        >
            <ul className="time-series-plot-container"> 
                {
                    data.map((dataElement,index) => (
                        <TimeSeriesSubGraph
                            axisKey={"x"+(index+1)}
                            data={data[index]}
                            chart={chartRefs[index]}
                            layout={layouts[index]}
                            setCurrentSelection={props.setCurrentSelection}
                            currentSelection={props.currentSelection}
                            savedSelections={props.savedSelections}
                        />
                    ))
                }
            </ul>
        </GraphWrapper>
    );
}


function TimeSeriesSubGraph(props) {
     // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
    const [chartState, setChartState] = useState({
        data: [props.data],
        layout: props.layout,
        config: {
            responsive: true,
            displaylogo: false,
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

    // Function to color each chart point according to the current list of saved selections. NOTE: The data is modified in-place.
    useEffect(
        _ => {
            chartState.data[0].marker.color = chartState.data[0].marker.color.map(
                _ => DEFAULT_POINT_COLOR
            );

            props.savedSelections.forEach(selection => {
                selection.rowIndices.forEach(row => {
                    chartState.data[0].marker.color[row] = selection.active
                        ? selection.color
                        : DEFAULT_POINT_COLOR;
                });
            });
            updateChartRevision();
        },
        [props.savedSelections]
    );

    // Function to update the chart with the latest global chart selection. NOTE: The data is modified in-place.
    useEffect(
        _ => {
            if (!props.currentSelection) return;
            chartState.data[0].selectedpoints = props.currentSelection;
            updateChartRevision();
        },
        [props.currentSelection]
    );
    //handle this later
    
    return (
        <Plot
            className="time-series-subplot"
            ref={props.chart}
            data={chartState.data}
            layout={chartState.layout}
            config={chartState.config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
            onInitialized={figure => setChartState(figure)}
            onUpdate={figure => setChartState(figure)}
            onClick={e => {
                console.log(props.currentSelection);
                if (e.event.button === 2) return;
                props.setCurrentSelection([]);
                console.log(props.currentSelection)
            }}
            onSelected={e => {
                if (e) props.setCurrentSelection(e.points.map(point => point.pointIndex));
            }}

        />
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
)(TimeSeriesGraph);