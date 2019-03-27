import "components/Graphs/ScatterGraph.css";

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

function ScatterGraph(props) {
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });

    function handleContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuVisible(true);
        setContextMenuPosition({ top: e.clientY, left: e.clientX });
    }

    const chart = useRef(null);
    const cols = utils.unzip(props.data.get("data"));
    const xAxis = cols[0][0];
    const yAxis = cols[1][0];

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: cols[0],
                y: cols[1],
                type: "scattergl",
                mode: "markers",
                marker: { color: "#3386E6", size: 2 },
                selected: { marker: { color: "#FF0000", size: 2 } }
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0 },
            dragmode: "lasso"
            // hovermode: false
        },
        config: { displayModeBar: true, responsive: true, displaylogo: false }
    });

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);

    // Function to update the chart with the latest global chart selection.
    useEffect(
        _ => {
            if (!props.currentSelection) return;
            const data = chartState.data;
            data[0] = { ...chartState.data[0], selectedpoints: props.currentSelection };
            const revision = chartRevision + 1;
            setChartState({
                ...chartState,
                data,
                layout: { ...chartState.layout, datarevision: revision }
            });
            setChartRevision(revision);
        },
        [props.currentSelection]
    );

    return (
        <React.Fragment>
            <ReactResizeDetector
                handleWidth
                handleHeight
                onResize={_ => chart.current.resizeHandler()}
            />

            <Plot
                ref={chart}
                data={chartState.data}
                layout={chartState.layout}
                config={chartState.config}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                onInitialized={figure => setChartState(figure)}
                onUpdate={figure => setChartState(figure)}
                onClick={e => console.log("click1")}
                onSelected={e => {
                    props.setCurrentSelection(e ? e.points.map(point => point.pointIndex) : []);
                }}
            />

            <div className="xAxisLabel">{xAxis}</div>
            <div className="yAxisLabel">{yAxis}</div>
        </React.Fragment>
    );
}

function mapStateToProps(state) {
    return {
        currentSelection: state.selections.currentSelection,
        selections: state.selections.selections
    };
}

function mapDispatchToProps(dispatch) {
    return {
        createSelection: bindActionCreators(selectionActions.createSelection, dispatch),
        setCurrentSelection: bindActionCreators(selectionActions.setCurrentSelection, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ScatterGraph);
