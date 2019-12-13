import "components/Graphs/HistogramGraph.css";

import { bindActionCreators } from "redux";
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
import GraphWrapper from "components/Graphs/GraphWrapper";
import * as selectionActions from "actions/selectionActions";
import * as utils from "utils/utils";

import { filterSingleCol } from "./graphFunctions";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_SELECTION_COLOR = "#FF0000";
const DEFAULT_TITLE = "Histogram Graph";

function generateLayouts(features) {
    let layouts = [];

    for (let index = 0; index < features.length; index++) {
        let layout = {
            dragmode: "select",
            selectdirection: "h",
            margin: { l: 50, r: 5, t: 20, b: 40 }, // Axis tick labels are drawn in the margin space
            hovermode: "compare", // Turning off hovermode seems to screw up click handling
            yaxis: {
                title: "Counts",
                fixedrange: true
            },
            xaxis: {
                title: features[index].feature
            },
            shapes: [],
            barmode: "overlay",
            showlegend: false,
            hoverinfo: "x+y"
        };

        layouts.push(layout);
    }

    return layouts;
}

function HistogramGraph(props) {
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

        return [
            features.map((feature, idx) => {
                return {
                    x: cols[idx],
                    xaxis: "x",
                    yaxis: "y",
                    type: "histogram",
                    hoverinfo: "x+y"
                };
            }),
            cols
        ];
    }

    const [processedData, setProcessedData] = useState(_ => generatePlotData());
    const [data, cols] = processedData;

    let layouts = generateLayouts(features);

    // Update bound state with the calculated bounds of the data
    useEffect(_ => {
        if (!props.win.title) props.win.setTitle(props.win.data.features.join(" and "));
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
            chartIds={chartIds}
            win={props.win}
            stacked
        >
            <ul className="histogram-graph-container">
                {data.map((dataElement, index) => (
                    <HistogramSubGraph
                        key={index}
                        data={data[index]}
                        chart={chartRefs.current[index]}
                        layout={layouts[index]}
                        setCurrentSelection={props.setCurrentSelection}
                        currentSelection={props.currentSelection}
                        savedSelections={props.savedSelections}
                        chartId={chartIds[index]}
                        win={props.win}
                    />
                ))}
            </ul>
        </GraphWrapper>
    );
}

function getSelectionBins(chartRef, data, selection, color) {
    if (!chartRef.current) return null;
    try {
        const binInfo = chartRef.current.el._fullData[0].xbins;

        const bins = [];
        for (let i = binInfo.start; i < binInfo.end; i += binInfo.size) {
            bins.push([i, i + binInfo.size]);
        }

        const x = selection.reduce((acc, sel) => {
            const value = data.x[sel];
            const binIndex = bins.findIndex(bin => bin[0] <= value && bin[1] >= value);
            acc.push(binIndex);
            return acc;
        }, []);

        return {
            type: "histogram",
            x: selection.map(sel => data.x[sel]),
            marker: {
                color
            },
            xbins: binInfo,
            hoverinfo: "x+y"
        };
    } catch (e) {
        // We can't overlay other selections until we know the base bin size,
        // so we have to wait until the chart renders
        return null;
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
            displaylogo: false
        }
    });

    // Effect to change the x-bin size
    useEffect(
        _ => {
            if (!props.win.data || !props.win.data.binSize) return;
            chartState.data = chartState.data.map(dataset =>
                Object.assign(dataset, { nbinsx: props.win.data.binSize.x })
            );
            updateChartRevision();
        },
        [props.win.data]
    );

    // Effect to update graph when data changes
    useEffect(
        _ => {
            chartState.data = [props.data];
            updateChartRevision();
        },
        [props.data]
    );

    const [yRange, setYRange] = useState([0, 0]);

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

    // Hook to handle drawing selections
    useEffect(
        _ => {
            const currentSelection = getSelectionBins(
                props.chart,
                props.data,
                props.currentSelection,
                "red"
            );
            const currentSelectionList = currentSelection ? [currentSelection] : [];

            const savedSelections = props.savedSelections.reduce((acc, sel) => {
                const selection = getSelectionBins(
                    props.chart,
                    props.data,
                    sel.rowIndices,
                    sel.color
                );
                if (selection) acc.push(selection);
                return acc;
            }, []);

            chartState.data = [chartState.data[0], ...savedSelections, ...currentSelectionList];
            updateChartRevision();
        },
        [props.currentSelection, props.savedSelections]
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
                if (e.event.button === 2 || e.event.ctrlKey) return;
                props.setCurrentSelection([]);
            }}
            onSelected={e => {
                if (!e) return;
                //fix range
                let points = utils.indicesInRange(chartState.data[0].x, e.range.x[0], e.range.x[1]);
                props.setCurrentSelection(points);
            }}
            divId={props.chartId}
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

export default HistogramGraph;
