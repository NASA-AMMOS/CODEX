import "components/FindMoreLikeThis/FindMoreLikeThis.scss";
import React, { useRef, useState, useEffect } from "react";
import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useSavedSelections, useFilename, useFeatureNames, useFeatureLength, useNextColorIndex} from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UiHooks";
import * as utils from "utils/utils";
import CircularProgress from "@material-ui/core/CircularProgress";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import * as uiTypes from "constants/uiTypes";
import DeleteIcon from '@material-ui/icons/Delete';
import IconButton from "@material-ui/core/IconButton";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";


/*
    Function that handles constructing the default selections
    state array.
*/
function constructDefaultSelections(selections) {

    return selections.map((selection) => {
        return {
            name: selection.id,
            className: "None"
        };
    });
}

/*
    Function that handles constructing the default state array
    for the data classes
*/
function constructDefaultClasses(nextColorIndex) {

    return [
        {
            name:"Class 1",
            color:uiTypes.SELECTIONS_COLOR_PALETTE[nextColorIndex]
        }
    ];
}

/*
    Function that builds an object of classes and their associated 
    labels to feed to the backend
*/
function buildBackendSelectionObject(selections, savedSelections) {
    let backendSelectionObject = {};

    function getIndexOfSelectionWithName(name) {
        for (let [key, value] of Object.entries(savedSelections)) {
            if (value.id === name)
                return key
        }
        return -1;
    }

    for(let selection of selections) {
        if (!backendSelectionObject[selection.className]) {
            backendSelectionObject[selection.className] = 
                savedSelections[getIndexOfSelectionWithName(selection.name)].rowIndices;
        } else {
            backendSelectionObject[selection.className] = 
                backendSelectionObject[selection.className]
                    .concat(savedSelections[getIndexOfSelectionWithName(selection.name)].rowIndices);
        }
    }

    return backendSelectionObject;
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
    This is a component representing a row of 
    the SelectionLabeling sectiontion of the page
*/
function SelectionLabelingRow(props) {

    return (
        <div className="selection-labeling-row">
            <Typography variant="subtitle1">
                {props.selectionObject.name}
            </Typography>
            <FormControl classes={{ root: "dropdown" }}>
                <Select
                    value={props.selectionObject.className}
                    //todo handle onchange event
                    //onChange={e => setSearchType(e.target.value)}
                >
                    {props.classes.map(class => (
                        <MenuItem key={class.name} value={class}>
                            {o.charAt(0).toUpperCase() + o.slice(1)}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
}

/*
    This is the component responsible for allowing the 
    user to label which class(if any) a certain selection
    belongs to
*/
function SelectionLabeling(props) {

    return (
        <div className="selection-labeling">
            <Typography variant="subtitle1">
                Selection Labeling
            </Typography>
        </div>
    );
}

/*
    Function that creates a row for the list of classes.
    This is a stateless component just used for rendering
    the row.
*/
function ClassRow(props) {

    return (
        <div className="classes-list-row">
            <Typography variant="subtitle1">
                {props.classObject.name}
            </Typography>
            <div
                className="swatch"
                style={{ background: props.classObject.color }}
            />
            <IconButton onClick={props.deleteClass(props.classObject.name)}>
                <DeleteIcon />
            </IconButton>
        </div>
    );
}

/*
    Component representing the list of classes for the 
    fmlt classification algorithm to train on
*/
function ClassesSection(props) {
    //all the state for the sub list components will be 
    //maintaned here for simplicity
    //handles the behavior of adding a default class to the list
    function createClass() {

    } 
    //handles the behavior for opening up a color pallete
    //this might not work in the initial implementation
    function modifyColor(className) {

    }

    //handles deleting a class based on its name
    function deleteClass(className) {

    }

    //function to modify the name of a class
    function modifyName(oldName, newName) {
        //this should also handle dynamically changing the name 
        //of all of the selections currently associated with that class
    }

    return (
        <div className="classes-section">
            <Typography variant="subtitle1">
                Classes
            </Typography>
            <div className="classes-list">
                {
                    props.classes.map(
                        (classObject) => {
                            return (
                                <ClassRow
                                    classObject={classObject}
                                    deleteClass={deleteClass}
                                />
                            );
                        }
                    )
                }
            </div>
            <Button className="add-class-button"
                    variant="contained"
                    color="primary"
                    onClick={_ =>
                        createClass()
                    }
                >
                    Add class
            </Button>
        </div>
    );
}

/*
    Parent component of this file that contains all of the ui for 
    the Find More Like This workflow
*/
function FindMoreLikeThis(props) {
    //state to detect run button clicks
    const [buttonClicked, setButtonClicked] = useState(false);

    //this piece of state handles holding the metatdata
    //attatched to selections in the ui
    //this is not to be confused with props.savedSelections
    //which is a piece coming from global state
    const [selections, setSelections] = useState(
        constructDefaultSelections(props.savedSelections)
    );

    //interfaces for interacting with selections defined here

    //this piece of state holds the meta data associated with classes
    const [classes, setClasses] = useState(
        constructDefaultClasses(props.nextColorIndex)
    ); 

    //interfaces for interacting with the classes here

    /*
        Function to validate the user form input
    */
    function verifyInputsValid() {
        //todo implement this logic
        return true;
    }

    //handler for the run button
    //this function handles calling the create request functions
    //it also does input validation
    useEffect(() => {
        //assume if this runs that button is clicked because that is the 
        //only time the flag changes
        if (verifyInputsValid()) {
            const classSelections = buildBackendSelectionObject(selections, props.savedSelections)
            const requestObject = createFMLTRequest(props.filename, classSelections, props.featureNames);
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
                <ClassesSection
                    classes={classes}
                 />
                <SelectionLabeling
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
    const nextColorIndex = useNextColorIndex();

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
            nextColorIndex={nextColorIndex}
        />
    );
};