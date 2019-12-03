import "components/Graphs/HistogramGraph.css";

import React, { useRef, useState, useEffect, createRef } from "react";
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

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import {
    useCurrentSelection,
    useSavedSelections,
    usePinnedFeatures,
    useFileInfo
} from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UIHooks";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_SELECTION_COLOR = "#FF0000";
const DEFAULT_TITLE = "Histogram Graph";

function generatePlotData(features, fileInfo) {
    const cols = utils.removeSentinelValues(features.map(feature => feature.data), fileInfo);
    return features.map((feature, idx) => {
        return {
            x: cols[idx],
            xaxis: "x",
            yaxis: "y",
            type: "histogram",
            hoverinfo: "x+y"
        };
    });
}

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

    let data = generatePlotData(features, props.fileInfo);

    let layouts = generateLayouts(features);

    return (
        <GraphWrapper
            resizeHandler={_ =>
                chartRefs.current.forEach(chartRef => chartRef.current.resizeHandler())
            }
            chartIds={chartIds}
            win={props.win}
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

export default props => {
    const win = useWindowManager(props, {
        width: 500,
        height: 500,
        resizeable: true,
        title: DEFAULT_TITLE
    });

    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    const [savedSelections, saveCurrentSelection] = useSavedSelections();
    const [globalChartState, setGlobalChartState] = useGlobalChartState();
    const fileInfo = useFileInfo();

    const features = usePinnedFeatures(win);

    if (features === null) {
        return <WindowCircularProgress />;
    }
    if (features.size === 0) {
        return <WindowError> Please select at least one feature to use this graph.</WindowError>;
    }

    if (win.title === DEFAULT_TITLE)
        win.setTitle(
            features
                .map(f => f.get("feature"))
                .toJS()
                .join(" vs ")
        );
    return (
        <HistogramGraph
            currentSelection={currentSelection}
            setCurrentSelection={setCurrentSelection}
            savedSelections={savedSelections}
            saveCurrentSelection={saveCurrentSelection}
            globalChartState={globalChartState}
            data={features}
            fileInfo={fileInfo}
            win={win}
        />
    );
};
