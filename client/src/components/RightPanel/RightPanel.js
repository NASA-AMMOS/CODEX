import React, { Component, useState } from "react";
import "components/RightPanel/RightPanel.scss";
import Close from "@material-ui/icons/Close";
import Menu from "@material-ui/icons/menu";
import IconButton from "@material-ui/core/IconButton";

function RightPanel() {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            <IconButton className="menu-button-icon" hidden={open} onClick={_ => setOpen(!open)}>
                <Menu className="menu-button"/>
            </IconButton>
            <div className="right-panel" hidden={!open}>
                <IconButton className="close-button-icon" onClick={_ => setOpen(!open)}>
                    <Close className="close-button"/>
                </IconButton>
                <div className="right-panel-content">
                    Dummy information for the Right Panel
                </div>
            </div>
        </React.Fragment>
    );
}

export default RightPanel;
