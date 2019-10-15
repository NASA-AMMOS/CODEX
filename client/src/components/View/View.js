import "./View.css";

import React, { Component } from "react";

import Container from "../Container/Container";
import LeftPanel from "components/LeftPanel/LeftPanel";
import TopBar from "components/TopBar/TopBar";
import ConfirmationModal from "components/ConfirmationModal/ConfirmationModal";
import CodexSnackbar from "components/CodexSnackbar/CodexSnackbar";

function View(props) {
    return (
        <div className="View noselect">
            <TopBar />

            <div className="bottom-section">
                <LeftPanel />
                <div className="rightPanel">
                    <Container />
                </div>
            </div>
            <ConfirmationModal />
            <CodexSnackbar />
        </div>
    );
}

export default View;
