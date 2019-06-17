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
import GraphWrapper, { useBoxSelection } from "components/Graphs/GraphWrapper";

const DEFAULT_POINT_COLOR = "#3386E6";

function generatePlotData(features) {
    let data = [];

    for (let i = 0; i < features.length; i++) {
        data[i] = {
            y: features[i],
            yaxis: "y",
            type: "box",
            visible: true,
            name: features[i][0]
        };
    }
    return data;
}

function generateLayouts(features) {
    let layouts = [];

    for (let index = 0; index < features.length; index++) {
        let layout = {
            autosize: true,
            margin: { l: 15, r: 5, t: 5, b: 20 }, // Axis tick labels are drawn in the margin space
            dragmode: "select",
            selectdirection: "v",
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            xaxis: {
                automargin: true,
                showline: false
            },
            yaxis: {
                automargin: true,
                fixedrange: true
            },
            shapes: []
        };

        layouts.push(layout);
    }

    return layouts;
}

function BoxPlotGraph(props) {
    const features = utils.unzip(props.data.get("data"));

    const chartRefs = features.map(feat => useRef(null));

    let data = generatePlotData(features);

    let layouts = generateLayouts(features);

    return (
        <GraphWrapper
            resizeHandler={_ => chartRefs.forEach(chart => chart.current.resizeHandler())}
        >
            <ul className="box-plot-container">
                {data.map((dataElement, index) => (
                    <BoxPlotSubGraph
                        data={dataElement}
                        chart={chartRefs[index]}
                        layout={layouts[index]}
                        globalChartState={props.globalChartState}
                        setCurrentSelection={props.setCurrentSelection}
                        currentSelection={props.currentSelection}
                        savedSelections={props.savedSelections}
                    />
                ))}
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
            displaylogo: false
        }
    });

    let data = chartState.data[0].y;

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

    const [selectionShapes] = useBoxSelection(
        "vertical",
        props.currentSelection,
        props.savedSelections,
        chartState.data[0].y
    );

    useEffect(
        _ => {
            chartState.layout.shapes = selectionShapes;

            updateChartRevision();
        },
        [selectionShapes]
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
                if (e.event.button === 2 || e.event.ctrlKey) return;
                props.setCurrentSelection([]);
            }}
            onSelected={e => {
                if (!e) return;
                let points = utils.indicesInRange(chartState.data[0].y, e.range.y[0], e.range.y[1]);

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
