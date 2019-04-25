import React, { Component, useState } from "react";
import "components/LeftPanel/LeftPanel.css";

import Title from "../Title/Title";
import FeatureList from "components/LeftPanel/FeatureList";
import SelectionList from "components/LeftPanel/SelectionList";

function LeftPanel() {
    const [filterString, setFilterString] = useState("");
    const [onOffAll, setOnOffAll] = useState("on");

    function toggleOnOffAll() {
        let newParam = "on";
        switch (onOffAll) {
            case "on":
                newParam = "off";
                break;
            case "off":
                newParam = "all";
                break;
        }
        setOnOffAll(newParam);
    }

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
                                    onInput={e => setFilterString(e.target.value)}
                                />
                            </div>
                            <div id="onOffAll" className={onOffAll} onClick={toggleOnOffAll}>
                                {onOffAll}
                            </div>
                        </div>
                        <FeatureList filterString={filterString} onOffAll={onOffAll} />
                        <SelectionList />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LeftPanel;
