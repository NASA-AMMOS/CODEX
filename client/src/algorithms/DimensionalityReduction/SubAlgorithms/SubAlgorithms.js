import React, { Component } from "react";
import "./SubAlgorithms.css";

import { controller } from "../../../Controller/controller";
import simplescatter from "../simplescatter";

import HelpTriggerableName from "../../../Components/HelpTriggerableName/HelpTriggerableName";

import ReactEcharts from "echarts-for-react";
import classnames from "classnames";
import { Popover } from "reactstrap";
import ReactMarkdown from "react-markdown";

import { MdClose } from "react-icons/lib/md";
import { formulas } from "../../../formulas/formulas";

class SubAlgorithms extends Component {
    constructor(props) {
        super(props);

        let subAlgos = controller.getAlgorithm("Dimensionality Reduction").subalgorithms;
        //subAlgos = [subAlgos[0]]; //!!!!!!!!!!!!!!!!!!!!!

        this.vars = {
            subalgorithms: subAlgos,
            estimatedTimes: new Array(subAlgos.length).fill(0),
            updateOnToggleOn: false,
            defaultScatterOptions: new simplescatter().getOption(),
            guidanceMarkdown: "",
            guidanceI: 0,
            loading: []
        };
        this.state = {
            toggledOn: true,
            popoverOpen: new Array(this.vars.subalgorithms.length).fill(false),
            chosenAlgorithm: -1,
            chosenGraph: new simplescatter(),
            currentTime: "0"
        };

        let o = this.state.chosenGraph.option;
        o.grid.left = 0;
        o.grid.right = 1;
        o.grid.top = 0;
        o.grid.bottom = 1;
        o.xAxis[0].show = false;
        o.yAxis[0].show = false;

        this.echarts_react = [];
        this.samples = [];
        this.etas = [];

        controller.subscribeChosenFeaturesUpdate(this.update.bind(this), "subalgorithms");
        controller.subscribeChosenSelectionsUpdate(this.update.bind(this), "subalgorithms");
    }

    reaction(r) {
        if (this._ismounted) {
            if (this.samples[r.identification.vars.i])
                this.samples[r.identification.vars.i].style.opacity = 1;

            if (r.eta) this.vars.estimatedTimes[r.identification.vars.i] = +r.eta.toFixed(2);
            else this.vars.estimatedTimes[r.identification.vars.i] = 0;

            if (this.etas[r.identification.vars.i])
                this.etas[r.identification.vars.i].style.opacity = 1;

            this.echarts_react[r.identification.vars.i].getEchartsInstance().clear();

            let g = this.vars.subalgorithms[r.identification.vars.i].graph;
            g.option.series = [];
            let tempDataArray = [];

            if (r.explained_variance_ratio) {
                for (let d = 0; d < r.explained_variance_ratio.length; d++) {
                    tempDataArray.push([d, r.explained_variance_ratio[d]]);
                }
            }
            g.option.series.push(Object.assign(g.getSeriesKey()));
            g.option.series[g.option.series.length - 1].data = tempDataArray;

            this.echarts_react[r.identification.vars.i]
                .getEchartsInstance()
                .setOption(g.getOption());
            this.vars.loading[r.identification.vars.i] = false;
            this.echarts_react[r.identification.vars.i].getEchartsInstance().hideLoading();
            this.forceUpdate();
        }
    }

    toggleSubAlgorithmSelector(on) {
        if (this.state.chosenAlgorithm >= 0) {
            let newToggledOn = !this.state.toggledOn;
            if (on !== undefined) newToggledOn = on === true;
            this.props.setSelectingSubAlgorithms(newToggledOn);
            this.setState({ toggledOn: newToggledOn });
            return true;
        } else return false;
    }

    updateSubAlgorithm(i) {
        this.props.setSelectingSubAlgorithms(!this.state.toggledOn);
        this.props.setContinueOpacity(1);
        this.props.setSelectedSubAlgorithm(this.vars.subalgorithms[i].simplename);
        this.props.updateCall({ algorithmName: this.vars.subalgorithms[i].simplename });
        this.props.setEstimatedTime(parseFloat(this.vars.estimatedTimes[i], 10));
        this.setState({
            chosenAlgorithm: i,
            currentTime: this.vars.estimatedTimes[i],
            toggledOn: false
        });
    }

    back() {
        this.props.setSelectingSubAlgorithms(true);
        this.setState({ toggledOn: true });
    }
    continue() {
        this.props.setSelectingSubAlgorithms(false);
        this.setState({ toggledOn: false });
    }

    update() {
        this.vars.loading = new Array(this.vars.loading.length).fill(true);
        if (this.state.toggledOn) {
            for (let i = 0; i < this.vars.subalgorithms.length; i++) {
                this.echarts_react[i].getEchartsInstance().showLoading();
                if (!this.vars.subalgorithms[i]["graph"])
                    this.vars.subalgorithms[i]["graph"] = new simplescatter();
                if (this.samples[i]) this.samples[i].style.opacity = 0.15;
                this.props.invoke(
                    { algorithmName: this.vars.subalgorithms[i].simplename },
                    this.reaction.bind(this),
                    {},
                    { i: i }
                );
            }
        } else this.vars.updateOnToggleOn = true;
    }

    getSubAlgorithms() {
        let subalgorithms = [];
        for (let i in this.vars.subalgorithms) {
            let estimatedTime = this.vars.estimatedTimes[i] + "s";
            let classes = classnames("subalgorithm", { active: i === this.state.chosenAlgorithm });
            this.vars.loading[i] = this.vars.loading[i] !== undefined ? this.vars.loading[i] : true;
            subalgorithms.push(
                <li key={i} className={classes}>
                    <div className="subalgoName" id={"subalgoNamePopover" + i}>
                        <HelpTriggerableName
                            name={this.vars.subalgorithms[i].name}
                            nameClick={() => {
                                this.updateSubAlgorithm(i);
                            }}
                            guidancePath={
                                "dimensionality_reduction_page:" +
                                this.vars.subalgorithms[i].simplename
                            }
                            trigger={gP => this.guidanceTrigger(gP, i)}
                            spacebetween={true}
                        />
                    </div>
                    <div
                        id="sample"
                        ref={e => {
                            this.samples[i] = e;
                        }}
                        onClick={() => {
                            this.updateSubAlgorithm(i);
                        }}
                    >
                        <ReactEcharts
                            ref={e => {
                                this.echarts_react[i] = e;
                            }}
                            option={
                                this.vars.subalgorithms[i].graph
                                    ? this.vars.subalgorithms[i].graph.getOption()
                                    : this.vars.defaultScatterOptions
                            }
                            showLoading={this.vars.loading[i]}
                            style={{ height: "100%", width: "100%" }}
                        />
                    </div>
                    <div
                        id="time"
                        className="dimredtime"
                        ref={e => {
                            this.etas[i] = e;
                        }}
                    >
                        {"~" + estimatedTime}
                    </div>
                    <Popover
                        className="subalgorithmPopover"
                        innerClassName="subalgorithmPopoverInner"
                        placement="bottom"
                        isOpen={this.state.popoverOpen[i]}
                        target={"subalgoNamePopover" + i}
                        onClick={() => {
                            this.popoverToggle(i);
                        }}
                    >
                        <div className="subalgorithmPopoverClose">
                            <MdClose />
                        </div>
                        <ReactMarkdown source={this.vars.guidanceMarkdown} />
                    </Popover>
                </li>
            );
        }
        return subalgorithms;
    }

    guidanceTrigger(guidancePath, i) {
        if (!this.state.popoverOpen[i]) {
            //popover is closed and thus we're turing it on
            this.vars.guidanceI = i;
            this.vars.guidancePath = guidancePath;
            this.props.invoke(
                { routine: "guidance", guidance: guidancePath },
                this.guidanceReaction.bind(this),
                {}
            );
        } else {
            this.popoverToggle(i);
        }
    }

    guidanceReaction(r) {
        this.vars.guidanceMarkdown = r.guidance;
        this.popoverToggle(this.vars.guidanceI);
        this.forceUpdate();
    }

    popoverToggle(i) {
        var newPopoverOpen = new Array(this.state.popoverOpen.length).fill(false);
        newPopoverOpen[i] = !this.state.popoverOpen[i];
        this.setState({
            popoverOpen: newPopoverOpen
        });
    }

    disable() {
        this.ref_subalgorithm.style.pointerEvents = "none";
        for (let i = 0; i < this.echarts_react.length; i++) {
            this.echarts_react[i].getEchartsInstance().clear();
            let g = this.vars.subalgorithms[i].graph;
            g.option.series = [];
            g.option.series.push(Object.assign(g.getSeriesKey()));

            g.option.series[g.option.series.length - 1].symbolSize = 0;
            g.option.series[g.option.series.length - 1].data = [[0, 0], [10, 10]];
            this.echarts_react[i].getEchartsInstance().setOption(g.getOption());
            this.etas[i].style.opacity = 0;
        }
    }
    enable() {
        this.ref_subalgorithm.style.pointerEvents = "inherit";
    }

    componentDidMount() {
        this._ismounted = true;
        //Initialize first subalgorithm previews
        this.props.setContinueOpacity(0.15);
        this.update();
    }
    componentWillUnmount() {
        this._ismounted = false;
        controller.unsubscribeChosenFeaturesUpdate(this.update.bind(this), "subalgorithms");
        controller.unsubscribeChosenSelectionsUpdate(this.update.bind(this), "subalgorithms");
    }

    render() {
        console.log("Subalgo render");
        let classes = classnames({ active: this.state.toggledOn });

        let name = "None";
        let chart = null;
        if (this.state.chosenAlgorithm >= 0) {
            this.state.chosenGraph.option.series = this.vars.subalgorithms[
                this.state.chosenAlgorithm
            ].graph.getOption().series;
            name = this.vars.subalgorithms[this.state.chosenAlgorithm].name;
            chart = (
                <ReactEcharts
                    ref={e => {
                        this.echarts_react_current = e;
                    }}
                    option={this.state.chosenGraph.getOption()}
                    style={{ height: "100%", width: "100%" }}
                />
            );
        }

        if (this.state.toggledOn && this.vars.updateOnToggleOn) {
            this.update();
            this.vars.updateOnToggleOn = false;
        }

        return (
            <div className="SubAlgorithms" ref={r => (this.ref_subalgorithm = r)}>
                <div id="selectedName">{name + " ~" + this.state.currentTime + "s"}</div>
                <div
                    id="info"
                    onClick={() => {
                        this.toggleSubAlgorithmSelector();
                    }}
                >
                    <div id="left">
                        <div id="currentname">{name}</div>
                        <div id="currenttime">{"~" + this.state.currentTime + "s"}</div>
                    </div>
                    <div id="right">
                        <div id="currentsample">{chart}</div>
                    </div>
                </div>
                <div id="subalgorithms" className={classes}>
                    {this.getSubAlgorithms()}
                </div>
            </div>
        );
    }
}

export default SubAlgorithms;
