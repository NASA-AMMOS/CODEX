import React, { Component } from "react";
import "./Panel.css";

import Title from "../Title/Title";
import Features from "../Features/Features";

class Panel extends Component {
    constructor() {
        super();

        this.state = {
            panelOpen: true,
            filterString: "",
            onOffAll: "all"
        };
    }

    setFilterString(v) {
        this.setState({ filterString: v });
    }
    moveOnOffAll() {
        let state = this.state.onOffAll;
        if (state === "on") state = "off";
        else if (state === "off") state = "all";
        else state = "on";

        this.setState({ onOffAll: state });
    }

    render() {
        return (
            <div className="Panel">
                <div id="content">
                    <Title />
                    <div id="contents">
                        <div id="right">
                            <div className="PanelOptions">
                                <div id="filter">
                                    <input
                                        type="text"
                                        placeholder="Filter"
                                        onInput={e => this.setFilterString(e.target.value)}
                                    />
                                </div>
                                <div
                                    id="onOffAll"
                                    className={this.state.onOffAll}
                                    onClick={() => this.moveOnOffAll()}
                                >
                                    {this.state.onOffAll}
                                </div>
                            </div>
                            <Features
                                filterString={this.state.filterString}
                                onOffAll={this.state.onOffAll}
                            />
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Panel;
