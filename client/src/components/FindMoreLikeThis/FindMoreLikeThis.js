import "components/FindMoreLikeThis/FindMoreLikeThis.scss";
import React, { useRef, useState, useEffect } from "react";
import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useCurrentSelection, useSavedSelections, usePinnedFeatures } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UiHooks";

function UtilityBar(props) {

    return (
        <React.Fragment>
            Utility Bar
        </React.Fragment>
    );
}

function ModelOutput(props) {

    return (
        <React.Fragment>
            Model Output
        </React.Fragment>
    );
}

function UserInput(props) {

    return (
        <React.Fragment>
            User Input
        </React.Fragment>
    );
}

function FindMoreLikeThis(props) {

    return (
        <React.Fragment>
            <UtilityBar/>
            <div className="find-more-like-this-header">
                Find More Like This
            </div>
            <div className="io-container">
                <UserInput/>
                <ModelOutput/>
            </div>
        </React.Fragment>
    );
}

// wrapped data selector
export default props => {
    const win = useWindowManager(props, {
        width: 750,
        height: 500,
        resizeable: true,
        title: "Find More Like This"
    });

    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    const [savedSelections, saveCurrentSelection] = useSavedSelections();
    
    const features = usePinnedFeatures();

    if (features === null) {
        return <WindowCircularProgress />;
    }

    if (features.size === 0) {
        return <WindowError> Please select at least one feature to use this graph.</WindowError>;
    }

    return (
        <FindMoreLikeThis
            currentSelection={currentSelection}
            setCurrentSelection={setCurrentSelection}
            savedSelections={savedSelections}
            saveCurrentSelection={saveCurrentSelection}
            data={features}
        />
    );
};