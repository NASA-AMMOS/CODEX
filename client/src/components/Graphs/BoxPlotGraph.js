import "components/Graphs/BoxPlotGraph.css";

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
            y: features[i],
            yaxis: 'y'+(i),
            type: "box",
            visible: true,
            name:features[i][0]
        };
    }
    return data;
}

function generateLayouts(features) {
    let layouts = [];

    for(let index = 0; index < features.length; index++) {
        let layout = {
            autosize: true,
            margin: { l: 15, r: 5, t: 5, b: 20 }, // Axis tick labels are drawn in the margin space
            dragmode: 'select',
            selectdirection: 'v',
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            xaxis: {
                automargin: true,
                showline:false,
            },
            yaxis: {
                automargin: true,
                fixedrange: true
            }
        };

        layouts.push(layout);
    }

    return layouts;
}

function createRectangle(range) {

    return {
            type: 'rect',
            xref: 'x',
            yref: 'y',
            x0: -.5,
            y0: range.y[0],
            x1: .5,
            y1: range.y[1],
            fillcolor: 'rgba(255,0,0,.5)',
            line: {
                width: 0
            }
        }
}

function BoxPlotGraph(props) {
    const features = utils.unzip(props.data.get("data"));

    const chartRefs = features.map((feat) => useRef(null));

    let data = generatePlotData(features);

    let layouts = generateLayouts(features);
    
    return (
        <GraphWrapper
            resizeHandler = {_ => (chartRefs.forEach((chart) => chart.current.resizeHandler()))}
        >
            <ul className="box-plot-container"> 
                {
                    data.map((dataElement,index) => (
                        <BoxPlotSubGraph
                            data={dataElement}
                            chart={chartRefs[index]}
                            layout={layouts[index]}
                            globalChartState={props.globalChartState}
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

function BoxPlotSubGraph(props) {
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

    function getPointsInRange(range) {
        let dataToParse = chartState.data[0].y;
        let ret = [];

        dataToParse.forEach((data,idx) => {
            if (data < range.y[1] && data > range.y[0])
                ret.push(idx);
        });

        return ret;
    }

    function getRangeFromIndices(indices) {
        let min = chartState.data[0].y[indices[0]];
        let max = chartState.data[0].y[indices[0]];
        indices.forEach((row) => {
            min = chartState.data[0].y[row] < min ? chartState.data[0].y[row] : min;
            max = chartState.data[0].y[row] > max ? chartState.data[0].y[row] : max;
        });

        return {y:[min,max]};
    }

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
            className="box-subplot"
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
)(BoxPlotGraph);
