import "components/FindMoreLikeThis/FindMoreLikeThis.scss";
import React, { useRef, useState, useEffect } from "react";
import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useSavedSelections, useFilename, useFeatureNames, useFeatureLength} from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UiHooks";
import * as utils from "utils/utils";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";

/*
    Funciton that gets all of indices in the given selections
*/    
function getSelectionIndices(selectionArray, savedSelections) {
    const indicesSet = new Set();
    let indicesList = [];

    for(let selectionName of selectionArray) {
        let selectionIndex = -1;
        for (const[key, entry] of Object.entries(savedSelections)) {
            if (entry.id === selectionName)
                selectionIndex = key;
        }
        indicesList.push(savedSelections[selectionIndex].rowIndices);
    }

    return indicesList;
}

/*
    Function that creates the json object for requesting
    the data for the find more like this algorithm. 
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
    Creates a request to upload selections to the backend

function createSelectionUploadRequest(selectionData) {
    return {
        routine: "arrange",
        activity: "add",
        hashType: "selection",
        data: selectionData,
        name: "fmlt_mask",
        cid: "8ksjk",
        identification: { id: "dev0" }
    };
}
*/

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
                <br/>
                {props.fmltOutput.outputMessage}
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
    const [buttonClicked, setButtonClicked] = useState(false);

    //handler for the run button
    //this function handles calling the create request functions
    //it also does input validation
    useEffect(() => {
        //assume if this runs that button is clicked because that is the 
        //only time the flag changes
        if (selectedSelections.length != 0) {
            const convertedSelections = getSelectionIndices(selectedSelections, props.savedSelections);

            const requestObject = createFMLTRequest(props.filename, convertedSelections, props.featureNames);

            //makes a fmlt request
            const request = utils.makeSimpleRequest(requestObject);
            //resolves the fmlt request
            request.req.then(data => {
                //add a saved selections called fmlt_output with the returned data
                data.like_this.forEach((indices) => {
                    props.saveSelection("output"+(Math.random()*10000), indices)
                });
            }); 

            //cleanup function
            return function cleanup() {
                request.cancel();
            };
        } else {
            //send error message because no selections 
            //were chosen
        }
    }, [buttonClicked]);

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
                <OutputSelections 
                    fmltOutput={fmltOutput}
                />
            </div>
            <Button
                variant="contained"
                color="primary"
                className="fmlt-run-button"
                onClick={_ => setButtonClicked(true)}
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

    const [savedSelections, saveSelection] = useSavedSelections();
    const filename = useFilename();
    
    const features = useFeatureNames();

    if (features === null) {
        return <WindowCircularProgress />;
    }

    if (features.size === 0) {
        return <WindowError> Please select at least one feature to use this graph.</WindowError>;
    }

    return (
        <FindMoreLikeThis
            savedSelections={savedSelections}
            saveSelection={saveSelection}
            filename={filename}
            data={features}
            featureNames={features}
        />
    );
};