import React, { useState, useEffect, useContext, useRef, useMemo } from "react";
import { useQualityScanActive } from "hooks/UIHooks";
import Plot from "react-plotly.js";
import { useFeatureNames, useFeatures, usePinnedFeatures } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import * as utils from "utils/utils";
import Slider from "@material-ui/lab/Slider";
import Typography from "@material-ui/core/Typography";
import "components/QualityScan/QualityScan.scss";
import theme from "styles/theme.scss";
import classnames from "classnames";
import InputLabel from "@material-ui/core/InputLabel";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";
import CloseIcon from "@material-ui/icons/Close";
import { useSelector, useStore, useDispatch } from "react-redux";
import IconButton from "@material-ui/core/IconButton";
import * as windowManagerActions from "actions/windowManagerActions";

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

function toggleFilter(changeFunc) {
    return _ => changeFunc(colorObj => ({ ...colorObj, active: !colorObj.active }));
}

function Sliders(props) {
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
        active: nanColor.active
    });
    const infSwatchStyles = classnames({
        "color-swatch": true,
        inf: true,
        active: infColor.active
    });
    const repeatSwatchStyles = classnames({
        "color-swatch": true,
        repeat: true,
        active: repeatColor.active
    });

    return (
        <React.Fragment>
            <div className="slider">
                <div className="title">
                    <div className={nanSwatchStyles} onClick={toggleFilter(setNanColor)} />
                    <Typography variant="caption" classes={{ root: "title-text" }}>
                        NaN Opacity
                    </Typography>
                </div>
                <Slider
                    classes={{ root: "slider-control" }}
                    value={nanColor.opacity * 100}
                    onChange={handleSliderChange(setNanColor)}
                />
            </div>
            <div className="slider">
                <div className="title">
                    <div className={infSwatchStyles} onClick={toggleFilter(setInfColor)} />
                    <Typography variant="caption" classes={{ root: "title-text" }}>
                        Infinity Opacity
                    </Typography>
                </div>
                <Slider
                    classes={{ root: "slider-control" }}
                    value={infColor.opacity * 100}
                    onChange={handleSliderChange(setInfColor)}
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
    return (
        <div className="dropdown">
            <label>Column sorting</label>
            <select>
                <option value={0}>Order by Original</option>
            </select>
        </div>
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

function QualityScanChart(props) {
    const data = useContext(DataContext);
    const colorContext = useContext(ColorContext);
    const paramContext = useContext(ParamContext);

    const x = data.map(f => f.get("feature")).toJS();
    const y = [...Array(data.get(0).get("data").size).keys()].reverse();
    const cols = useMemo(_ => data.map(f => f.get("data").toJS()).toJS(), [data]);
    const rows = useMemo(_ => utils.unzip(cols), [data]);

    const [repeatParams, setRepeatParams] = paramContext.repeat;

    const nanValue = 1;
    const infValue = 0;

    // Creates a per-column lookup table for repeats. Keys are the data values, values are
    // the number of times they are repeated.
    const countHashes = useMemo(
        _ => {
            return cols.reduce((acc, col, idx) => {
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

    const nanMap = useMemo(_ => rows.map(row => row.map(val => (val === nanValue ? 1 : 0))), [
        data
    ]);
    const infMap = useMemo(_ => rows.map(row => row.map(val => (val === infValue ? 1 : 0))), [
        data
    ]);
    const repeatMap = useMemo(
        _ =>
            cols.map((col, idx) => {
                const refRow = countHashes[idx];
                return col.map(val => (refRow[val] >= repeatParams.threshold ? 1 : 0));
            }),
        [repeatParams]
    );

    const chartRevision = useRef(0);

    const annotations = [];
    // const annotations = useMemo(
    // 	_ => {
    // 		const buffer = [];
    // 		for (let yIdx = 0; yIdx < y.length; yIdx++) {
    // 			for (let xIdx = 0; xIdx < x.length; xIdx++) {
    // 				const result = {
    // 					xref: "x1",
    // 					yref: "y1",
    // 					x: x[xIdx],
    // 					y: y[yIdx],
    // 					text: rows[yIdx][xIdx],
    // 					showarrow: false
    // 				};

    // 				buffer.push(result);
    // 			}
    // 		}
    // 		return buffer;
    // 	},
    // 	[data]
    // );

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState(_ => {
        return {
            data: [
                {
                    x,
                    y,
                    z: nanMap,
                    type: "heatmap",
                    showscale: false,
                    colorscale: [[0, "rgba(0,0,0,0)"], [1, buildColor(colorContext.nan)]]
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
                    z: repeatMap,
                    type: "heatmap",
                    showscale: false,
                    colorscale: [[0, "rgba(0,0,0,0)"], [1, buildColor(colorContext.repeat)]]
                }
            ],
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

    function updateChartRevision() {
        chartRevision.current++;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: chartRevision.current }
        });
    }

    useEffect(
        _ => {
            const newChartState = { ...chartState };
            newChartState.data[0].colorscale[1][1] = buildColor(colorContext.nan);
            newChartState.data[1].colorscale[1][1] = buildColor(colorContext.inf);
            newChartState.data[2].colorscale[1][1] = buildColor(colorContext.repeat);
            setChartState(newChartState);
            updateChartRevision();
        },
        [colorContext]
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
    const colorContext = {
        nan: useState({
            color: utils.getRGBFromHex(theme.yellow),
            opacity: 1,
            active: true
        }),
        inf: useState({
            color: utils.getRGBFromHex(theme.green),
            opacity: 1,
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
        })
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
