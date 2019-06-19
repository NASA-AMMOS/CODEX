import "components/FindMoreLikeThis/FindMoreLikeThis.scss";
import React, { useRef, useState, useEffect } from "react";
import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useCurrentSelection, useSavedSelections, usePinnedFeatures, useFilename } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UiHooks";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";


/*
    Function that creates the json object for requesting
    the data for the find more like this algorithm. 
*/
function createFMLTRequest(filename, selections, features) {
    return {};
}


/*
    This function handles all of the behavior required to take
    the input in the ui to giving the user back the output of 
    the Find More Like This Algorithm.
*/
function getFMLTOutput(filename, selections, features) {

    let output = {};

    return output;
}


function InputSelectionListItem(props) {
    //this selected is not to be confused with the concept of 
    //a selection
    const [selected, setSelected] = useState(false);

    return (
        <li 
            key={props.name}
            className={"input-selection " + (selected ? "selected" : "unselected")}
            onClick={
                _ => {
                    setSelected(!selected); 
                    props.toggleSelected(props.name)
                }
            }
        > 
            {props.name}
        </li>
    );
}

/*
    List that allows the user to select which selections
    they want to run the algorithm on 
*/
function InputSelections(props) {
    //initializes all object elements as false
    let tempObj = {};
    for (let i = 0; i < props.savedSelections.length; i++) {
        tempObj[props.savedSelections[i].id] = false;
    }
    const [selectionsToggleObject, setSelectionsToggleObject] = useState(tempObj);

    function toggleSelected(name) {
        //searches selectedSelections for the given name and if its
        //there then it removes it otherwise it adds it
        let newObj = {
            ...selectionsToggleObject,
            [name]: !selectionsToggleObject[name]
        }

        setSelectionsToggleObject(newObj);

        props.setSelectedSelections(
            Object.keys(newObj)
                .filter((name) => newObj[name])
        );
    }

    return (
        <div className="fmlt-input-selections">
            Input Selections 
            <ul className="fmlt-input-selections-list">
                {
                    props.savedSelections.map((selection) => {
                        return (
                            <InputSelectionListItem 
                                name={selection.id} 
                                toggleSelected={toggleSelected}
                            />
                        );
                    })
                }
            </ul>
        </div>
    );
}

function OutputSelections(props) {

    if (props.fmltOutput) {
        //done loading
        return (
            <div className="fmlt-output-selections">
                Output Selections
            </div>
        );
    } else {
        //loading
        return (
            <div className="fmlt-output-selections">
                Output Selections
                <CircularProgress />
            </div>
        );
    }
    
}

/*
    Parent component of this file that contains all of the ui for 
    the Find More Like This workflow
*/
function FindMoreLikeThis(props) {

    const [fmltOutput, setFMLTOutput] = useState(null);
    //this is passed to the children to handle figuring out what
    //selections the user has chosen
    const [selectedSelections, setSelectedSelections] = useState([]);

    //handler for the run button
    //this function handles calling the create request functions
    //it also does input validation
    function handleRunButtonClick() {
        
        if (selectedSelections.length != 0) {
            //runs the algorithm
        } else {
            //send error message because no selections 
            //were chosen
        }
    }

    return (
        <React.Fragment>
            <div className="fmlt-header">
                Find More Like This
            </div>
            <div className="io-container">
                <InputSelections 
                    savedSelections={props.savedSelections}
                    setSelectedSelections={setSelectedSelections}
                 />
                <OutputSelections fmltOutput={fmltOutput}/>
            </div>
            <Button
                variant="contained"
                color="primary"
                className="fmlt-run-button"
                onClick={_ => handleRunButtonClick()}
            >
                Run
            </Button>
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
    const filename = useFilename();
    
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
            filename={filename}
            data={features}
        />
    );
};