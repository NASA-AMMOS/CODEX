import {
    useSavedSelections,
    useFilename,
    useSelectedFeatureNames,
    useSelectionGroups
} from "hooks/DataHooks";
import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useWindowManager } from "hooks/WindowHooks";
import * as utils from "utils/utils";
import React, { useRef, useState, useEffect } from "react";
import Button from "@material-ui/core/Button";
import Typography from "@material-ui/core/Typography";
import FormControl from "@material-ui/core/FormControl";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import InputLabel from "@material-ui/core/InputLabel";
import CircularProgress from "@material-ui/core/CircularProgress";
import "components/FindMoreLikeThis/FindMoreLikeThis.scss";

/*
    Function that creates the json object for requesting
    the data for the fmlt algorithm. 
*/
function createFMLTRequest(filename, selections, featureList, similarityThreshold) {
    return {
        routine: "workflow",
        dataSelections: selections,
        featureList: featureList,
        sessionkey: utils.getGlobalSessionKey(),
        workflow: "find_more_like_this",
        file: filename,
        similarityThreshold: similarityThreshold,
        cid: "8ksjk",
        identification: { id: "dev0" }
    };
}

function ParameterSection(props) {
    function findSelectionById(id) {
        return props.activeSelections.filter(selection => {
            return selection.id === id;
        })[0];
    }

    return (
        <div className="parameter-section">
            <div className="selection-dropdown-container">
                <InputLabel className="selection-dropdown-label">Input Selection</InputLabel>
                <FormControl className="selection-dropdown">
                    <Select
                        value={props.inputSelection != undefined ? props.inputSelection.id : ""}
                        onChange={e => {
                            props.setInputSelection(findSelectionById(e.target.value));
                        }}
                    >
                        {props.activeSelections.map(selection => {
                            return (
                                <MenuItem key={selection.id} value={selection.id}>
                                    {selection.name}
                                </MenuItem>
                            );
                        })}
                    </Select>
                </FormControl>
            </div>
            <div className="similarity-threshold-container">
                <InputLabel className="similarity-threshold-label">Similarity Threshold</InputLabel>
                <TextField
                    variant="standard"
                    type="number"
                    value={props.similarityThreshold}
                    className="similarity-threshold-input"
                    inputProps={{ min: 0, max: 1, step: 0.1 }}
                    onChange={function(e) {
                        props.setSimilarityThreshold(e.target.value);
                    }}
                />
            </div>
        </div>
    );
}

function OutputSection(props) {
    if (!props.loading && props.outputMessage != null) {
        return (
            <div className="output-section">
                <Typography variant="h5" className="output-section-header">
                    Output
                </Typography>
                <div className="output-section-text">{props.outputMessage}</div>
            </div>
        );
    } else if (props.loading) {
        return (
            <div className="loading-section">
                <CircularProgress />
            </div>
        );
    } else if (props.outputMessage == null) {
        return <div className="loading-section" />;
    }
}

/*
    Parent component of this file that contains all of the ui for 
    the Find More Like This workflow
*/
function FindMoreLikeThis(props) {
    const [buttonClicked, setButtonClicked] = useState(false);
    const [similarityThreshold, setSimilarityThreshold] = useState(0.5);
    const [outputMessage, setOutputMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const activeSelections = props.savedSelections.filter(selection => {
        return selection.active;
    });

    const [inputSelection, setInputSelection] = useState(activeSelections[0]);

    function makeOutputMessage(name) {
        return (
            "Like This selection has been computed and outputted to the selection called '" +
            name +
            "'"
        );
    }

    useEffect(
        _ => {
            //checks to see if the input selection is still active
            if (inputSelection == undefined) {
                if (activeSelections.length > 0) {
                    setInputSelection(activeSelections[0]);
                }
            } else {
                const selectionsWithId = activeSelections.filter(selection => {
                    return selection.id === inputSelection.id;
                });

                if (selectionsWithId.length === 0) {
                    setInputSelection(activeSelections[0]);
                }
            }
        },
        [props.savedSelections]
    );

    useEffect(
        _ => {
            if (buttonClicked) {
                if (inputSelection === undefined) {
                    //send error message
                    return;
                }

                const requestObject = createFMLTRequest(
                    props.filename,
                    inputSelection.rowIndices,
                    props.featureNames,
                    similarityThreshold
                );
                //actually handle the request for running the
                //find more like this algorithm
                setOutputMessage("");
                setLoading(true);
                const request = utils.makeSimpleRequest(requestObject);
                //resolves the fmlt request
                request.req.then(data => {
                    setLoading(false);
                    setOutputMessage(makeOutputMessage("Like " + inputSelection.name));
                    //add a saved selections called fmlt_output with the returned data
                    const groupID = utils.getUniqueGroupID("FMLT");

                    props.createSelectionGroup(groupID);
                    props.saveSelection("Like " + inputSelection.name, data.like_this, groupID);
                    setButtonClicked(false);
                });
                //cleanup function
                return function cleanup() {
                    request.cancel();
                };
            }
        },
        [buttonClicked]
    );

    return (
        <div className="fmlt-container">
            <Typography variant="h5" className="fmlt-header">
                Find More Like This
            </Typography>
            <ParameterSection
                setInputSelection={setInputSelection}
                inputSelection={inputSelection}
                setSimilarityThreshold={setSimilarityThreshold}
                similarityThreshold={similarityThreshold}
                activeSelections={activeSelections}
            />
            <OutputSection loading={loading} outputMessage={outputMessage} />
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
        width: 350,
        height: 400,
        isResizable: false,
        title: "Find More Like This"
    });

    const [savedSelections, saveSelection] = useSavedSelections();
    const filename = useFilename();
    const [selectedFeatureNames, setSelectedFeatureNames] = useSelectedFeatureNames();
    const [selectionGroups, createSelectionGroup] = useSelectionGroups();

    return (
        <FindMoreLikeThis
            savedSelections={savedSelections}
            saveSelection={saveSelection}
            filename={filename}
            featureNames={Array.from(selectedFeatureNames)}
            selectionGroups={selectionGroups}
            createSelectionGroup={createSelectionGroup}
        />
    );
};
