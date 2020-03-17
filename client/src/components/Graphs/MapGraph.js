import "components/Graphs/HeatmapGraph3d.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";

import GraphWrapper from "components/Graphs/GraphWrapper";
import * as graphFunctions from "components/Graphs/graphFunctions";
import * as uiTypes from "constants/uiTypes";
import * as utils from "utils/utils";

import { filterBounds } from "./graphFunctions";
import { usePrevious } from "../../hooks/UtilHooks";
import {
    useSetWindowNeedsAutoscale,
    useWindowAxisLabels,
    useWindowFeatureList,
    useWindowGraphBounds,
    useWindowMapType,
    useWindowNeedsResetToDefault,
    useWindowShowGridLines,
    useWindowTitle,
    useWindowXAxis,
    useWindowYAxis,
    useWindowZAxis
} from "../../hooks/WindowHooks";

const DEFAULT_MAP_TYPE = uiTypes.MAP_USGS;
const DEFAULT_ZOOM = 0;
const DEFAULT_TITLE = "Map Graph";

function getMapConfig(mapType) {
    switch (mapType) {
        case uiTypes.MAP_USGS:
            return {
                style: "white-bg",
                layers: [
                    {
                        sourcetype: "raster",
                        source: [
                            "https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}"
                        ],
                        below: "traces"
                    }
                ]
            };
        case uiTypes.MAP_OPEN_STREET_MAP:
            return { style: "open-street-map" };
    }
}

function MapGraph(props) {
    const chart = useRef(null);
    const [chartId] = useState(utils.createNewId());
    // Changing things in map mode requires a total re-render instead of just a revision increment
    // Changing the `key` attribute of the Plot causes React to trash it and make a new one.
    const [renderKey, setRenderKey] = useState(0);

    const [featuresImmutable] = useWindowFeatureList(props.win.id);
    const featureList = featuresImmutable.toJS();
    const [windowTitle, setWindowTitle] = useWindowTitle(props.win.id);
    const [xAxis, setXAxis] = useWindowXAxis(props.win.id);
    const [yAxis, setYAxis] = useWindowYAxis(props.win.id);
    const [zAxis, setZAxis] = useWindowZAxis(props.win.id);
    const [bounds, setBounds] = useWindowGraphBounds(props.win.id);
    const [mapType, setMapType] = useWindowMapType(props.win.id);
    const [axisLabels, setAxisLabels] = useWindowAxisLabels(props.win.id);
    const [showGridLines, setShowGridLines] = useWindowShowGridLines(props.win.id);
    const [needsResetToDefault, setNeedsResetToDefault] = useWindowNeedsResetToDefault(
        props.win.id
    );
    const [needsAutoscale, setNeedsAutoscale] = useSetWindowNeedsAutoscale(props.win.id);

    //the number of interpolation steps that you can take caps at 5?
    const interpolatedColors = graphFunctions.interpolateColors(
        "rgb(255, 255, 255)",
        "rgb(255, 0, 0)",
        5,
        "linear"
    );

    const baseCols = utils.removeSentinelValuesRevised(props.data, props.fileInfo);
    const cols = filterBounds(
        featureList,
        baseCols.map(col => col.data),
        bounds && bounds.toJS()
    ).map((data, idx) => ({ ...baseCols[idx], data }));

    const featureDisplayNames = featureList.map(featureName =>
        props.data.find(feature => feature.get("feature") === featureName).get("displayName")
    );

    function setDefaults() {
        setBounds(
            baseCols.reduce((acc, col) => {
                acc[col.feature] = { min: Math.min(...col.data), max: Math.max(...col.data) };
                return acc;
            }, {})
        );
        setAxisLabels(
            featureList.reduce((acc, featureName) => {
                acc[featureName] = featureName;
                return acc;
            }, {})
        );
        setWindowTitle(featureDisplayNames.join(" vs "));
        setXAxis(featureList[0]);
        setYAxis(featureList[1]);
        setZAxis(featureList[2]);
        setMapType(uiTypes.MAP_USGS);
        setShowGridLines(true);
    }

    const heatMode = featureList.length === 3;
    const dataset = heatMode
        ? {
              type: "densitymapbox",
              lon: cols[1].data,
              lat: cols[0].data,
              z: cols[2].data,
              colorscale: interpolatedColors
          }
        : {
              type: "scattermapbox",
              lon: cols[1].data,
              lat: cols[0].data,
              marker: { color: "fuchsia", size: 4 }
          };

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [dataset],
        layout: {
            dragmode: "zoom",
            mapbox: {
                ...getMapConfig(DEFAULT_MAP_TYPE),
                zoom: DEFAULT_ZOOM
            },
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: false, // Turning off hovermode seems to screw up click handling
            titlefont: { size: 5 },
            annotations: [],
            geo: {
                lonaxis: {
                    showgrid: true,
                    gridcolor: "rgb(102, 102, 102)"
                },
                lataxis: {
                    showgrid: true,
                    gridcolor: "rgb(102, 102, 102)"
                },
                showland: true,
                landcolor: "rgb(243,243,243)",
                countrycolor: "rgb(204,204,204)"
            }
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    });

    // Effect to keep map type updated if it's changed
    useEffect(
        _ => {
            if (!mapType) return;
            let traceType;
            if (mapType === uiTypes.MAP_USGS || mapType === uiTypes.MAP_OPEN_STREET_MAP) {
                traceType = featureList.length < 3 ? "scattermapbox" : "densitymapbox";
                setChartState(state => ({
                    ...state,
                    layout: {
                        ...state.layout,
                        mapbox: { ...getMapConfig(mapType), zoom: DEFAULT_ZOOM }
                    },
                    data: state.data.map(trace => ({ ...trace, type: traceType }))
                }));
            } else {
                traceType = "scattergeo";
                setChartState(state => ({
                    ...state,
                    data: state.data.map(trace => ({ ...trace, type: traceType }))
                }));
            }
            setRenderKey(renderKey + 1);
        },
        [mapType]
    );

    // Effect to keep axes updated if they've been changed
    const oldData = usePrevious(JSON.stringify(props.win.data));
    useEffect(
        _ => {
            if (!xAxis) return;
            const newData = [...chartState.data];

            // this is a little kludgy, but if the user switches to from the singlex multipley map,
            // the z-index can be set to GRAPH_INDEX,
            // which doesn't apply here
            const x = cols.find(col => col.feature === xAxis);
            newData[0].lat = x ? x.data : featureList[0];

            newData[0].lon = cols.find(col => col.feature === yAxis).data;
            if (zAxis) newData[0].z = cols.find(col => col.feature === zAxis).data;
            setChartState(state => ({ ...state, data: newData }));
            setRenderKey(renderKey + 1);
        },
        [bounds, xAxis, yAxis, zAxis]
    );

    useEffect(
        _ => {
            setChartState(state => ({
                ...state,
                layout: {
                    ...state.layout,
                    geo: {
                        ...state.layout.geo,
                        lonaxis: { ...state.layout.geo.lonaxis, showgrid: showGridLines },
                        lataxis: { ...state.layout.geo.lataxis, showgrid: showGridLines }
                    }
                }
            }));
            setRenderKey(renderKey + 1);
        },
        [showGridLines]
    );

    useEffect(
        _ => {
            if (needsResetToDefault) {
                setDefaults();
                setNeedsResetToDefault(false);
            }
        },
        [needsResetToDefault]
    );

    useEffect(_ => {
        if (windowTitle) return; // Don't set defaults if we're keeping numbers from a previous chart in this window.
        setDefaults();
    }, []);

    useEffect(
        _ => {
            if (needsAutoscale) {
                chartState.layout.xaxis.autorange = true;
                chartState.layout.yaxis.autorange = true;
                setNeedsAutoscale(false);
            }
        },
        [needsAutoscale]
    );

    return (
        <GraphWrapper chart={chart} chartId={chartId} win={props.win}>
            <Plot
                key={renderKey}
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
                divId={chartId}
            />
        </GraphWrapper>
    );
}

export default MapGraph;
