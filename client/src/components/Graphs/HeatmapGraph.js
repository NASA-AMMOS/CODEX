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

function squashDataIntoBuckets(){}

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
    const data = props.data.get("data");

    const xAxis = data[0][0];
    const yAxis = data[0][1];

    const cols = utils.unzip(data.slice(1));
    console.log(cols);
    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: [...cols[0]].sort((a, b) => a - b),
                y: [...cols[1]].sort((a, b) => b - a).map(idx => `Label ${idx}`),
                z: [],
                type: "heatmap",
                colorscale: 'Reds',
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

            <div className="xAxisLabel">{xAxis}</div>
            <div className="yAxisLabel">{yAxis}</div>
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
