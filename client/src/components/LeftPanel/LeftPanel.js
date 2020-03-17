import React, { Component, useState } from "react";
import "components/LeftPanel/LeftPanel.css";

import FeatureList from "components/LeftPanel/FeatureList";
import SelectionList from "components/LeftPanel/SelectionList";

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
        <React.Fragment>
            <div className="Panel">
                <div id="content">
                    <FilterBar setFilterString={setFilterString} />
                    <FeatureList filterString={filterString} />
                    <SelectionList filterString={filterString} />
                </div>
            </div>
        </React.Fragment>
    );
}

export default LeftPanel;
