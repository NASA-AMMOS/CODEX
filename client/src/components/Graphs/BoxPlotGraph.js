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
            dragmode: 'lasso',
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

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

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
        />
    );
}


export default BoxPlotGraph
