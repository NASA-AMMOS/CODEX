import "components/Graphs/HeatmapGraph3d.css";

import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useCurrentSelection, usePinnedFeatures, useFileInfo } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import GraphWrapper from "components/Graphs/GraphWrapper";
import * as graphFunctions from "components/Graphs/graphFunctions";
import * as uiTypes from "constants/uiTypes";
import * as utils from "utils/utils";

const DEFAULT_MAP_TYPE = uiTypes.MAP_USGS;
const DEFAULT_ZOOM = 0;

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

    // Set x-axis averages as the z-axis
    useEffect(_ => props.win.setData(data => ({ ...data.toJS(), mapType: uiTypes.MAP_USGS })), []);

    //the number of interpolation steps that you can take caps at 5?
    const interpolatedColors = graphFunctions.interpolateColors(
        "rgb(255, 255, 255)",
        "rgb(255, 0, 0)",
        5,
        "linear"
    );

    const cols = utils.removeSentinelValues(
        props.win.data.features.map(colName =>
            props.data
                .find(col => col.get("feature") === colName)
                .get("data")
                .toJS()
        ),
        props.fileInfo
    );

    const heatMode = props.win.data.features.length === 3;
    const dataset = heatMode
        ? {
              type: "densitymapbox",
              lon: cols[1],
              lat: cols[0],
              z: cols[2],
              colorscale: interpolatedColors
          }
        : {
              type: "scattermapbox",
              lon: cols[1],
              lat: cols[0],
              marker: { color: "fuchsia", size: 4 }
          };

    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);
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
            annotations: []
        },
        config: {
            displaylogo: false,
            displayModeBar: false
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

    // Effect to keep map type updated if it's changed
    useEffect(
        _ => {
            if (props.win.data.mapType) {
                setChartState(state => ({
                    ...state,
                    layout: {
                        ...state.layout,
                        mapbox: { ...getMapConfig(props.win.data.mapType), zoom: DEFAULT_ZOOM }
                    }
                }));
                setRenderKey(renderKey + 1);
            }
        },
        [props.win.data.mapType]
    );

    // Effect to keep axes updated if they've been swapped
    useEffect(
        _ => {
            const newData = [...chartState.data];
            newData[0].lat = cols[0];
            newData[0].lon = cols[1];
            setChartState(state => ({ ...state, data: newData }));
            setRenderKey(renderKey + 1);
        },
        [props.win.data.features]
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

export default props => {
    const win = useWindowManager(props, {
        width: 700,
        height: 500,
        resizeable: true,
        title: "Map Graph"
    });

    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    //const [savedSelections, saveCurrentSelection] = useSavedSelections();
    //const [globalChartState, setGlobalChartState] = useGlobalChartState();
    const fileInfo = useFileInfo();

    const features = usePinnedFeatures(win);

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    if (features.size === 2 || features.size === 3) {
        win.setTitle(win.data.features.join(" vs "));
        return (
            <MapGraph
                currentSelection={currentSelection}
                setCurrentSelection={setCurrentSelection}
                data={features}
                fileInfo={fileInfo}
                win={win}
            />
        );
    } else {
        return (
            <WindowError>
                Please select no more than three features
                <br />
                in the features list to use this graph.
            </WindowError>
        );
    }
};
