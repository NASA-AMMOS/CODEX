import React, { Component } from "react";
import "./Container.css";

import TopBar from "../TopBar/TopBar";
import RWindowManager from "../RWindowManager/RWindowManager/RWindowManager";

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
