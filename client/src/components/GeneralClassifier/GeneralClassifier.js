import "components/GeneralClassifier/GeneralClassifier.scss";
import React, { useRef, useState, useEffect } from "react";
import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useSavedSelections, useFilename, useSelectedFeatureNames} from "hooks/DataHooks";
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

/*
    Function that returns an array of arrays containing 
    the indices in a given selection
*/
function activeSelectionIndices(savedSelections) {
    return savedSelections
                .filter((selection) => {return selection.active;})
                .map((selection) => {return selection.rowIndices;});
}

/*
    Function that creates the json object for requesting
    the data for the general classifier algorithm. 
*/
function createGCRequest(filename, selections, featureList, similarityThreshold) {
    return {
        routine: "workflow",
        dataSelections: selections,
        featureList: featureList,
        workflow: "general_classifier",
        file: filename,
        similarityThreshold: similarityThreshold,
        cid: "8ksjk",
        identification: { id: "dev0" }
    };
}

/*
    Section of the code that handles taking in parameters from the user
*/
function ParameterSection(props) {

    function findSelectionById(id) {
        return props.activeSelections.filter((selection) => {
            return selection.id === id;
        })[0];
    }

    return (
        <div className="parameter-section">
            <Typography variant="h6">
                Parameter Section
            </Typography>
            <div className="similarity-threshold-container">
                <InputLabel className="similarity-threshold-label">Similarity Threshold</InputLabel>
                <TextField
                    variant="standard" 
                    type="number"
                    value={props.similarityThreshold} 
                    className="similarity-threshold-input"
                    inputProps={{ min: 0, max: 1 , step:0.1}}
                    onChange={function(e) { props.setSimilarityThreshold(e.target.value);}}
                />
            </div>
        </div>
    )
}

function OutputSection(props) {

    if (!props.loading && props.outputMessage != null) {
        return (
            <div className="output-section">
                <Typography variant="h6" className="output-section-header">
                    Output
                </Typography>
                <div className="output-section-text">
                    {props.outputMessage}
                </div>
            </div>
        );
    } else if (props.loading) {
        return (
            <div className="loading-section">
                <CircularProgress/>
            </div>
        );
    } else if (props.outputMessage == null) {
        return (
            <div className="loading-section">
            </div>
        );
    }   
}

function InputSelections(props) {

    return (
        <div className="input-selections">
            <Typography variant="h6">
                Input Selections
            </Typography>
            <div className="input-selections-list">
                {
                    props.activeSelections.map(
                        (selection) => {
                            return (
                                <div key={selection.name} className="input-selection">
                                    {selection.name}
                                </div>
                            );
                        }
                    )
                }
            </div>
        </div>
    );
}

/*
    Parent component of this file that contains all of the ui for 
    the General Classifier workflow
*/
function GeneralClassifier(props) {

    const [buttonClicked, setButtonClicked] = useState(false);
    const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
    const [outputMessage, setOutputMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const activeSelections = props.savedSelections
                                    .filter((selection) => {return selection.active});

    function makeOutputMessage(names) {
        return "General Classifications have been made and outputed as selections under the names: \n"
                + names.map((name) => {return name+"\n"});

    }

    //handler for the run button
    //this function handles calling the create request functions
    //it also does input validation
    useEffect(() => {
        //assume if this runs that button is clicked because that is the 
        //only time the flag changes
        if (buttonClicked) {
            const selectionsIndices = activeSelectionIndices(props.savedSelections);

            const requestObject = createGCRequest(props.filename, selectionsIndices, props.selectedFeatureNames, similarityThreshold);
            
            //makes a gc request
            const request = utils.makeSimpleRequest(requestObject);
            setLoading(true);
            setOutputMessage(null);
            //resolves the gc request
            request.req.then(data => {
                const randomString = (Math.floor(Math.random()*(999-100+1)+100))+"";
                let selectionNames = [];
                for (let i = 0; i < activeSelections.length; i++) {
                    selectionNames.push("GC-"+randomString+" "+activeSelections[i].name);
                }
                //add a saved selections called gc_output with the returned data
                for (var i = 0; i < data.like_this.length; i++) {
                    props.saveSelection(selectionNames[i], data.like_this[i]);
                }
                setOutputMessage(makeOutputMessage(selectionNames))
                setLoading(false);
                setButtonClicked(false);
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
        <div className="gc-container">
            <Typography variant="h5" className="gc-header">
                General Classifier
            </Typography>
            <div className="non-header-container">
                <div className="gc-left-side">
                    <InputSelections
                        activeSelections={activeSelections}
                    />
                </div>
                <div className="gc-right-side">
                    <ParameterSection
                        setSimilarityThreshold={setSimilarityThreshold}
                        similarityThreshold={similarityThreshold}
                        activeSelections={activeSelections}
                    />
                    <OutputSection
                        loading={loading}
                        outputMessage={outputMessage}
                    />
                    <Button
                        variant="contained"
                        color="primary"
                        className="gc-run-button"
                        onClick={_ => setButtonClicked(true)}
                    >
                        Run
                    </Button>
                </div>
            </div>
        </div>
    );
}

// wrapped data selector
export default props => {
    const win = useWindowManager(props, {
        width: 650,
        height: 350,
        resizeable: false,
        title: "General Classifier"
    });

    const [savedSelections, saveSelection] = useSavedSelections();

    const filename = useFilename();
    
    const [selectedFeatureNames, setSelectedFeatureNames] = useSelectedFeatureNames();

    if (selectedFeatureNames === null) {
        return <WindowCircularProgress />;
    }

    if (selectedFeatureNames.size === 0) {
        return <WindowError> Please select at least one feature to use this graph.</WindowError>;
    }

    return (
        <GeneralClassifier
            savedSelections={savedSelections}
            saveSelection={saveSelection}
            filename={filename}
            selectedFeatureNames={selectedFeatureNames}
        />
    );
};