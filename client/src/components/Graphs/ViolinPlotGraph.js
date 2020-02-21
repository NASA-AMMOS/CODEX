import "components/Graphs/ViolinPlotGraph.css";

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
const COLOR_CURRENT_SELECTION = "#FF0000";

function handleGlobalChartState(state) {
    return state === "lasso" ? "select" : state;
}

function generateLayouts(features) {
    return features.reduce((acc, feature, idx) => {
        const xAxisName = `xaxis${idx === 0 ? "" : idx + 1}`;
        const yAxisName = `yaxis${idx === 0 ? "" : idx + 1}`;
        acc[xAxisName] = {
            title: feature.feature,
            automargin: true,
            showline: false
        };
        acc[yAxisName] = {
            automargin: true,
            fixedrange: true
        };
        return acc;
    }, {});
}

function makeSelectionShapes(selection, data) {
    return data
        .map((col, dataIdx) =>
            !selection.rowIndices.length
                ? null
                : selection.rowIndices
                      .reduce((acc, val) => {
                          const lastSection = acc.length && acc[acc.length - 1];
                          if (lastSection && lastSection[lastSection.length - 1] + 1 === val) {
                              lastSection.push(val);
                              return acc;
                          }

                          acc.push([val]);
                          return acc;
                      }, [])
                      .map(section => {
                          const xSize = 1 / data.length;
                          return {
                              type: "rect",
                              xref: "paper",
                              yref: `y${dataIdx > 0 ? dataIdx + 1 : ""}`,
                              x0: dataIdx * xSize,
                              y0: section[0],
                              x1: dataIdx * xSize + xSize,
                              y1: section[section.length - 1],
                              fillcolor: selection.color,
                              opacity: 0.2,
                              line: {
                                  // Draw a line when the selection is only a single point
                                  width: section.length === 1 ? 1 : 0,
                                  color: selection.color
                              }
                          };
                      })
        )
        .flat();
}

function ViolinPlotGraph(props) {
    const features = props.data.toJS();
    const featureNames = features.map(feature => {
        return feature.feature;
    });

    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());

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
                const trace = {
                    y: cols[idx],
                    type: "violin",
                    hoverinfo: "x+y",
                    marker: { color: DEFAULT_POINT_COLOR },
                    name: ""
                };
                if (idx > 0) {
                    trace.xaxis = `x${idx + 1}`;
                    trace.yaxis = `y${idx + 1}`;
                }
                return trace;
            }),
            cols
        ];
    }

    const [processedData, setProcessedData] = useState(_ => generatePlotData());
    const [data, cols] = processedData;

    const layouts = generateLayouts(features);

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);

    const [chartState, setChartState] = useState({
        data: data,
        layout: {
            grid: {
                rows: 1,
                columns: data.length,
                pattern: "independent"
            },
            showlegend: false,
            margin: { l: 40, r: 5, t: 5, b: 20 }, // Axis tick labels are drawn in the margin space
            dragmode: handleGlobalChartState(props.globalChartState) || "select",
            selectdirection: "v",
            hovermode: "compare", // Turning off hovermode seems to screw up click handling

            ...layouts
        },
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

    // Effect to update graph when data changes
    useEffect(
        _ => {
            chartState.data = data;
            updateChartRevision();
        },
        [data]
    );

    // Effect to handle drawing of selections
    useEffect(
        _ => {
            chartState.layout.shapes = props.savedSelections
                .concat(
                    props.currentSelection.length && {
                        color: COLOR_CURRENT_SELECTION,
                        rowIndices: props.currentSelection
                    }
                )
                .filter(x => x)
                .map(sel => makeSelectionShapes(sel, data))
                .flat();
            updateChartRevision();
        },
        [props.currentSelection, props.savedSelections]
    );

    // Update the chart state when the global chart state changes
    useEffect(
        _ => {
            chartState.layout.dragmode = handleGlobalChartState(props.globalChartState);
            updateChartRevision();
        },
        [props.globalChartState]
    );

    return (
        <GraphWrapper chart={chart} win={props.win} chartId={chartId}>
            <Plot
                ref={chart}
                data={chartState.data}
                layout={chartState.layout}
                config={chartState.config}
                style={{ width: "100%", height: "100%" }}
                onInitialized={figure => setChartState(figure)}
                onUpdate={figure => setChartState(figure)}
                useResizeHandler
                divId={chartId}
                onClick={e => {
                    if (e.event.button === 2 || e.event.ctrlKey) return;
                    props.setCurrentSelection([]);
                }}
                onSelected={e => {
                    if (!e) return;
                    const selKey = Object.keys(e.range).find(key => key.startsWith("y"));
                    props.setCurrentSelection(
                        utils.range(Math.floor(e.range[selKey][0]), Math.ceil(e.range[selKey][1]))
                    );
                }}
            />
        </GraphWrapper>
    );
}

// function generateLayouts(features) {
//     let layouts = [];

//     for (let index = 0; index < features.length; index++) {
//         let layout = {
//             autosize: true,
//             margin: { l: 15, r: 5, t: 5, b: 20 }, // Axis tick labels are drawn in the margin space
//             dragmode: "select",
//             selectdirection: "v",
//             hovermode: "compare", // Turning off hovermode seems to screw up click handling
//             titlefont: { size: 5 },
//             xaxis: {
//                 automargin: true,
//                 showline: false
//             },
//             yaxis: {
//                 automargin: true,
//                 fixedrange: true
//             },
//             shapes: []
//         };

//         layouts.push(layout);
//     }

//     return layouts;
// }

// function ViolinPlotGraph(props) {
//     //const features = utils.unzip(props.data.get("data"));

//     const features = props.data.toJS();
//     const featureNames = features.map(feature => {
//         return feature.feature;
//     });

//     const chartRefs = useRef(featureNames.map(() => createRef()));

//     const [chartIds] = useState(_ => featureNames.map(_ => utils.createNewId()));

//     function generatePlotData() {
//         const cols = props.win.data.features
//             .map(colName => [
//                 props.data
//                     .find(col => col.get("feature") === colName)
//                     .get("data")
//                     .toJS(),
//                 props.win.data.bounds && props.win.data.bounds[colName]
//             ])
//             .map(([col, bounds]) => [utils.removeSentinelValues([col], props.fileInfo)[0], bounds])
//             .map(([col, bounds]) => filterSingleCol(col, bounds));

//         return [
//             features.map((feature, idx) => {
//                 return {
//                     y: cols[idx],
//                     yaxis: "y",
//                     type: "violin",
//                     visible: true,
//                     name: feature.displayName,
//                     box: {
//                         visible: true
//                     }
//                 };
//             }),
//             cols
//         ];
//     }

//     const [processedData, setProcessedData] = useState(_ => generatePlotData());
//     const [data, cols] = processedData;

//     const featureDisplayNames = props.win.data.features.map(featureName =>
//         props.data.find(feature => feature.get("feature") === featureName).get("displayName")
//     );

//     // Update bound state with the calculated bounds of the data
//     useEffect(_ => {
//         if (!props.win.title) props.win.setTitle(featureDisplayNames.join(" , "));
//         props.win.setData(data => ({
//             ...data.toJS(),
//             bounds:
//                 props.win.data.bounds ||
//                 props.win.data.features.reduce((acc, colName, idx) => {
//                     acc[colName] = { min: Math.min(...cols[idx]), max: Math.max(...cols[idx]) };
//                     return acc;
//                 }, {})
//         }));
//     }, []);

//     // Update data state when the bounds change
//     useEffect(
//         _ => {
//             setProcessedData(generatePlotData());
//         },
//         [props.win.data.bounds]
//     );

//     let layouts = generateLayouts(features);

//     return (
//         <GraphWrapper
//             resizeHandler={_ =>
//                 chartRefs.current.forEach(chartRef => chartRef.current.resizeHandler())
//             }
//             win={props.win}
//             chartIds={chartIds}
//         >
//             <ul className="box-plot-container">
//                 {data.map((dataElement, index) => (
//                     <ViolinPlotSubGraph
//                         key={index}
//                         data={dataElement}
//                         chart={chartRefs.current[index]}
//                         layout={layouts[index]}
//                         setCurrentSelection={props.setCurrentSelection}
//                         currentSelection={props.currentSelection}
//                         savedSelections={props.savedSelections}
//                         chartId={chartIds[index]}
//                     />
//                 ))}
//             </ul>
//         </GraphWrapper>
//     );
// }

// function ViolinPlotSubGraph(props) {
//     // The plotly react element only changes when the revision is incremented.
//     const [chartRevision, setChartRevision] = useState(0);

//     const [chartState, setChartState] = useState({
//         data: [props.data],
//         layout: props.layout,
//         config: {
//             responsive: true,
//             displaylogo: false
//         }
//     });

//     function updateChartRevision() {
//         const revision = chartRevision + 1;
//         setChartState({
//             ...chartState,
//             layout: { ...chartState.layout, datarevision: revision }
//         });
//         setChartRevision(revision);
//     }

//     const [selectionShapes] = useBoxSelection(
//         "vertical",
//         props.currentSelection,
//         props.savedSelections,
//         chartState.data[0].y
//     );

//     useEffect(
//         _ => {
//             chartState.layout.shapes = selectionShapes;

//             updateChartRevision();
//         },
//         [selectionShapes]
//     );

//     // Effect to update graph when data changes
//     useEffect(
//         _ => {
//             chartState.data = [props.data];
//             updateChartRevision();
//         },
//         [props.data]
//     );

//     return (
//         <Plot
//             className="box-subplot"
//             ref={props.chart}
//             data={chartState.data}
//             layout={chartState.layout}
//             config={chartState.config}
//             style={{ width: "100%", height: "100%" }}
//             useResizeHandler
//             onInitialized={figure => setChartState(figure)}
//             onUpdate={figure => setChartState(figure)}
//             onClick={e => {
//                 if (e.event.button === 2 || e.event.ctrlKey) return;
//                 props.setCurrentSelection([]);
//             }}
//             onSelected={e => {
//                 if (!e) return;
//                 let points = utils.indicesInRange(chartState.data[0].y, e.range.y[0], e.range.y[1]);

//                 props.setCurrentSelection(points);
//             }}
//             divId={props.chartId}
//         />
//     );
// }

export default ViolinPlotGraph;
