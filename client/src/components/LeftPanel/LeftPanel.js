import "./LeftPanel.css";

import React, { useState } from "react";

import FeatureList from "./FeatureList";
import SelectionEdit from "./SelectionEdit";
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
    const selectionEditModeState = useState(false);
    const [selectionEditMode, setSelectionEditMode] = selectionEditModeState;

    return (
        <React.Fragment>
            <div className="Panel">
                <div id="content">
                    {selectionEditMode ? null : (
                        <React.Fragment>
                            <FilterBar setFilterString={setFilterString} />
                            <FeatureList filterString={filterString} />
                        </React.Fragment>
                    )}
                    {selectionEditMode ? (
                        <SelectionEdit selectionEditModeState={selectionEditModeState} />
                    ) : (
                        <SelectionList
                            filterString={filterString}
                            selectionEditModeState={selectionEditModeState}
                        />
                    )}
                </div>
            </div>
        </React.Fragment>
    );
}

export default LeftPanel;
