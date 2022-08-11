import CircularProgress from "@material-ui/core/CircularProgress";
import Plot from "react-plotly.js";
import React, { useState, useMemo } from "react";

import classnames from "classnames";

import * as utils from "../../utils/utils";

const DEFAULT_POINT_COLOR = "#3386E6";

// Utility function that creates a set of series based on server return data.
function createPlotSeries(serverData) {
    return serverData.data.reduce(
        (acc, val, idx) => {
            const seriesIndex = serverData.clusters[idx];
            if (seriesIndex !== -1) {
                acc.data[seriesIndex] = acc.data[seriesIndex] || [];
                acc.data[seriesIndex].push(val);
            } else {
                // Noise is indicated by a cluster index of -1
                acc.noise.push(val);
            }
            return acc;
        },
        { data: [], noise: [] }
    );
}

function makeChart(props) {
    const cols = utils.unzip(props.serverData.data);
    const chartState = {
        data: [
            {
                x: cols[0],
                y: cols[1],
                type: "scatter",
                mode: "markers",
                marker: {
                    color: cols[0].map((val, idx) => {
                        const cluster = props.serverData.clusters[idx];
                        return cluster === -1 ? "#eee" : utils.getSelectionPalette()[cluster];
                    }),
                    size: 5
                },
                selected: { marker: { color: "#FF0000", size: 2 } },
                visible: true
            }
        ],
        layout: {
            autosize: true,
            margin: props.xAxisLabel ? undefined : { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: false, // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            xaxis: {
                automargin: true,
                title: { text: props.xAxisLabel }
            },
            yaxis: {
                automargin: true,
                title: { text: props.yAxisLabel }
            }
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    };

    return (
        <Plot
            data={chartState.data}
            layout={chartState.layout}
            config={chartState.config}
            style={{ width: "100%", height: "100%" }}
            useResizeHandler
        />
    );
}

// Render the subalgo plot div.
function SubalgoChart(props) {
    const [hoverState, setHoverState] = useState(false);

    const dataPoints = props.serverData ? props.serverData.data : null;
    const containerClasses = classnames({
        "subalgo-container": true,
        selected: (!props.previewMode && hoverState) || props.selected,
        "preview-mode": props.previewMode
    });

    const titleClasses = classnames({
        "subalgo-title": true,
        selected: (!props.previewMode && hoverState) || props.selected,
        "preview-mode": props.previewMode
    });

    const loadingClasses = classnames({
        "subalgo-chart-loading": true,
        "large-mode": props.previewMode
    });

    const timeToGenerate =
        props.serverData && props.serverData.eta ? `~${props.serverData.eta.toFixed(2)}s` : "";

    const chart = useMemo(
        _ => {
            if (props.serverData) return makeChart(props);
        },
        [props.serverData]
    );

    return (
        <div
            className={containerClasses}
            onMouseOver={_ => setHoverState(true)}
            onMouseOut={_ => setHoverState(false)}
            onClick={props.onClick}
        >
            <div className={titleClasses}>
                <span className="subalgo-title-text">{props.titleText}</span>
                <span className="subalgo-header-time">{timeToGenerate}</span>
            </div>
            <div className={loadingClasses} hidden={props.loaded}>
                <CircularProgress />
            </div>
            <div className="subalgo-plot" hidden={!props.serverData}>
                {chart}
            </div>
            <div className="subalgo-time" hidden={props.previewMode}>
                {timeToGenerate}
            </div>
        </div>
    );
}

export default SubalgoChart;
