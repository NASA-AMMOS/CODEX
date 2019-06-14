import "components/Graphs/HistogramGraph.css";

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

    let data = [];

    for (let i = 0; i < features.length; i++) {
        data[i] = {
            x: features[i],
            xaxis: 'x',
            yaxis: 'y',
            type: "histogram",
            //marker: { color: features[i].map((val, idx) => DEFAULT_POINT_COLOR), size:2 },
            //selected: { marker: { color: "#FF0000", size: 5 } },
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
            margin: { l: 50, r: 5, t: 20, b: 20 }, // Axis tick labels are drawn in the margin space
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            yaxis: {
                title:features[index][0],
                fixedrange: true,
            },
            shapes:[]
        };

        layouts.push(layout);
    }

    return layouts;
}

function HistogramGraph(props) {
    const features = utils.unzip(props.data.get("data"));

    const chartRefs = features.map((feat) => useRef(null));

    let data = generatePlotData(features);

    let layouts = generateLayouts(features);

    return (
        <GraphWrapper
            resizeHandler = {_ => (chartRefs.forEach((chart) => chart.current.resizeHandler()))}
        >
            <ul className="histogram-graph-container"> 
                {
                    data.map((dataElement,index) => (
                        <HistogramSubGraph
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

function createRectangle(range) {
    return {
            type: 'rect',
            xref: 'x',
            yref: 'paper',
            x0: range.x[0],
            y0: 0,
            x1: range.x[1],
            y1: 1,
            fillcolor: 'rgba(255,0,0,.5)',
            line: {
                width: 0
            }
        }
}



function HistogramSubGraph(props) {
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

    const [yRange, setYRange] = useState([0,0]);

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

    function getPointsInRange(range) {
        let dataToParse = chartState.data[0].x;
        let ret = [];
        
        dataToParse.forEach((data,idx) => {
            if (data < range.x[1] && data > range.x[0])
                ret.push(idx);
        });

        return ret;
    }

    function getRangeFromIndices(indices) {
        let min = chartState.data[0].x[indices[0]];
        let max = chartState.data[0].x[indices[0]];
        indices.forEach((row) => {
            min = chartState.data[0].x[row] < min ? chartState.data[0].x[row] : min;
            max = chartState.data[0].x[row] > max ? chartState.data[0].x[row] : max;
        });

        return {x:[min,max]};
    }

    // Function to color each chart point according to the current list of saved selections. NOTE: The data is modified in-place.
    useEffect(
        _ => {
            //clear shapes
            chartState.layout.shapes = [];
            if(!props.savedSelections) return;

            props.savedSelections.forEach(selection => {
                //todo update selection state with ranges
                //create rectangle
                //todo make this more efficient with sets or something
                const rect = createRectangle(
                    getRangeFromIndices(selection.rowIndices)
                );
                if (!chartState.layout.shapes.contains(rect))
                    chartState.layout.shapes.push(rect);
            });
            updateChartRevision();
        },
        [props.savedSelections]
    );

    // Function to update the chart with the latest global chart selection. NOTE: The data is modified in-place.
    useEffect(
        _ => {
            if (!props.currentSelection) return;
            //clear shapes
            chartState.layout.shapes = [];
            if (props.currentSelection.length == 0)
                return;
            //add a rectangle
            let rect = createRectangle(getRangeFromIndices(props.currentSelection));
            chartState.layout.shapes.push(rect);

            updateChartRevision();
        },
        [props.currentSelection]
    ); 
    
    return (
        <Plot
            className="histogram-subplot"
            ref={props.chart}
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
                if (!e) return;
                //fix range
                let points = getPointsInRange(e.range);
                props.setCurrentSelection(points);
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
)(HistogramGraph);