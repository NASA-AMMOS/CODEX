import React, { Component } from "react";
import "components/Cluster/Parameters/Parameters.css";

import { Collapse } from "react-collapse";
import { MdMoreVert } from "react-icons/lib/md";

import { formulas } from "formulas/formulas";
import simplescatter from "components/Cluster/simplescatter";
import HoverableFS from "components/HoverableFS/HoverableFS";

import ReactEcharts from "echarts-for-react";
import classnames from "classnames";

import Toggle from "react-toggle";
import "react-toggle/style.css";
import Dropdown, { MenuItem } from "@trendmicro/react-dropdown";

import PropTypes from "prop-types";
import IPropTypes from "react-immutable-proptypes";
import { List } from "immutable";
// redux!
import { connect } from "react-redux";
import { getFeatures } from "selectors/data";
import { getSubAlgorithmByName } from "selectors/ui";

class Parameters extends Component {
    constructor(props) {
        super(props);

        let p = getSubAlgorithmByName(this.props.ui, "Cluster", this.props.algorithm);
        p = p.get("parameters") ? p.get("parameters").toJS() : [];

        this.t = {
            parameters: p
        };

        let parameterValues = [];
        let defaultParameters = {};
        for (let p in this.t.parameters) {
            parameterValues.push(this.t.parameters[p].value);
            defaultParameters[this.t.parameters[p].name] = this.t.parameters[p].value;
        }

        this.state = {
            openParameterI: -1,
            parameterValues: parameterValues
        };

        let parameterGraphs = [];
        let echarts_reacts = [];
        let samples = [];
        for (let p = 0; p < this.t.parameters.length; p++) {
            parameterGraphs.push({});
            echarts_reacts.push({});
            samples.push({});
        }

        this.vars = {
            parameterType: this.props.initialStage || "algo", //'output'
            parameterGraphs: parameterGraphs,
            outputParamters: {
                name: "Cluster",
                withFeature: false,
                withSelections: true,
                withPCA: true,
                graph: {
                    with: false,
                    X: null,
                    Y: null,
                    withClusters: true
                }
            }
        };

        this.echarts_react = echarts_reacts;
        this.samples = samples;

        this.ref_parameterlists = [];
        this.ref_mores = [];
        this.ref_inputs = [];
        this.ref_dropdown = {};

        //Set Default
        this.props.updateCall({}, defaultParameters, true);
    }

    reaction(r) {
        if (this.state.openParameterI !== -1) {
            if (this.samples[r.identification.vars.i][r.identification.vars.j]) {
                this.samples[r.identification.vars.i][r.identification.vars.j].style.opacity = 1;
                this.echarts_react[r.identification.vars.i][r.identification.vars.j]
                    .getEchartsInstance()
                    .clear();
                let g = this.vars.parameterGraphs[r.identification.vars.i][r.identification.vars.j];
                g.option.series = [];

                let numGroups;
                if (r.hasOwnProperty("numClusters")) numGroups = r.numClusters;
                else numGroups = formulas.findMaxValueInArray(r.clusters) + 1;

                let tempDataArray = [];
                for (let i = -1; i < numGroups; i++) {
                    for (let d in r.data) {
                        if (i === r.clusters[d]) tempDataArray.push(r.data[d]);
                    }
                    g.option.series.push(Object.assign(g.getSeriesKey()));
                    g.option.series[g.option.series.length - 1].data = tempDataArray;

                    if (i === -1) {
                        g.option.series[g.option.series.length - 1].itemStyle = {
                            normal: {
                                opacity: 1,
                                color: "#eee",
                                borderWidth: 0.5,
                                borderColor: "#aaa"
                            }
                        };
                    }

                    tempDataArray = [];
                }

                this.echarts_react[r.identification.vars.i][r.identification.vars.j]
                    .getEchartsInstance()
                    .hideLoading();
                try {
                    this.echarts_react[r.identification.vars.i][r.identification.vars.j]
                        .getEchartsInstance()
                        .setOption(g.getOption());
                } catch (e) {}
            }
        }
    }

    chosenUpdate() {
        if (this.state.setOpenParameterI !== -1) this.setOpenParameterI("refresh");
    }

    setParameterItoValue(i, value) {
        var parameterValues = this.state.parameterValues.slice();
        parameterValues[i] = parseFloat(value);
        var updateCallParamaters = {};
        updateCallParamaters[this.t.parameters[i].name] = parseFloat(value);
        this.props.updateCall({}, updateCallParamaters, true);

        let setMoresClasses = (i, activeValue) => {
            for (let m in this.ref_mores[i]) {
                if (m == activeValue.toString())
                    //eslint-disable-line eqeqeq
                    this.ref_mores[i][m].className = "mores active";
                else this.ref_mores[i][m].className = "mores";
            }
        };

        setMoresClasses(i, value);

        if (this.ref_inputs[i]) this.ref_inputs[i].value = parseFloat(value);
    }

    _makeMoresForParameter(index) {
        let mores = [];
        var p = this.t.parameters[index];
        for (let i = p.min; i <= p.max; i += p.step) {
            i = +parseFloat(i).toFixed(2);
            if (!this.vars.parameterGraphs[index][i])
                this.vars.parameterGraphs[index][i] = new simplescatter();
            let classes = classnames("mores", { active: this.state.parameterValues[index] === i });

            if (!this.ref_mores[index]) this.ref_mores[index] = {};

            mores.push(
                <div
                    key={i}
                    className={classes}
                    ref={r => {
                        this.ref_mores[index][i] = r;
                    }}
                    onClick={() => {
                        this.setParameterItoValue(index, i);
                    }}
                >
                    <div id="name">{i}</div>
                    <div
                        id="sample"
                        ref={e => {
                            this.samples[index][i] = e;
                        }}
                    >
                        <ReactEcharts
                            ref={e => {
                                this.echarts_react[index][i] = e;
                            }}
                            showLoading={true}
                            option={this.vars.parameterGraphs[index][i].getOption()}
                            style={{ height: "100%", width: "100%" }}
                        />
                    </div>
                </div>
            );
        }
        return mores;
    }

    _makeParameters() {
        let parameterLi = [];
        for (let i in this.t.parameters) {
            parameterLi.push(
                <div key={i} className="parameter">
                    <div>
                        <li>
                            <div id="title">{this.t.parameters[i].title}</div>
                            <div id="paramtoolbar">
                                <input
                                    type={this.t.parameters[i].inputType}
                                    ref={r => {
                                        this.ref_inputs[i] = r;
                                    }}
                                    defaultValue={this.state.parameterValues[i]}
                                    min={this.t.parameters[i].min}
                                    max={this.t.parameters[i].max}
                                    step={this.t.parameters[i].step}
                                    onChange={e => {
                                        this.setParameterItoValue(i, e.target.value);
                                    }}
                                />
                                <div
                                    id="more"
                                    onClick={() => {
                                        this.setOpenParameterI(i);
                                    }}
                                >
                                    <MdMoreVert />
                                </div>
                            </div>
                        </li>
                        <li
                            className="parammore"
                            ref={r => {
                                this.ref_parameterlists[i] = r;
                            }}
                        >
                            <Collapse isOpened={this.state.openParameterI === i}>
                                <div className="parammoreli" onWheel={e => this.wheel(e, i)}>
                                    {this._makeMoresForParameter(i)}
                                </div>
                            </Collapse>
                        </li>
                    </div>
                </div>
            );
        }
        return parameterLi;
    }

    wheel(e, i) {
        this.ref_parameterlists[i].scrollLeft += e.deltaY;
    }

    //i = 'refresh' to refresh graphs
    setOpenParameterI(i) {
        let shouldSetState = false;
        if (this.state.openParameterI === i) i = -1;
        if (i !== -1) {
            if (i === "refresh") i = this.state.openParameterI;
            else shouldSetState = true;
            var p = this.t.parameters[i];
            if (p) {
                for (let j = p.min; j <= p.max; j += p.step) {
                    j = +parseFloat(j).toFixed(2);
                    if (!this.vars.parameterGraphs[i][j])
                        this.vars.parameterGraphs[i][j] = new simplescatter();

                    this.samples[i][j].style.opacity = 0.15;
                    let invokeParameters = {};
                    invokeParameters["downsample"] = 200;
                    invokeParameters[p.name] = j;
                    this.echarts_react[i][j].getEchartsInstance().showLoading();
                    this.props.invoke({}, this.reaction.bind(this), invokeParameters, {
                        i: i,
                        j: j
                    });
                }
            }
        } else shouldSetState = true;
        if (shouldSetState) this.setState({ openParameterI: i });
    }

    toggleParameterType(type) {
        this.vars.parameterType = this.vars.parameterType === "algo" ? "output" : "algo";
        if (type) this.vars.parameterType = type;
        if (this.ref_algoParam && this.ref_outputParam) {
            if (this.vars.parameterType === "algo") {
                this.ref_algoParam.style.display = "flex";
                this.ref_outputParam.style.display = "none";
                this.props.setSteps([0, 1, 2]);
            } else {
                this.ref_algoParam.style.display = "none";
                this.ref_outputParam.style.display = "flex";
                this.props.setSteps([0, 1, 2, 3, 4]);
            }
        }
    }

    toEditParameters(on) {
        if (on) this.toggleParameterType("algo");
        else this.toggleParameterType("output");
    }

    getStage() {
        return this.vars.parameterType;
    }
    back() {
        if (this.vars.parameterType === "output") this.toggleParameterType("algo");
    }
    continue() {
        if (this.vars.parameterType === "algo") {
            this.toggleParameterType("output");
        } else {
            this.props.finalInvoke(this.vars.outputParamters);
        }
    }

    makeFeaturesDropdown(axis) {
        axis = axis || "";
        let that = this;
        function makeNewMenuItems() {
            let items = [];
            items.push(
                <MenuItem header key={"a"}>
                    New
                </MenuItem>
            );
            let op = that.vars.outputParamters;
            items.push(
                <MenuItem
                    key={"aa"}
                    className={"parameterDropdownItem_" + axis + "_PCA1"}
                    onSelect={() => {
                        that.vars.outputParamters.graph[axis] = 0;
                        document.getElementsByClassName(
                            "parameterDropdownToggle" + axis
                        )[0].innerText = op.name + "_PCA1";
                    }}
                >
                    {op.name + "_PCA1"}
                </MenuItem>
            );
            items.push(
                <MenuItem
                    key={"ab"}
                    className={"parameterDropdownItem_" + axis + "_PCA2"}
                    onSelect={() => {
                        that.vars.outputParamters.graph[axis] = 1;
                        document.getElementsByClassName(
                            "parameterDropdownToggle" + axis
                        )[0].innerText = op.name + "_PCA2";
                    }}
                >
                    {op.name + "_PCA2"}
                </MenuItem>
            );
            items.push(
                <MenuItem
                    key={"ac"}
                    className={"parameterDropdownItem_" + axis + ""}
                    onSelect={() => {
                        that.vars.outputParamters.graph[axis] = 2;
                        document.getElementsByClassName(
                            "parameterDropdownToggle" + axis
                        )[0].innerText = op.name + "_ClusterIDs";
                    }}
                >
                    {op.name + "_ClusterIDs"}
                </MenuItem>
            );
            return items;
        }

        function makeExistingMenuItems() {
            let items = [];
            items.push(
                <MenuItem header key={"b"}>
                    Existing
                </MenuItem>
            );
            let featureNames = getFeatures(that.props.data).toJS();
            for (let i = 0; i < featureNames.length; i++) {
                items.push(
                    <MenuItem
                        key={i}
                        onSelect={() => {
                            that.vars.outputParamters.graph[axis] = featureNames[i];
                            document.getElementsByClassName(
                                "parameterDropdownToggle" + axis
                            )[0].innerText = featureNames[i];
                        }}
                    >
                        {featureNames[i]}
                    </MenuItem>
                );
            }
            return items;
        }

        return (
            <Dropdown className="parametersDropdownFeatures" autoOpen={false}>
                <Dropdown.Toggle
                    className={"parameterDropdownToggle" + axis}
                    ref={r => {
                        this.ref_dropdown[axis] = r;
                    }}
                    title={axis + " Feature"}
                />
                <Dropdown.Menu className="parameterDropdownMenu">
                    {makeNewMenuItems()}
                    {makeExistingMenuItems()}
                </Dropdown.Menu>
            </Dropdown>
        );
    }

    nameChange(name) {
        let dX = document.getElementsByClassName("parameterDropdownToggle" + "X")[0];
        let dY = document.getElementsByClassName("parameterDropdownToggle" + "Y")[0];

        if (dX.innerText === this.vars.outputParamters.name + "_PCA1")
            dX.innerText = name + "_PCA1";
        if (dX.innerText === this.vars.outputParamters.name + "_PCA2")
            dX.innerText = name + "_PCA2";
        if (dX.innerText === this.vars.outputParamters.name + "_ClusterIDs")
            dX.innerText = name + "_ClusterIDs";
        if (dY.innerText === this.vars.outputParamters.name + "_PCA1")
            dY.innerText = name + "_PCA1";
        if (dY.innerText === this.vars.outputParamters.name + "_PCA2")
            dY.innerText = name + "_PCA2";
        if (dY.innerText === this.vars.outputParamters.name + "_ClusterIDs")
            dY.innerText = name + "_ClusterIDs";

        this.vars.outputParamters.name = name;

        document.getElementsByClassName(
            "parameterDropdownItem_" + "X" + "_PCA1"
        )[0].children[0].innerText = name + "_PCA1";
        document.getElementsByClassName(
            "parameterDropdownItem_" + "X" + "_PCA2"
        )[0].children[0].innerText = name + "_PCA2";
        document.getElementsByClassName(
            "parameterDropdownItem_" + "X" + ""
        )[0].children[0].innerText = name + "_ClusterIDs";
        document.getElementsByClassName(
            "parameterDropdownItem_" + "Y" + "_PCA1"
        )[0].children[0].innerText = name + "_PCA1";
        document.getElementsByClassName(
            "parameterDropdownItem_" + "Y" + "_PCA2"
        )[0].children[0].innerText = name + "_PCA2";
        document.getElementsByClassName(
            "parameterDropdownItem_" + "Y" + ""
        )[0].children[0].innerText = name + "_ClusterIDs";
    }
    pcaChange() {
        this.vars.outputParamters.withPCA = !this.vars.outputParamters.withPCA;
    }
    featureChange() {
        this.vars.outputParamters.withFeature = !this.vars.outputParamters.withFeature;
    }
    selectionsChange() {
        this.vars.outputParamters.withSelections = !this.vars.outputParamters.withSelections;
    }
    withGraphChange() {
        this.vars.outputParamters.graph.with = !this.vars.outputParamters.graph.with;
    }
    withClustersChange() {
        this.vars.outputParamters.graph.withClusters = !this.vars.outputParamters.graph.withCluster;
    }

    disable() {
        this.ref_parameters.style.pointerEvents = "none";
        for (let i = 0; i < this.echarts_react.length; i++) {
            for (let j in this.echarts_react[i]) {
                this.echarts_react[i][j].getEchartsInstance().clear();
                let g = this.vars.parameterGraphs[i][j];
                g.option.series = [];
                g.option.series.push(Object.assign(g.getSeriesKey()));
                g.option.series[g.option.series.length - 1].symbolSize = 0;
                g.option.series[g.option.series.length - 1].data = [[0, 0], [10, 10]];
                this.echarts_react[i][j].getEchartsInstance().setOption(g.getOption());
            }
        }
    }
    enable() {
        this.ref_parameters.style.pointerEvents = "inherit";
    }

    componentDidMount() {
        this.toggleParameterType(this.vars.parameterType);
    }
    componentWillUnmount() {}
    componentWillReceiveProps(nextProps) {
        this.ignoreUpdate = true;
    }
    shouldComponentUpdate(nextProps) {
        if (this.ignoreUpdate) return false;
        return true;
    }

    render() {
        return (
            <div
                className="Parameters"
                ref={r => {
                    this.ref_parameters = r;
                }}
            >
                <div
                    id="algorithmParameters"
                    ref={r => {
                        this.ref_algoParam = r;
                    }}
                >
                    <div id="title">Algorithm Parameters</div>
                    <div id="container">{this._makeParameters()}</div>
                </div>
                <div
                    id="outputParameters"
                    ref={r => {
                        this.ref_outputParam = r;
                    }}
                >
                    <div id="title">Output Parameters</div>
                    <div className="outputParameter">
                        <div>Name</div>
                        <input
                            type="text"
                            placeholder="Output Name"
                            defaultValue={this.vars.outputParamters.name}
                            style={{ paddingLeft: "3px" }}
                            onInput={e => {
                                this.nameChange(e.target.value);
                            }}
                        />
                    </div>
                    <div className="outputParameterHead">Features</div>
                    <div className="outputParameter">
                        <div>PCA 1 and 2</div>
                        <Toggle
                            defaultChecked={this.vars.outputParamters.withPCA}
                            onChange={() => {
                                this.pcaChange();
                            }}
                        />
                    </div>
                    <div className="outputParameter">
                        <div>Cluster ID</div>
                        <Toggle
                            defaultChecked={this.vars.outputParamters.withFeature}
                            onChange={() => {
                                this.featureChange();
                            }}
                        />
                    </div>
                    <div className="outputParameterHead">Selections</div>
                    <div className="outputParameter">
                        <div>Clusters</div>
                        <Toggle
                            defaultChecked={this.vars.outputParamters.withSelections}
                            onChange={() => {
                                this.selectionsChange();
                            }}
                        />
                    </div>
                    <div className="outputParameterHead optioned">
                        <span>Graph (Scatter)</span>
                        <Toggle
                            defaultChecked={this.vars.outputParamters.graph.with}
                            onChange={() => {
                                this.withGraphChange();
                            }}
                        />
                    </div>
                    <div className="outputParameter">
                        <div>X</div>
                        {this.makeFeaturesDropdown("X")}
                    </div>
                    <div className="outputParameter">
                        <div>Y</div>
                        {this.makeFeaturesDropdown("Y")}
                    </div>
                    <HoverableFS />
                </div>
            </div>
        );
    }
}

// validation
Parameters.propTypes = {
    // reference to current data
    data: IPropTypes.map.isRequired,
    ui: IPropTypes.map.isRequired,
    algorithm: PropTypes.string.isRequired,
    initialStage: PropTypes.string.isRequired,
    updateCall: PropTypes.func.isRequired,
    setSteps: PropTypes.func.isRequired,
    invoke: PropTypes.func.isRequired,
    finalInvoke: PropTypes.func.isRequired
};

// redux store
const mapStateToProps = state => {
    return {
        data: state.get("data"),
        ui: state.get("ui")
    };
};
const mapDispatchToProps = dispatch => ({});
function mergeProps(propsFromState, propsFromDispatch, ownProps) {
    return {
        data: propsFromState.data,
        ui: propsFromState.ui,
        algorithm: ownProps.algorithm,
        initialStage: ownProps.initialStage,
        updateCall: ownProps.updateCall,
        setSteps: ownProps.setSteps,
        invoke: ownProps.invoke,
        finalInvoke: ownProps.finalInvoke
    };
}

export { Parameters };
export default connect(
    mapStateToProps,
    mapDispatchToProps,
    mergeProps,
    { withRef: true }
)(Parameters);
