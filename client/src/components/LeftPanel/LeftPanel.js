import "./LeftPanel.css";

import React, { useState } from "react";

import FeatureList from "./FeatureList";
import SelectionList from "./SelectionList";

/*
    Bar that handles the form for the feature filtering
*/
function FilterBar(props) {
    return (
        <div className="filter-bar">
            <input
                type="text"
                placeholder="Filter"
                onInput={e => props.setFilterString(e.target.value)}
            />
        </div>
    );
}

function LeftPanel() {
    //filter string
    const [filterString, setFilterString] = useState("");

    return (
        <div className="Panel">
            <div id="content">
                <FilterBar setFilterString={setFilterString} />
                <FeatureList filterString={filterString} />
                <SelectionList filterString={filterString} />
            </div>
        </div>
    );
}

export default LeftPanel;
