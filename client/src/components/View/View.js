import "./View.css";

import React, { Component } from "react";

import Container from "../Container/Container";
import LeftPanel from "components/LeftPanel/LeftPanel";
import RightPanel from "components/RightPanel/RightPanel";
import TopBar from "components/TopBar/TopBar";
import ControlBar from "components/ControlBar/ControlBar";

class View extends Component {
    render() {
        return (
            <div className="View noselect">
                <LeftPanel />
                <div className="rightPanel">
                    <TopBar />
                    <ControlBar />
                    <Container />
                </div>
                <RightPanel />
            </div>
        );
    }
}

export default View;
