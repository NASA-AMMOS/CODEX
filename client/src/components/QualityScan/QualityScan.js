import "./QualityScan.scss";

import { useDispatch } from "react-redux";
import CloseIcon from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import Plot from "react-plotly.js";
import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import Slider from "@material-ui/lab/Slider";
import Typography from "@material-ui/core/Typography";

import classnames from "classnames";

import { WindowCircularProgress } from "..//WindowHelpers/WindowCenter";
import { useFeatureNames, useFeatures, useFileInfo } from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import theme from "../../styles/theme.scss";
import * as utils from "../../utils/utils";
import * as windowManagerActions from "../../actions/windowManagerActions";

const SORT_ORIGINAL = { val: "SORT_ORIGINAL", name: "Sort Original" };
const TOTAL_ERRORS = { val: "TOTAL_ERRORS", name: "Total Errors" };
const NANS = { val: "NANS", name: "NaNs" };
const INFINITIES = { val: "INFINITIES", name: "Infinities" };
const ZSCORE = { val: "ZSCORE", name: "Z-Score" };
const REPEATS = { val: "REPEATS", name: "Repeats" };
const SELECTION = { val: "SELECTION", name: "Selection" };

const COLUMN_SORT_OPTIONS = [SORT_ORIGINAL, TOTAL_ERRORS, NANS, INFINITIES, ZSCORE, REPEATS];
const ROW_SORT_OPTIONS = [
    SORT_ORIGINAL,
    SELECTION,
    TOTAL_ERRORS,
    NANS,
    INFINITIES,
    ZSCORE,
    REPEATS
];

const DataContext = React.createContext();
const ColorContext = React.createContext({});
const ParamContext = React.createContext({});
const WindowContext = React.createContext();

function handleSliderChange(changeFunc) {
    return (_, newVal) =>
        changeFunc(colorObj => {
            return { ...colorObj, opacity: newVal / 100 };
        });
}

function handleDropdownChange(changeFunc) {
    return evt => changeFunc(evt.target.value);
}

function toggleFilter(changeFunc) {
    return _ => changeFunc(colorObj => ({ ...colorObj, active: !colorObj.active }));
}

function Sliders(props) {
    const fileInfo = useFileInfo();

    const colorContext = useContext(ColorContext);
    const [nanColor, setNanColor] = colorContext.nan;
    const [infColor, setInfColor] = colorContext.inf;
    const [repeatColor, setRepeatColor] = colorContext.repeat;

    const paramContext = useContext(ParamContext);
    const [repeatParams, setRepeatParams] = paramContext.repeat;
    const thresholdLookup = Object.keys(repeatParams.thresholdSteps);

    const nanSwatchStyles = classnames({
        "color-swatch": true,
        nan: true,
        active: nanColor.active && fileInfo.nan !== null
    });
    const infSwatchStyles = classnames({
        "color-swatch": true,
        inf: true,
        active: infColor.active && fileInfo.inf !== null
    });
    const repeatSwatchStyles = classnames({
        "color-swatch": true,
        repeat: true,
        active: repeatColor.active
    });

    const nanTitleStyles = classnames({
        "title-text": true,
        disabled: fileInfo.nan === null
    });
    const infTitleStyles = classnames({
        "title-text": true,
        disabled: fileInfo.inf === null
    });

    return (
        <React.Fragment>
            <div className="slider">
                <div className="title">
                    <div className={nanSwatchStyles} onClick={toggleFilter(setNanColor)} />
                    <Typography variant="caption" classes={{ root: nanTitleStyles }}>
                        NaN Opacity
                    </Typography>
                </div>
                <Slider
                    classes={{ root: "slider-control" }}
                    value={nanColor.opacity * 100}
                    onChange={handleSliderChange(setNanColor)}
                    disabled={fileInfo.nan === null}
                />
            </div>
            <div className="slider">
                <div className="title">
                    <div className={infSwatchStyles} onClick={toggleFilter(setInfColor)} />
                    <Typography variant="caption" classes={{ root: infTitleStyles }}>
                        Infinity Opacity
                    </Typography>
                </div>
                <Slider
                    classes={{ root: "slider-control" }}
                    value={infColor.opacity * 100}
                    onChange={handleSliderChange(setInfColor)}
                    disabled={fileInfo.inf === null}
                />
            </div>
            <div className="slider">
                <div className="title">
                    <div className={repeatSwatchStyles} onClick={toggleFilter(setRepeatColor)} />
                    <Typography variant="caption" classes={{ root: "title-text" }}>
                        Repeats Opacity
                    </Typography>
                </div>
                <Slider
                    classes={{ root: "slider-control" }}
                    value={repeatColor.opacity * 100}
                    onChange={handleSliderChange(setRepeatColor)}
                />
            </div>
            <div className="slider">
                <div className="title">
                    <Typography variant="caption" classes={{ root: "title-text no-swatch" }}>
                        Repeat Threshold ({repeatParams.threshold})
                    </Typography>
                </div>
                <Slider
                    classes={{ root: "slider-control" }}
                    value={repeatParams.sliderPosition}
                    min={0}
                    max={repeatParams.numberOfThresholds - 1}
                    step={1}
                    onChange={(_, newValue) =>
                        setRepeatParams(params => {
                            return {
                                ...params,
                                threshold: thresholdLookup[newValue],
                                sliderPosition: newValue
                            };
                        })
                    }
                />
            </div>
        </React.Fragment>
    );
}

function SortingDropdown(props) {
    const paramContext = useContext(ParamContext);
    const [colSortValue, setColSortValue] = paramContext.sortOptions.col;
    const [rowSortValue, setRowSortValue] = paramContext.sortOptions.row;

    const fileInfo = useFileInfo();

    function getDisabled(val) {
        if (val === NANS.val && fileInfo.inf === null) return true;
        if (val === INFINITIES.val && fileInfo.inf === null) return true;
        return false;
    }

    return (
        <React.Fragment>
            <div className="dropdown">
                <label>Column sorting</label>
                <select onChange={handleDropdownChange(setColSortValue)} value={colSortValue.val}>
                    {COLUMN_SORT_OPTIONS.map(opt => (
                        <option key={opt.val} value={opt.val} disabled={getDisabled(opt.val)}>
                            {opt.name}
                        </option>
                    ))}
                </select>
            </div>
            <div className="dropdown">
                <label>Row sorting</label>
                <select onChange={handleDropdownChange(setRowSortValue)} value={rowSortValue.val}>
                    {ROW_SORT_OPTIONS.map(opt => (
                        <option key={opt.val} value={opt.val} disabled={getDisabled(opt.val)}>
                            {opt.name}
                        </option>
                    ))}
                </select>
            </div>
        </React.Fragment>
    );
}

function QualityScanControls(props) {
    const win = useContext(WindowContext);
    const dispatch = useDispatch();
    return (
        <div className="qs-controls">
            <div className="header">
                <Typography variant="subtitle1" color="inherit">
                    Visualization
                </Typography>
                <IconButton
                    onClick={_ => {
                        dispatch(windowManagerActions.closeWindow(win.id));
                    }}
                >
                    <CloseIcon classes={{ root: "icon" }} />
                </IconButton>
            </div>
            <SortingDropdown />
            <Sliders />
        </div>
    );
}

function buildColor(colorObj) {
    const opacity = colorObj[0].active ? colorObj[0].opacity : 0;
    return `rgba(${colorObj[0].color.join(",")},${opacity})`;
}

function countOccurrencesOfValue(ary, value) {
    return ary.reduce((acc, val) => (val === value ? acc + 1 : acc), 0);
}

function sortCols(cols, sortOption, fileInfo, maxRepeatsPerColumn, zScoreTable) {
    const refCols = cols.map((col, idx) => ({ col, idx }));
    switch (sortOption) {
        case SORT_ORIGINAL.val:
            return refCols;
        case NANS.val:
            if (fileInfo.nan === null) return refCols;
            return refCols.sort(
                (colA, colB) =>
                    countOccurrencesOfValue(colB.col, fileInfo.nan) -
                    countOccurrencesOfValue(colA.col, fileInfo.nan)
            );
        case INFINITIES.val:
            if (fileInfo.inf === null) return refCols;
            return refCols.sort(
                (colA, colB) =>
                    countOccurrencesOfValue(colB.col, fileInfo.inf) -
                    countOccurrencesOfValue(colA.col, fileInfo.inf)
            );
        case REPEATS.val:
            return refCols
                .map(ref => ({ ...ref, repeats: maxRepeatsPerColumn[ref.idx] }))
                .sort((a, b) => b.repeats - a.repeats);
        case ZSCORE.val:
            return refCols
                .map(ref => ({
                    ...ref,
                    zScoreTotal: zScoreTable[ref.idx].reduce((acc, val) => acc + val, 0)
                }))
                .sort((a, b) => b.zScoreTotal - a.zScoreTotal);
        default:
            return refCols;
    }
}

function QualityScanChart(props) {
    const data = useContext(DataContext);
    const colorContext = useContext(ColorContext);
    const paramContext = useContext(ParamContext);

    const chartRevision = useRef(0);

    // Set up heatmap axes
    const x = data.map(f => f.get("feature")).toJS();
    const y = [...Array(data.get(0).get("data").size).keys()].reverse();

    const fileInfo = useFileInfo();

    // Build base column and row data
    const baseCols = useMemo(_ => data.map(f => f.get("data").toJS()).toJS(), [data]);
    const rows = useMemo(_ => utils.unzip(baseCols), [data]);

    const [repeatParams, setRepeatParams] = paramContext.repeat;

    // Creates a per-column lookup table for repeats. Keys are the data values, values are
    // the number of times they are repeated.
    const countHashes = useMemo(
        _ => {
            return baseCols.reduce((acc, col, idx) => {
                const seen = {};
                col.forEach(val => {
                    seen[val] = seen[val] ? seen[val] + 1 : 1;
                });
                acc.push(seen);
                return acc;
            }, []);
        },
        [data]
    );

    // Calculates the greatest number of times a single number is repeated in a column
    const maxRepeatsPerColumn = useMemo(
        _ => countHashes.map(hash => Math.max(...Object.values(hash).filter(val => val > 1))),
        [countHashes]
    );

    const zScoreTable = useMemo(
        _ => {
            const flatAry = baseCols.reduce((acc, col) => acc.concat(col), []);
            const total = flatAry.reduce((acc, val) => acc + val, 0);
            const mean = total / flatAry.length;
            const stdDev = flatAry.reduce((acc, val) => acc + (val - mean) ** 2) / total;
            return baseCols.map(col => col.map(val => val - mean / stdDev));
        },
        [data]
    );

    // Calculate and store the repeat threshold values available.
    useEffect(
        _ => {
            const { steps, min, max } = countHashes.reduce(
                (acc, row) => {
                    Object.values(row).forEach(value => {
                        if (value === 1) return;
                        acc.steps[value] = acc.steps[value] ? acc.steps[value] + 1 : 1;
                        acc.min = acc.min && acc.min < value ? acc.min : value;
                        acc.max = acc.max && acc.max > value ? acc.max : value;
                    });
                    return acc;
                },
                { steps: {}, min: null, max: null }
            );

            setRepeatParams(params => ({
                ...params,
                thresholdSteps: steps,
                threshold: min,
                min,
                max,
                numberOfThresholds: Object.keys(steps).length
            }));
        },
        [data]
    );

    function makeTraces(cols) {
        const nanMap =
            fileInfo.nan === null
                ? cols
                : utils.unzip(
                      cols.map(({ col }) => col.map(val => (val === fileInfo.nan ? 1 : 0)))
                  );
        const infMap =
            fileInfo.inf === null
                ? cols
                : utils.unzip(
                      cols.map(({ col }) => col.map(val => (val === fileInfo.inf ? 1 : 0)))
                  );
        const repeatMap = utils.unzip(
            cols.map(({ col, idx }) => {
                const refRow = countHashes[idx];
                return col.map(val => (refRow[val] >= repeatParams.threshold ? 1 : 0));
            })
        );

        return [
            {
                x,
                y,
                z: repeatMap,
                type: "heatmap",
                showscale: false,
                colorscale: [[0, "rgba(0,0,0,0)"], [1, buildColor(colorContext.repeat)]]
            },
            {
                x,
                y,
                z: infMap,
                type: "heatmap",
                showscale: false,
                colorscale: [[0, "rgba(0,0,0,0)"], [1, buildColor(colorContext.inf)]]
            },
            {
                x,
                y,
                z: nanMap,
                type: "heatmap",
                showscale: false,
                colorscale: [[0, "rgba(0,0,0,0)"], [1, buildColor(colorContext.nan)]]
            }
        ];
    }
    const traces = useMemo(_ => makeTraces(baseCols.map((col, idx) => ({ col, idx }))), [data]);

    const annotations = [];
    // const annotations = useMemo(
    //  _ => {
    //      const buffer = [];
    //      for (let yIdx = 0; yIdx < y.length; yIdx++) {
    //          for (let xIdx = 0; xIdx < x.length; xIdx++) {
    //              const result = {
    //                  xref: "x1",
    //                  yref: "y1",
    //                  x: x[xIdx],
    //                  y: y[yIdx],
    //                  text: rows[yIdx][xIdx],
    //                  showarrow: false
    //              };

    //              buffer.push(result);
    //          }
    //      }
    //      return buffer;
    //  },
    //  [data]
    // );

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState(_ => {
        return {
            data: traces,
            layout: {
                // width: (x.length / y.length) * 5000,
                // height: 500,
                plot_bgcolor: "black",
                dragmode: "lasso",
                datarevision: chartRevision.current,
                autosize: true,
                margin: { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
                hovermode: false, // Turning off hovermode seems to screw up click handling
                titlefont: { size: 5 },
                // annotations,
                xaxis: {
                    // domain: [0, x.length]
                    showgrid: false,
                    zeroline: false
                    // domain: [0, 100]
                },
                yaxis: {
                    showgrid: false,
                    zeroline: false
                    // scaleanchor: "x",
                    // scaleratio: 1.5
                    // domain: [0, y.length]
                }
            },
            config: {
                displaylogo: false,
                displayModeBar: true
            }
        };
    });

    function updateChart(newChartState) {
        chartRevision.current++;
        setChartState({
            ...newChartState,
            layout: { ...chartState.layout, datarevision: chartRevision.current }
        });
    }

    useEffect(
        _ => {
            const newChartState = { ...chartState };
            newChartState.data[2].colorscale[1][1] = buildColor(colorContext.nan);
            newChartState.data[1].colorscale[1][1] = buildColor(colorContext.inf);
            newChartState.data[0].colorscale[1][1] = buildColor(colorContext.repeat);
            updateChart(newChartState);
        },
        [colorContext]
    );

    const [colSortValue] = paramContext.sortOptions.col;
    useEffect(
        _ => {
            const cols = sortCols(
                baseCols,
                colSortValue,
                fileInfo,
                maxRepeatsPerColumn,
                zScoreTable
            );
            const newChartState = { ...chartState };
            newChartState.data = makeTraces(cols);
            updateChart(newChartState);
        },
        [baseCols, colSortValue]
    );

    return (
        <div className="qs-plot">
            <Plot
                data={chartState.data}
                layout={chartState.layout}
                config={chartState.config}
                style={{ width: "70%", height: "100%" }}
                useResizeHandler
                onInitialized={figure => setChartState(figure)}
                onUpdate={figure => setChartState(figure)}
            />
        </div>
    );
}

function QualityScan(props) {
    const fileInfo = useFileInfo();
    const colorContext = {
        nan: useState({
            color: utils.getRGBFromHex(theme.yellow),
            opacity: fileInfo.nan !== null ? 1 : 0,
            active: true
        }),
        inf: useState({
            color: utils.getRGBFromHex(theme.green),
            opacity: fileInfo.inf !== null ? 1 : 0,
            active: true
        }),
        repeat: useState({
            color: utils.getRGBFromHex(theme.magenta),
            opacity: 1,
            active: true
        })
    };
    const paramContext = {
        repeat: useState({
            threshold: 1,
            thresholdSteps: [],
            min: null,
            max: null,
            numberOfThresholds: 0,
            sliderPosition: 0
        }),
        sortOptions: {
            row: useState(SORT_ORIGINAL.val),
            col: useState(SORT_ORIGINAL.val)
        }
    };

    return (
        <div className="qs-container">
            <ColorContext.Provider value={colorContext}>
                <ParamContext.Provider value={paramContext}>
                    <QualityScanChart />
                    <QualityScanControls />
                </ParamContext.Provider>
            </ColorContext.Provider>
        </div>
    );
}

export default props => {
    const win = useWindowManager(props, {
        title: "Quality Scan"
    });

    const data = useFeatures(useFeatureNames());

    if (data === null) {
        return <WindowCircularProgress />;
    }

    return (
        <WindowContext.Provider value={win}>
            <DataContext.Provider value={data}>
                <QualityScan />
            </DataContext.Provider>
        </WindowContext.Provider>
    );
};
