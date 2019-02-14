import "./Container.css";

import React, { Component } from "react";

import RWindowManager from "../RWindowManager/RWindowManager/RWindowManager";
import TopBar from "../TopBar/TopBar";

class Container extends Component {
    render() {
        return (
            <div className="Container">
                <TopBar />
                <div id="stylyDiv" />
                <RWindowManager />
            </div>
        );
    }
}

export default Container;
