import { useSavedSelections, useFilename, useFeatureNames} from "hooks/DataHooks";
import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useWindowManager } from "hooks/WindowHooks";
import * as utils from "utils/utils";
import React, { useRef, useState, useEffect } from "react";
import Button from "@material-ui/core/Button";

/*
    Function that creates the json object for requesting
    the data for the fmlt algorithm. 
*/
function createFMLTRequest(filename, selections, featureList) {
    return {
        routine: "workflow",
        dataSelections: selections,
        featureList: featureList,
        workflow: "find_more_like_this",
        file: filename,
        cid: "8ksjk",
        identification: { id: "dev0" }
    };
}

/*
    Parent component of this file that contains all of the ui for 
    the Find More Like This workflow
*/
function FindMoreLikeThis(props) {

    const [buttonClicked, setButtonClicked] = useState(false);

    const activeSelections = props.savedSelections
                                .filter((selection) => {return selection.active});

    let activeSelectionsIndices = [];
    for (let selection of activeSelections) {
        activeSelectionsIndices = activeSelectionsIndices.concat(selection.rowIndices);
    }

    useEffect( _ => {
        if (buttonClicked) {
            const requestObject = createFMLTRequest(props.filename, activeSelectionsIndices, props.featureNames);
            //actually handle the request for running the 
            //find more like this algorithm
            const request = utils.makeSimpleRequest(requestObject);
            //resolves the fmlt request
            request.req.then(data => {
                //add a saved selections called fmlt_output with the returned data
                props.saveSelection( "Like " + activeSelections[0].id, data.like_this)
            }); 
            //cleanup function
            return function cleanup() {
                request.cancel();
            };
        }
    },[buttonClicked]);

    return (
        <div className="fmlt-container">
            <div className="fmlt-active-selections">
                {
                    activeSelections.map((selection) => {
                        return <div className="fmlt-active-selections-item"> {selection.id} </div>;
                    })
                }
            </div>
            <Button
                variant="contained"
                color="primary"
                className="fmlt-run-button"
                onClick={_ => setButtonClicked(true)}
            >
                Run
            </Button>
        </div>
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

    const [savedSelections, saveSelection] = useSavedSelections();
    const filename = useFilename();
    const featureNames = useFeatureNames();

    return (
        <FindMoreLikeThis
            savedSelections={savedSelections}
            saveSelection={saveSelection}
            filename={filename}
            featureNames={featureNames}
        />
    );
};