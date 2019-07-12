import "components/GeneralClassifier/GeneralClassifier.scss";
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
import TextField from '@material-ui/core/TextField';

function createClassObject(name, nextColorIndex) {
    return {
        name: name,
        color:uiTypes.SELECTIONS_COLOR_PALETTE[nextColorIndex]
    }
}

/*
    Function that builds an object of classes and their associated 
    labels to feed to the backend
*/
function buildBackendSelectionObject(selections, savedSelections) {
    let backendSelectionObject = {};

    function getIndexOfSelectionWithName(name) {
        for (let [key, value] of Object.entries(savedSelections)) {
            if (value.name === name)
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
    the data for the general classifier algorithm. 
*/
function createGCRequest(filename, selections, featureList) {
    return {
        routine: "workflow",
        dataSelections: selections,
        featureList: featureList,
        workflow: "general_classifier",
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
            <Typography variant="subtitle1" className="selection-name">
                {props.selectionObject.name}
            </Typography>
            <FormControl classes={{ root: "dropdown" }} className="selection-dropdown">
                <Select
                    value={props.selectionObject.className}
                    //todo handle onchange event
                    onChange={e => props.changeClass(props.selectionObject.name, e.target.value)}
                >
                    {
                        props.classes.map(classObject => (
                            <MenuItem key={classObject.name} value={classObject.name}>
                                {classObject.name}
                            </MenuItem>
                        ))
                    }
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

    //these functions help to manage the state of selectionlabeling
    //returns the index
    function findSelectionByName(name) {
        let index = -1;
        for(let i = 0; i < props.selections.length; i++) {
            if (props.selections[i].name === name)
                index = i;
        }
        return index;
    }

    //function that allows for the changing of a class for a selection
    function changeClass(selection, newClassName) {
        const index = findSelectionByName(selection);

        let newSelections = [...props.selections];
        newSelections[index].className = newClassName;
        props.setSelections(newSelections);
    }

    return (
        <div className="gc-selection-labeling">
            <Typography variant="h6">
                Selection Labeling
            </Typography>
            <div className="selection-labeling-list">
                {
                    props.selections.map((selection) => {
                        return (
                            <SelectionLabelingRow
                                classes={props.classes}
                                selectionObject={selection}
                                changeClass={changeClass}
                            /> 
                        );
                    })
                }
            </div>
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
            <TextField 
                variant="standard" 
                value={props.classObject.name} 
                className="classes-list-row-title"
                onChange={function(e) { props.modifyName(props.classObject.name, e.target.value)}}
            />
            <div
                className="swatch"
                style={{ background: props.classObject.color }}
            />
            <IconButton onClick={function() {props.deleteClass(props.classObject.name)}}>
                <DeleteIcon />
            </IconButton>
        </div>
    );
}

/*
    Component representing the list of classes for the 
    gc classification algorithm to train on
*/
function ClassesSection(props) {
    //all the state for the sub list components will be 
    //maintaned here for simplicity

    //helper function for finding a class by name
    //returns the index
    function findClassByName(name) {
        let index = -1;
        for(let i = 0; i < props.classes.length; i++) {
            if (props.classes[i].name === name)
                index = i;
        }
        return index;
    }

    //handles the behavior of adding a default class to the list
    function createClass() {   
        //creates a new class based on the length of the classes array
        let newClassArray = [...props.classes];

        newClassArray.push(
            createClassObject(
                "Class "+props.classes.length,
                props.nextColorIndex + props.classes.length - 1
            )
        );

        props.setClasses(newClassArray);
    } 
    //handles the behavior for opening up a color pallete
    //this might not work in the initial implementation
    function modifyColor(className) {

    }

    //handles deleting a class based on its name
    function deleteClass(className) {
        const index = findClassByName(className);
        let arrToSplice = [...props.classes];

        if (index >= 0){
            arrToSplice.splice(index, 1)
            props.setClasses(arrToSplice);
        }
    }

    //function to modify the name of a class
    function modifyName(oldName, newName) {
        //this should also handle dynamically changing the name 
        //of all of the selections currently associated with that class
        const index = findClassByName(oldName);

        let newClasses = [...props.classes];
        newClasses[index].name = newName;

        props.setClasses(newClasses);
    }

    return (
        <div className="gc-classes-section">
            <Typography variant="h6">
                Classes
            </Typography>
            <div className="classes-list">
                {
                    props.classes.map(
                        (classObject, idx) => {
                            if (classObject.name != "None")
                                return (
                                    <ClassRow
                                        key={idx}
                                        classObject={classObject}
                                        deleteClass={deleteClass}
                                        modifyName={modifyName}
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
    Function that handles constructing the default state array
    for the data classes
*/
function constructDefaultClasses(nextColorIndex) {
    return [
        {
            name:"Class 1",
            color:uiTypes.SELECTIONS_COLOR_PALETTE[nextColorIndex]
        },

        {
            name:"None",
            color:"None"
        }
    ];
}

/*
    Parent component of this file that contains all of the ui for 
    the General Classifier workflow
*/
function GeneralClassifier(props) {
    //state to detect run button clicks
    const [buttonClicked, setButtonClicked] = useState(false);

    //this piece of state handles holding the metatdata
    //attatched to selections in the ui
    //this is not to be confused with props.savedSelections
    //which is a piece coming from global state
    const [selections, setSelections] = useState([]);

    //this handles live updating the selections on update of savedSelections
    useEffect(_ => {
        //go through and update the selection names
        setSelections(
            props.savedSelections
                .filter((selection) => {return selection.active})
                .map((selection) => {
                    return {
                        name: selection.name,
                        className: selection.className != undefined ? selection.className : "None"
                    }
                }
            )
        );
    },[props.savedSelections]) ;


    //this piece of state holds the meta data associated with classes
    const [classes, setClasses] = useState(
        constructDefaultClasses(props.nextColorIndex)
    ); 

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
            const classSelections = buildBackendSelectionObject(selections, props.savedSelections);
            const requestObject = createGCRequest(props.filename, classSelections, props.featureNames);
            //makes a gc request
            const request = utils.makeSimpleRequest(requestObject);
            //resolves the gc request
            request.req.then(data => {
                //add a saved selections called gc_output with the returned data
                for (let [key, value] of Object.entries(data.like_this)) {
                    //todo make naming robust to existing selections
                    props.saveSelection(key, value);
                }
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
            <div className="gc-header">
                General Classifier
            </div>
            <div className="io-container">
                <ClassesSection
                    classes={classes}
                    setClasses={setClasses}
                    nextColorIndex={props.nextColorIndex}
                 />
                <SelectionLabeling
                    classes={classes}
                    selections={selections}
                    setSelections={setSelections}
                />
            </div>
            <Button
                variant="contained"
                color="primary"
                className="gc-run-button"
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
        title: "General Classifier"
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
        <GeneralClassifier
            savedSelections={savedSelections}
            saveSelection={saveSelection}
            filename={filename}
            data={features}
            featureNames={features}
            nextColorIndex={nextColorIndex}
        />
    );
};
