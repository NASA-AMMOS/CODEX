import "./HeatmapGraph3d.css";

import { TinyColor } from "@ctrl/tinycolor";
import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect, useMemo } from "react";

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
import GraphWrapper from "./GraphWrapper";
import * as graphFunctions from "./graphFunctions";
import * as uiTypes from "../../constants/uiTypes";
import * as utils from "../../utils/utils";

const DEFAULT_MAP_TYPE = uiTypes.MAP_USGS;
const DEFAULT_ZOOM = 0;
const DEFAULT_TITLE = "Map Graph";
const DEFAULT_POINT_SIZE = 4;

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
    const chartRevision = useRef(0);

    //the number of interpolation steps that you can take caps at 5?
    const interpolatedColors = graphFunctions.interpolateColors(
        "rgb(255, 255, 255)",
        "rgb(255, 0, 0)",
        5,
        "linear"
    );

    const [baseCols] = useState(_ => utils.removeSentinelValuesRevised(props.data, props.fileInfo));

    const cols = useMemo(
        _ =>
            graphFunctions
                .filterBounds(featureList, baseCols.map(col => col.data), bounds && bounds.toJS())
                .map((data, idx) => ({ ...baseCols[idx], data })),
        [baseCols, bounds]
    );

    const featureDisplayNames = featureList.map(
        featureName => props.data.find(feature => feature.feature === featureName).displayName
    );

    const heatMode = featureList.length === 3;
    const zAxisTitle = heatMode
        ? (axisLabels && axisLabels.get(zAxis)) ||
          props.data.find(feature => feature.feature === featureList[2]).displayName
        : null;

    const baseX =
        xAxis && xAxis !== uiTypes.GRAPH_INDEX
            ? cols[featureList.findIndex(feature => feature === xAxis)]
            : cols[0];
    const baseY = yAxis ? cols[featureList.findIndex(feature => feature === yAxis)] : cols[1];

    function setDefaults(init) {
        if (!init || !bounds)
            setBounds(
                baseCols.reduce((acc, col) => {
                    const [min, max] = utils.getMinMax(col.data);
                    acc[col.feature] = { min, max };
                    return acc;
                }, {})
            );
        if (!init || !axisLabels)
            setAxisLabels(
                featureList.reduce((acc, featureName) => {
                    acc[featureName] = featureName;
                    return acc;
                }, {})
            );
        if (!init || !windowTitle) setWindowTitle(featureDisplayNames.join(" vs "));

        setXAxis(featureList[0]);
        setYAxis(featureList[1]);
        setZAxis(featureList[2]);
        setMapType(uiTypes.MAP_USGS);
        if (!init || showGridLines === undefined) setShowGridLines(true);
    }

    const baseTrace = (function() {
        if (heatMode)
            return {
                type: "densitymapbox",
                lon: cols[1].data,
                lat: cols[0].data,
                z: cols[2].data,
                colorscale: interpolatedColors,
                colorbar: { title: zAxisTitle }
            };

        const opacity = props.savedSelections.reduce((acc, sel) => {
            if (!sel.hidden) sel.rowIndices.forEach(idx => (acc[idx] = 0));
            return acc;
        }, cols[0].data.map((val, idx) => (props.currentSelection.includes(idx) ? 0 : props.hoverSelection ? 0.1 : 1)));
        return {
            type: "scattermapbox",
            lon: cols[1].data,
            lat: cols[0].data,
            marker: { color: "fuchsia", size: DEFAULT_POINT_SIZE, opacity }
        };
    })();

    const selectionTraces = useMemo(
        _ => {
            const currentSelectionTrace = props.currentSelection
                ? { color: "red", rowIndices: props.currentSelection }
                : [];
            return props.savedSelections
                .filter(sel => !sel.hidden)
                .concat(props.hoverSelection ? currentSelectionTrace : [])
                .sort((a, b) =>
                    a.id === props.hoverSelection ? 1 : b.id === props.hoverSelection ? -1 : 0
                )
                .concat(!props.hoverSelection ? currentSelectionTrace : [])
                .filter(sel => sel.rowIndices.length)
                .map((sel, _, ary) => {
                    const [lat, lon] = utils.unzip(
                        sel.rowIndices.map(idx => [baseX.data[idx], baseY.data[idx]])
                    );
                    const opacity =
                        props.hoverSelection && props.hoverSelection !== sel.id ? 0.1 : 1;
                    return {
                        lat,
                        lon,
                        type: "scattermapbox",
                        mode: "markers",
                        marker: {
                            color: new TinyColor(sel.color).setAlpha(opacity).toString(),
                            size: DEFAULT_POINT_SIZE
                        }
                    };
                });
        },
        [baseX, baseY, props.savedSelections, props.hoverSelection, props.currentSelection]
    );

    const dataset = [baseTrace, ...selectionTraces];

    // Some weird memory stuff happening where Plotly clears this whenever we change chart type,
    // so keeping this static.
    const baseConfig = {
        responsive: true,
        displaylogo: false,
        modeBarButtons: [["zoomInMapbox", "zoomOutMapbox", "resetViewMapbox"], ["hoverClosestGeo"]]
    };
    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: dataset,
        layout: {
            showlegend: false,
            dragmode: props.globalChartState || "lasso",
            datarevision: chartRevision.current,
            mapbox: {
                ...getMapConfig(DEFAULT_MAP_TYPE)
            },
            autosize: true,
            margin: { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: "closest",
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
        config: baseConfig
    });

    function updateChartRevision() {
        chartRevision.current++;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: chartRevision.current }
        });
    }

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
                    data: state.data.map(trace => ({ ...trace, type: traceType })),
                    config: baseConfig
                }));
            } else {
                traceType = "scattergeo";
                setChartState(state => ({
                    ...state,
                    data: state.data.map(trace => ({ ...trace, type: traceType })),
                    config: baseConfig
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
            if (heatMode) newData[0].colorbar.title = zAxisTitle;
            setChartState(state => ({ ...state, data: newData }));
            setRenderKey(renderKey + 1);
        },
        [bounds, xAxis, yAxis, zAxis]
    );

    useEffect(
        _ => {
            chartState.data = dataset;
            updateChartRevision();
        },
        [axisLabels, props.currentSelection, props.savedSelections, props.hoverSelection]
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
        setDefaults(true);
    }, []);

    useEffect(
        _ => {
            if (needsAutoscale) {
                chartState.layout.mapbox.zoom = DEFAULT_ZOOM;
                updateChartRevision();
                setNeedsAutoscale(false);
            }
        },
        [needsAutoscale]
    );

    useEffect(
        _ => {
            chartState.layout.dragmode = props.globalChartState;
            updateChartRevision();
        },
        [props.globalChartState]
    );

    return (
        <GraphWrapper chart={chart} chartId={chartId} win={props.win}>
            <Plot
                key={renderKey}
                ref={chart}
                data={chartState.data}
                layout={chartState.layout}
                config={baseConfig}
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
