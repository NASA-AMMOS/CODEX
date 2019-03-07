import "./View.css";

import React, { Component } from "react";

import Container from "../Container/Container";
import LeftPanel from "components/LeftPanel/LeftPanel";
import TopBar from "components/TopBar/TopBar";

class View extends Component {
    render() {
        return (
            <div className="View noselect">
                <LeftPanel />
                <div className="rightPanel">
                    <TopBar />
                    <Container />
                </div>
            </div>
        );
    }
}

export default View;
