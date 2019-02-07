import React, { Component } from "react";
import "Components/GenericGraph/GenericGraph.css";

import ReactEcharts from "echarts-for-react";
import echartsgl from "echarts-gl"; //This is necessary

import { ContextMenu, MenuItem, SubMenu, ContextMenuTrigger } from "react-contextmenu";

import Drawer from "Components/Drawer/Drawer";
import { formulas } from "formulas/formulas";

import PropTypes from "prop-types";
import IPropTypes from "react-immutable-proptypes";
import { List } from "immutable";
// redux!
import { connect } from "react-redux";
import { getSelectedFeatures, getFeaturesMasked, getActiveSelectionNames } from "selectors/data";
import { getGraphs, getGraphByType } from "selectors/ui";
import { selectionCreate, brushUpdateArea, brushClear } from "actions/data";

class GenericGraph extends Component {
    constructor(props) {
        super(props);

        this.updateFlag = false;
        this.lastDimensions = {
            width: 0,
            height: 0
        };

        this.brushedData = [];

        this.selectedFeatures = getSelectedFeatures(this.props.data).toJS();
        this.activeSelectionNames = getActiveSelectionNames(this.props.data).toJS();

        this.vars = {
            type: this.props.vars.type || "",
            graphId: this.props.vars.graphId,
            groupId: this.props.vars.groupId,
            windowId: this.props.vars.windowId,
            subsets: this.props.vars.subsets || this.activeSelectionNames,
            xaxis: this.props.vars.xaxis || this.selectedFeatures[0],
            yaxis: this.props.vars.yaxis || this.selectedFeatures[1],
            dataObjData: [],
            index: 0
        };

        this.graph =
            getGraphByType(this.props.ui, this.vars.type).get("component") ||
            getGraphs(this.props.ui).getIn([0, "component"]);
        this.graph = new this.graph();

        // this binds
        this.handleContextMenuClick = this.handleContextMenuClick.bind(this);
    }

    setData(dataState) {
        dataState = dataState || this.props.data;
        let dataObj = {};
        const option = this.graph.getOption();
        let index = 0;
        option.series = [];

        this.echarts_instance.clear();

        if (this.vars.type !== "scatter")
            option.series.push(Object.assign(this.graph.getSeriesKey()));

        dataObj.data = getFeaturesMasked(
            dataState,
            this.vars.xaxis,
            this.vars.yaxis,
            "master"
        ).toJS();

        this.vars.dataObjData = dataObj.data;

        switch (this.vars.type) {
            case "scatter":
                //this.stylings = getFinalSelectionArray( dataState ).toJS();
                //console.log( this.stylings );
                //option.legend.data.push(this.vars.xaxis + ' vs ' + this.vars.yaxis);

                //Name the graph
                option.xAxis[index].name = this.vars.xaxis;
                option.yAxis[index].name = this.vars.yaxis;

                //Make Master
                if (dataObj.data) {
                    if (!option.series[index]) {
                        option.series.push(this.graph.getSeriesKey());
                    }
                    option.series[index].name = this.vars.xaxis + " vs " + this.vars.yaxis;
                    option.series[index].data = this.graph.transformData(dataObj.data, index);
                    option.series[index].itemStyle = {
                        normal: {
                            color: "#3386E6"
                        }
                    };
                }

                //Make Selections
                if (this.vars.subsets.length > 0) {
                    //Layer for each subset
                    for (let s = 0; s < this.vars.subsets.length; s++) {
                        index++;
                        let d = getFeaturesMasked(
                            dataState,
                            this.vars.xaxis,
                            this.vars.yaxis,
                            "selections",
                            this.vars.subsets[s].name
                        ).toJS();
                        if (!option.series[index]) {
                            option.series.push(this.graph.getSeriesKey());
                        }
                        option.series[index].name = this.vars.subsets[s].name;
                        option.series[index].data = this.graph.transformData(d, index);
                        option.series[index].itemStyle = {
                            normal: {
                                opacity: 1,
                                color: this.vars.subsets[s].color
                            }
                        };
                        if (this.vars.subsets[s].emphasize) option.series[index].symbolSize = 5;
                    }
                }

                //Make Brush
                let d = getFeaturesMasked(
                    dataState,
                    this.vars.xaxis,
                    this.vars.yaxis,
                    "brush"
                ).toJS();

                if (d) {
                    index++;
                    if (!option.series[index]) {
                        option.series.push(this.graph.getSeriesKey());
                    }
                    option.series[index].name = "Brush";
                    option.series[index].data = this.graph.transformData(d, index);
                    option.series[index].itemStyle = {
                        normal: {
                            color: "#ff4500"
                        }
                    };
                }
                break;
            case "histogram":
            case "bar":
                if (this.vars.xaxis) option.legend.data.push(this.vars.xaxis);
                if (this.vars.yaxis) option.legend.data.push(this.vars.yaxis);
                index = option.series.push(Object.assign(this.graph.getSeriesKey())) - 1;
                option.series[index].data = this.graph.transformData(dataObj.data, index);
                option.series[0].name = this.vars.xaxis;
                option.series[1].name = this.vars.yaxis;
                option.title.text =
                    this.vars.xaxis.substr(0, 20) + " vs " + this.vars.yaxis.substr(0, 20);
                break;
            case "parallel":
                //dataObj.data = model.getSubColumns( [this.vars.xaxis, this.vars.yaxis], '' );
                option.series[index].name = this.vars.xaxis + " + " + this.vars.yaxis;
                option.legend.data.push(option.series[index].name);
                option.series[index].data = this.graph.transformData(dataObj.data, index);
                option.parallelAxis[0].name = this.vars.xaxis;
                option.parallelAxis[1].name = this.vars.yaxis;
                option.title.text =
                    this.vars.xaxis.substr(0, 20) + " vs " + this.vars.yaxis.substr(0, 20);
                break;
            case "pie":
                option.series[index].name = this.vars.xaxis;
                option.title.text =
                    this.vars.xaxis.substr(0, 20) + " vs " + this.vars.yaxis.substr(0, 20);
                index = option.series.push(Object.assign(this.graph.getSeriesKey())) - 1;
                option.series[index].name = this.vars.yaxis;
                option.series[index].data = this.graph.transformData(dataObj.data, index);
                option.series[index].radius = ["40%", "55%"];
                option.series[index].label = {
                    normal: {
                        formatter: "{per|{d}%}",
                        backgroundColor: "#eee",
                        borderColor: "#aaa",
                        borderWidth: 1,
                        borderRadius: 4,

                        rich: {
                            a: {
                                color: "#999",
                                lineHeight: 22,
                                align: "center"
                            },
                            hr: {
                                borderColor: "#aaa",
                                width: "100%",
                                borderWidth: 0.5,
                                height: 0
                            },
                            b: {
                                fontSize: 16,
                                lineHeight: 33
                            },
                            per: {
                                color: "#eee",
                                backgroundColor: "#334455",
                                padding: [2, 4],
                                borderRadius: 2
                            }
                        }
                    }
                };
                option.series[index].labelLine = {};
                break;
            case "polarbar":
                option.legend.data.push(this.vars.xaxis);
                option.legend.data.push(this.vars.yaxis);
                index = option.series.push(Object.assign(this.graph.getSeriesKey())) - 1;
                option.series[index].data = this.graph.transformData(dataObj.data, index);
                option.series[0].name = this.vars.xaxis;
                option.series[1].name = this.vars.yaxis;
                option.title.text =
                    this.vars.xaxis.substr(0, 20) + " vs " + this.vars.yaxis.substr(0, 20);
                break;
            case "polarscatter":
                option.legend.data.push(this.vars.xaxis + " vs " + this.vars.yaxis);
                option.series[index].name = this.vars.xaxis + " vs " + this.vars.yaxis;
                option.title.text =
                    this.vars.xaxis.substr(0, 20) + " vs " + this.vars.yaxis.substr(0, 20);
                break;
            case "polarheatmap":
                option.legend.data.push(this.vars.xaxis + " + " + this.vars.yaxis);
                option.series[index].name = this.vars.xaxis + " + " + this.vars.yaxis;
                option.series[index].data = this.graph.transformData(dataObj.data, index);
                option.title.text =
                    this.vars.xaxis.substr(0, 20) + " vs " + this.vars.yaxis.substr(0, 20);
                break;
            case "boxplot":
                option.xAxis[index].name = this.vars.xaxis;
                option.yAxis[index].name = this.vars.yaxis;
                option.legend.data[index] = this.vars.xaxis + " vs " + this.vars.yaxis;
                option.series[index].name = this.vars.xaxis + " vs " + this.vars.yaxis;
                option.series[index].data = this.graph.transformData(dataObj.data, index);
                option.title.text =
                    this.vars.xaxis.substr(0, 20) + " vs " + this.vars.yaxis.substr(0, 20);
                break;
            case "heatmap":
                option.xAxis[index].name = this.vars.xaxis;
                option.yAxis[index].name = this.vars.yaxis;
                option.legend.data[index] = this.vars.xaxis + " vs " + this.vars.yaxis;
                option.series[index].name = this.vars.xaxis + " vs " + this.vars.yaxis;
                option.series[index].data = this.graph.transformData(dataObj.data, index);
                option.title.text =
                    this.vars.xaxis.substr(0, 20) + " vs " + this.vars.yaxis.substr(0, 20);
                break;
            default:
                break;
        }
        this.vars.index = index;
        this.echarts_instance.setOption(this.graph.getOption());
    }

    onBrushDrawn(d) {
        if (this.vars.type === "scatter") {
            switch (d.mode) {
                case "rectangle":
                    let convertedRange = [];
                    convertedRange[0] = this.echarts_instance.convertFromPixel({ seriesIndex: 0 }, [
                        d.range.x[0],
                        d.range.y[0]
                    ]);
                    convertedRange[1] = this.echarts_instance.convertFromPixel({ seriesIndex: 0 }, [
                        d.range.x[1],
                        d.range.y[1]
                    ]);
                    let newRange = {
                        x: [convertedRange[0][0], convertedRange[1][0]].sort(formulas.asc),
                        y: [convertedRange[0][1], convertedRange[1][1]].sort(formulas.asc)
                    };

                    this.props.brushUpdateArea(d.mode, newRange, this.vars.xaxis, this.vars.yaxis);
                    break;
                case "freehand":
                    let convertedPoints = [];
                    for (let p in d.polyPoints) {
                        let cfp = this.echarts_instance.convertFromPixel(
                            { seriesIndex: 0 },
                            d.polyPoints[p]
                        );
                        convertedPoints.push({ x: cfp[0], y: cfp[1] });
                    }
                    this.props.brushUpdateArea(
                        d.mode,
                        convertedPoints,
                        this.vars.xaxis,
                        this.vars.yaxis
                    );
                    break;
                default:
                    break;
            }
        }
    }

    updateBrush(brushedRows) {
        this.setData({ data: 0, brushed: true });
    }

    setDrawer(to) {
        if (this.ref_drawer) this.ref_drawer.setDrawer(to);
    }

    componentDidMount() {
        this.echarts_instance = this.echarts_react.getEchartsInstance();
        window.addEventListener("resize", () => this.resize());

        //controller.addGenericGraph( this.vars.graphId, this );

        this.setData();
        //controller.refreshTopBarMode();
    }
    componentDidUpdate() {
        this.setData();
    }
    componentWillUnmount() {
        //controller.removeGenericGraph( this.vars.graphId );
    }

    componentResize() {
        if (this.genericGraph) {
            if (
                this.genericGraph.offsetWidth !== this.lastDimensions.width ||
                this.genericGraph.offsetHeight !== this.lastDimensions.height
            ) {
                this.resize();
                this.lastDimensions.width = this.genericGraph.offsetWidth;
                this.lastDimensions.height = this.genericGraph.offsetHeight;
            }
        }
    }
    resize() {
        if (!this.echarts_instance.isDisposed()) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.echarts_instance.resize();
            }, 100);
        }
    }

    _makeInvertAxesMenuItems() {
        let menuItems = [];
        let notInclude = ["parallel", "pie", "polarbar", "polarheatmap", "polarscatter"];
        let boo = true;
        if (notInclude.indexOf(this.vars.type) === -1) boo = false;
        menuItems.push(
            <MenuItem
                disabled={boo}
                key={0}
                data={{ action: "invertaxes", invert: "x" }}
                onClick={(e, data) => this.handleContextMenuClick(e, data)}
            >
                {"Invert X-Axis"}
            </MenuItem>
        );
        menuItems.push(
            <MenuItem
                disabled={boo}
                key={1}
                data={{ action: "invertaxes", invert: "y" }}
                onClick={(e, data) => this.handleContextMenuClick(e, data)}
            >
                {"Invert Y-Axis"}
            </MenuItem>
        );
        return menuItems;
    }
    _makeChangeGraphMenuItems() {
        let menuItems = [];
        let graphs = getGraphs(this.props.ui);
        for (let i in graphs) {
            let isCurrent = graphs.getIn([i, "type"]) === this.vars.type;
            menuItems.push(
                <MenuItem
                    key={i}
                    disabled={isCurrent}
                    data={{ action: "changegraph", to: graphs.getIn([i, "type"]) }}
                    onClick={(e, data) => this.handleContextMenuClick(e, data)}
                >
                    {graphs.getIn([i, "name"])}
                </MenuItem>
            );
        }
        return menuItems;
    }

    invertAxis(axis) {
        let graphOptions = this.graph.getOption();
        graphOptions = this.graph.transformData(this.vars.dataObjData, 0, true, axis);
        this.echarts_instance.setOption(graphOptions);
    }

    handleContextMenuClick(e, data) {
        console.log("here");
        switch (data.action) {
            case "changegraph":
                this.props.changeGraph(data.to);
                //controller.setDrawers( 'clearshapedraw' );
                break;
            case "brushtoselection":
                //controller.setDrawers( 'clearshapedraw' );
                this.props.selectionCreate("New_Selection", "brush", true, undefined, {
                    creationId: "brush",
                    createdBy: "Brush"
                });
                this.props.brushClear();
                break;
            case "invertaxes":
                this.invertAxis(data.invert);
                break;
            default:
                console.warn("Unknown context menu action.");
        }
    }

    //hackiness to
    correctContextMenuPosition() {
        setTimeout(() => {
            if (
                this.genericGraph &&
                this.genericGraph.parentElement &&
                this.genericGraph.parentElement.parentElement &&
                this.genericGraph.parentElement.parentElement.parentElement
            ) {
                let coords = this.genericGraph.parentElement.parentElement.parentElement.getBoundingClientRect();
                let top = -coords.y + "px";
                let left = -coords.x + "px";

                this.wrapper.children[0].style.display = "inherit";
                this.wrapper.style.top = top;
                this.wrapper.style.left = left;
            }
        }, 50);
    }
    hideContextMenu() {
        if (this.wrapper) this.wrapper.children[0].style.display = "none";
    }

    componentWillReceiveProps(nextProps) {}
    shouldComponentUpdate(nextProps) {
        this.activeSelectionNames = getActiveSelectionNames(nextProps.data).toJS();
        this.vars.subsets = this.activeSelectionNames;

        this.setData(nextProps.data);
        return false;
    }

    render() {
        return (
            <div
                className="GenericGraph"
                ref={e => {
                    this.genericGraph = e;
                }}
            >
                <ContextMenuTrigger
                    id={"GenericGraphContextMenu_" + this.vars.graphId}
                    holdToDisplay={-1}
                >
                    <ReactEcharts
                        ref={e => {
                            this.echarts_react = e;
                        }}
                        option={this.graph.getOption()}
                        style={{ height: "100%", width: "100%" }}
                    />
                    <Drawer
                        ref={r => {
                            this.ref_drawer = r;
                        }}
                        windowId={this.vars.windowId}
                        onDrawingEnd={d => {
                            this.onBrushDrawn(d);
                        }}
                    />
                </ContextMenuTrigger>

                <div className="GenericGraphXAxisLabel">{this.vars.xaxis}</div>
                <div className="GenericGraphYAxisLabel">{this.vars.yaxis}</div>

                <div
                    className="GenericGraphWrapper"
                    ref={e => {
                        this.wrapper = e;
                    }}
                >
                    <ContextMenu
                        id={"GenericGraphContextMenu_" + this.vars.graphId}
                        className={"GenericGraphContextMenu"}
                        onShow={() => this.correctContextMenuPosition()}
                        onHide={() => this.hideContextMenu()}
                    >
                        <MenuItem
                            data={{ action: "brushtoselection" }}
                            onClick={this.handleContextMenuClick}
                        >
                            Save Selection
                        </MenuItem>
                        <MenuItem data={{ action: "copy" }} onClick={this.handleContextMenuClick}>
                            Copy
                        </MenuItem>
                        <MenuItem data={{ action: "paste" }} onClick={this.handleContextMenuClick}>
                            Paste
                        </MenuItem>
                        <MenuItem data={{ action: "cut" }} onClick={this.handleContextMenuClick}>
                            Cut
                        </MenuItem>
                        <SubMenu title="Change Graph" hoverDelay={100}>
                            {this._makeChangeGraphMenuItems()}
                        </SubMenu>
                        <SubMenu title="Format Graph" hoverDelay={100}>
                            <MenuItem
                                data={{ action: "format_reset" }}
                                onClick={this.handleContextMenuClick}
                            >
                                Reset
                            </MenuItem>
                            <MenuItem
                                data={{ action: "format_invertcolors" }}
                                onClick={this.handleContextMenuClick}
                            >
                                Invert Colors
                            </MenuItem>
                        </SubMenu>
                        <SubMenu title="Invert Axes" hoverDelay={100}>
                            {this._makeInvertAxesMenuItems()}
                        </SubMenu>
                    </ContextMenu>
                </div>
            </div>
        );
    }
}

// validation
GenericGraph.propTypes = {
    // reference to current data
    data: IPropTypes.map.isRequired,
    selectionCreate: PropTypes.func.isRequired,
    brushUpdateArea: PropTypes.func.isRequired,
    brushClear: PropTypes.func.isRequired
};

// redux store
const mapStateToProps = state => {
    return {
        data: state.get("data"),
        ui: state.get("ui")
    };
};
const mapDispatchToProps = dispatch => ({
    selectionCreate: (name, mask, visible, color, meta) =>
        dispatch(selectionCreate(name, mask, visible, color, meta)),
    brushUpdateArea: (mode, area, xAxisFeature, yAxisFeature) =>
        dispatch(brushUpdateArea(mode, area, xAxisFeature, yAxisFeature)),
    brushClear: () => dispatch(brushClear())
});

export { GenericGraph };
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GenericGraph);
