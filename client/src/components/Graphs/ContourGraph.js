import "components/Graphs/ContourGraph.css";

import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";
import Plot from "react-plotly.js";
import * as utils from "utils/utils";
import GraphWrapper from "components/Graphs/GraphWrapper.js";

const DEFAULT_POINT_COLOR = "#3386E6";

function ContourGraph(props) {
    const chart = useRef(null);

    const data = props.data.get("data");

    const xAxis = data[0][0];
    const yAxis = data[0][1];

    const cols = utils.unzip(data.slice(1));
    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: cols[0],
                y: cols[1],
                ncontours: 20,
                colorscale: "Hot",
                reversescale: true,
                showscale: false,
                type: "histogram2dcontour"
                // mode: "markers",
                // marker: { color: cols[0].map((val, idx) => DEFAULT_POINT_COLOR), size: 2 },
                // selected: { marker: { color: "#FF0000", size: 2 } },
                // visible: true
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 35, r: 0, t: 0, b: 25 }, // Axis tick labels are drawn in the margin space
            dragmode: "lasso",
            datarevision: chartRevision,
            hovermode: "closest",
            xaxis: {
                autotick: true,
                automargin:true,
                ticks: "outside",
                title: xAxis
            },
            yaxis: {
                autotick: true,
                automargin:true,
                ticks: "outside",
                title: yAxis
            }
        },
        config: {
            responsive: true,
            displaylogo: false,
            modeBarButtonsToRemove: [
                "sendDataToCloud",
                "hoverCompareCartesian",
                "toImage",
                "select2d",
                "autoScale2d",
                "toggleSpikelines"
            ]
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
        <GraphWrapper
            chart = {chart}
        >
            <Plot
                ref={chart}
                data={chartState.data}
                layout={chartState.layout}
                config={chartState.config}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                onInitialized={figure => setChartState(figure)}
                onUpdate={figure => setChartState(figure)}
            />
        </GraphWrapper>
    );
}
export default ContourGraph;
