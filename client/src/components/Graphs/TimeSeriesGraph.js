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
            type: "scattergl",
            mode: "lines",
            visible: true
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
            dragmode: 'lasso',
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            xaxis: {
                automargin: true
            },
            yaxis: {
                title:features[index][0],
                automargin: true,
                fixedrange: true,
                showline: false,
            }
        };

        //putting x axis only on the last one
        if (index != (features.length - 1)){
            layout.xaxis.visible = false;
            layout.margin.l = 20;
        }
        //add axis title
        layout.yaxis.title = {
            text:features[index][0]
        };

        layouts.push(layout);
    }

    return layouts;
}

function TimeSeriesGraph(props) {
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });

    function handleContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuVisible(true);
        setContextMenuPosition({ top: e.clientY, left: e.clientX });
    }

    const features = utils.unzip(props.data.get("data"));

    const chartRefs = features.map((feat) => useRef(null));

    let data = generatePlotData(features);

    let layouts = generateLayouts(features);

    return (
        <React.Fragment>
            <ReactResizeDetector
                handleWidth
                handleHeight
                onResize={_ => (chartRefs.forEach((chart) => chart.current.resizeHandler()))}
            />
            <div className="chart-container" onContextMenu={handleContextMenu}>
                <ul className="time-series-plot-container"> 
                    {
                        data.map((dataElement,index) => (
                            <TimeSeriesSubGraph
                                data={dataElement}
                                chart={chartRefs[index]}
                                layout={layouts[index]}
                                globalChartState={props.globalChartState}
                            />
                        ))
                    }
                </ul>
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

    // Function to update the chart with the latest global chart selection. NOTE: The data is modified in-place.
    useEffect(
        _ => {
            if (!props.currentSelection) return;
            chartState.data.selectedpoints = props.currentSelection;
            updateChartRevision();
        },
        [props.currentSelection]
    );
    //handle this later

    useEffect(
        _ => {
            chartState.layout.dragmode = props.globalChartState; // Weirdly this works, can't do it with setChartState
            updateChartRevision();
        },
        [props.globalChartState]
    );
    
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
                if (e.event.button === 2) return;
                props.setCurrentSelection([]);
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
        savedSelections: state.selections.savedSelections,
        globalChartState: state.ui.get("globalChartState")
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
