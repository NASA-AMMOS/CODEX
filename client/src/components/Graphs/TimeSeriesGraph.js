import "components/Graphs/TimeSeriesGraph.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect, createRef } from "react";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import {
    useCurrentSelection,
    useSavedSelections,
    usePinnedFeatures,
    useFileInfo
} from "hooks/DataHooks";
import { useGlobalChartState } from "hooks/UIHooks";
import { useWindowManager } from "hooks/WindowHooks";
import GraphWrapper, { useBoxSelection } from "components/Graphs/GraphWrapper";
import * as utils from "utils/utils";

import { filterSingleCol } from "./graphFunctions";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_TITLE = "Time Series Graph";

function generateLayouts(features) {
    let layouts = [];

    for (let index = 0; index < features.length; index++) {
        let layout = {
            dragmode: "select",
            selectdirection: "h",
            margin: { l: 40, r: 5, t: 5, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            yaxis: {
                title: features[index].feature,
                fixedrange: true
            }
        };

        let axisLabel = "xaxis" + (index + 1);
        layout[axisLabel] = {};

        if (index != features.length - 1) {
            layout[axisLabel].visible = false;
        } else {
            layout.margin.b = 25;
        }

        layouts.push(layout);
    }

    return layouts;
}

function TimeSeriesGraph(props) {
    const features = props.data.toJS();
    const featureNames = features.map(feature => {
        return feature.feature;
    });

    const [chartIds] = useState(_ => featureNames.map(_ => utils.createNewId()));
    const chartRefs = useRef(featureNames.map(() => createRef()));

    function generatePlotData() {
        const cols = props.win.data.features
            .map(colName => [
                props.data
                    .find(col => col.get("feature") === colName)
                    .get("data")
                    .toJS(),
                props.win.data.bounds && props.win.data.bounds[colName]
            ])
            .map(([col, bounds]) => [utils.removeSentinelValues([col], props.fileInfo)[0], bounds])
            .map(([col, bounds]) => filterSingleCol(col, bounds));

        //generate time axis list
        const timeAxis = [...Array(cols[0].length).keys()];

        return [
            features.map((feature, idx) => {
                return {
                    x: timeAxis,
                    y: cols[idx],
                    xaxis: "x",
                    yaxis: "y1",
                    mode: "lines",
                    type: "scatter"
                };
            }),
            cols
        ];
    }

    const [processedData, setProcessedData] = useState(_ => generatePlotData());
    const [data, cols] = processedData;

    let layouts = generateLayouts(features);

    const featureDisplayNames = props.win.data.features.map(featureName =>
        props.data.find(feature => feature.get("feature") === featureName).get("displayName")
    );

    // Update bound state with the calculated bounds of the data
    useEffect(_ => {
        if (!props.win.title) props.win.setTitle(featureDisplayNames.join(" , "));
        props.win.setData(data => ({
            ...data.toJS(),
            bounds:
                props.win.data.bounds ||
                props.win.data.features.reduce((acc, colName, idx) => {
                    acc[colName] = { min: Math.min(...cols[idx]), max: Math.max(...cols[idx]) };
                    return acc;
                }, {})
        }));
    }, []);

    // Update data state when the bounds change
    useEffect(
        _ => {
            setProcessedData(generatePlotData());
        },
        [props.win.data.bounds]
    );

    return (
        <GraphWrapper
            resizeHandler={_ =>
                chartRefs.current.forEach(chartRef => chartRef.current.resizeHandler())
            }
            win={props.win}
            chartIds={chartIds}
        >
            <ul className="time-series-plot-container">
                {data.map((dataElement, index) => (
                    <TimeSeriesSubGraph
                        key={index}
                        axisKey={"x" + (index + 1)}
                        data={data[index]}
                        chart={chartRefs.current[index]}
                        layout={layouts[index]}
                        setCurrentSelection={props.setCurrentSelection}
                        currentSelection={props.currentSelection}
                        savedSelections={props.savedSelections}
                        chartId={chartIds[index]}
                    />
                ))}
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
            displaylogo: false
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

    const [selectionShapes] = useBoxSelection(
        "horizontal",
        props.currentSelection,
        props.savedSelections,
        chartState.data[0].x
    );

    useEffect(
        _ => {
            chartState.layout.shapes = selectionShapes;

            updateChartRevision();
        },
        [selectionShapes]
    );

    // Effect to update graph when data changes
    useEffect(
        _ => {
            chartState.data = [props.data];
            updateChartRevision();
        },
        [props.data]
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
                if (e.event.button === 2 || e.event.ctrlKey) return;
                props.setCurrentSelection([]);
            }}
            onSelected={e => {
                if (!e) return;
                let points = utils.indicesInRange(chartState.data[0].x, e.range.x[0], e.range.x[1]);
                props.setCurrentSelection(points);
            }}
            divId={props.chartId}
        />
    );
}

export default TimeSeriesGraph;
