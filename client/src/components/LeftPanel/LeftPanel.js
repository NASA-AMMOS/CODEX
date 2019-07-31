import React, { Component, useState } from "react";
import "components/LeftPanel/LeftPanel.css";

import FeatureList from "components/LeftPanel/FeatureList";
import SelectionList from "components/LeftPanel/SelectionList";

function LeftPanel() {
    return (
        <React.Fragment>
            <div className="Panel">
                <div id="content">
                    <FeatureList/>
                    <SelectionList/>
                </div>
            </div>
        </React.Fragment>
    );
}

export default LeftPanel;
