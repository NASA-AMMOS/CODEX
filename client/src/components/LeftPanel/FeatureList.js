import React, { Component, useState, useEffect } from "react";
import "components/LeftPanel/FeatureList.scss";
import { connect } from "react-redux";
import classnames from "classnames";
import { bindActionCreators } from "redux";
import * as dataActions from "actions/data";
import CircularProgress from "@material-ui/core/CircularProgress";
import Checkbox from "@material-ui/core/Checkbox";
import CheckboxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckboxIcon from "@material-ui/icons/CheckBox";
import Popover from "@material-ui/core/Popover";
import Typography from "@material-ui/core/Typography";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import * as utils from "utils/utils";
import WorkerSocket from "worker-loader!workers/socket.worker";
import * as actionFunctions from "actions/actionFunctions";
import { Sparklines, SparklinesLine } from "react-sparklines";
import * as actionTypes from "constants/actionTypes";
import FormControl from "@material-ui/core/FormControl";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Button from '@material-ui/core/Button';
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";

import {
    useFeatureStatistics,
    useFeatureStatisticsLoader,
    useFeatureMetadata
} from "hooks/DataHooks";

/*
    A function used to process a floating point number
*/
function processFloatingPointNumber(number) {
    let roundedNumber = Math.round(number * Math.pow(10, 2)) / Math.pow(10, 2);
    let newNumber = "";
    //see if has decimal
    if ((roundedNumber + "").length > 6) {
        //convert to scientific notation
        newNumber = roundedNumber.toExponential(1);
    } else {
        newNumber = roundedNumber;
    }

    return newNumber;
}

/*
    Function to help reorder an object used to persist the
    order of features
*/
const reorder = (object, startIndex, endIndex) => {
    //shift everything with an index after up one
    function findNameOfIndex(index) {
        for (let name of Object.keys(object)) {
            if (object[name] === index) return name;
        }
    }

    let newObject = { ...object };
    //set the element at startIndex's index to endIndex
    //add one to everything inbetween startIndex and endIndex including startIndex

    const realStartName = findNameOfIndex(startIndex);

    if (endIndex < startIndex) {
        //swapping back the list
        for (let name of Object.keys(newObject)) {
            if (newObject[name] >= endIndex && newObject[name] < startIndex) {
                newObject[name]++;
            }
        }
    } else if (startIndex < endIndex) {
        //swapping forward in the list
        for (let name of Object.keys(newObject)) {
            if (newObject[name] <= endIndex && newObject[name] > startIndex) {
                newObject[name]--;
            }
        }
    }

    newObject[realStartName] = endIndex;

    return newObject;
};

/*
    The section of the header that shows the labels for the
    feature statistics
*/
function StatsLabelRow(props) {
    return (
        <div className="label-row" hidden={props.statsHidden}>
            <span className="classification"> C </span>
            <span className="regression"> R </span>
            <span className="mean"> mean </span>
            <span className="median"> median </span>
            <span className="sparkline"> sparkline </span>
        </div>
    );
}


/*
    The header for the feature list left panel
*/
function FeaturePanelHeader(props) {
    return (
        <div
            className={
                "header " +
                (props.statsHidden ? "stats-hidden-header" : "stats-not-hidden-header")
            }
        >
            <div className="title">Features</div>
            <span
                className="stats-toggle"
                onClick={
                    function() {
                        props.setStatsHidden(!props.statsHidden);
                    }
                }
            >
                {props.statsHidden ? "Stats >" : "< done"}
            </span>
        </div>
    );
}

/*
    Component that holds the dropddown menu showing how many features have been selected. 
*/
function SelectedDropdown(props) {

    const activeCount = props.featureList.filter(f => f.get("selected")).size;
    const totalCount = props.featureList.size;
    const inactive = totalCount - activeCount;

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [lastSelected, setLastSelected] = useState(0);

    const featureFilterFunctions = [
        function(feature) {
            return true;
        },
        function (feature) {
            return feature.selected;
        },
        function (feature) {
            return !feature.selected;
        }
    ]

    return (
        <FormControl className="selected-dropdown">
            <Select
                value={lastSelected}
                onChange={e => {
                    setLastSelected(e.target.value);
                    props.setFeatureFilter({func:featureFilterFunctions[e.target.value]});
                }}
            >
                <MenuItem 
                    key="total"
                    value={0}
                >
                    {"All Columns ("+totalCount+"/"+totalCount+")"}
                </MenuItem>
                <MenuItem 
                    key="selected" 
                    value={1}
                >
                    {"Selected ("+activeCount+"/"+totalCount+")"}
                </MenuItem>
                <MenuItem 
                    key="not_selected" 
                    value={2}
                >
                    {"Not Selected ("+inactive+"/"+totalCount+")"}
                </MenuItem>
            </Select>
            <ArrowDropDownIcon
                color="white"
            />
        </FormControl>
    );
}

/*
    The section of a feature row that displays the feature statistics
    data like mean, median, and sparkline
*/
function StatisticsRow(props) {
    //handles the failure cases of when stats are not yet loaded
    //or there was an actual failure in the backend

    const [loading, failed, stats] = useFeatureStatistics(props.featureName);
    let [featureTypeData, setFeatureTypeData] = useState({ c: false, r: false });

    if (loading) {
        return <div className="feature-statistics-row loading">Loading...</div>;
    } else if (failed) {
        return <div className="feature-statistics-row failed">Failure ...</div>;
    } else if (stats === null) {
        return <div className="feature-statistics-row">Working...</div>;
    }

    let mean = processFloatingPointNumber(stats.get("mean"));
    let median = processFloatingPointNumber(stats.get("median"));
    let downsample = stats.get("downsample");
    if (downsample) {
        downsample = downsample.toJS();
    }

    return (
        <div className="feature-statistics-row">
            <span
                className={(featureTypeData.c ? "lit" : "dim") + " class-regression-span"}
                onClick={function() {
                    setFeatureTypeData({ r: featureTypeData.r, c: !featureTypeData.c });
                }}
            >
                C
            </span>
            <span
                className={(featureTypeData.r ? "lit" : "dim") + " class-regression-span"}
                onClick={function() {
                    setFeatureTypeData({ r: !featureTypeData.r, c: featureTypeData.c });
                }}
            >
                R
            </span>
            <span className="mean-span"> {mean} </span>
            <span className="median-span"> {median} </span>
            <span className="sparkline-span">
                <Sparklines
                    data={downsample}
                    limit={100}
                    style={{ fill: "none", height: "20px", width: "100%" }}
                >
                    <SparklinesLine color={props.rowHover ? "#051426" : "white"} />
                </Sparklines>
            </span>
        </div>
    );
}

/*
    A single row displaying a feature and its corresponding data
    for the drag and drop menu
*/
function FeatureListDNDRow(props) {
    const virtual = props.featureInfo.virtual;
    const selected = props.featureInfo.selected;
    const virtualStyle = { fontStyle: virtual ? "italic" : "normal" };

    const [rowHover, setRowHover] = useState(false);

    return (
        <div
            ref={props.provided.innerRef}
            {...props.provided.draggableProps}
            {...props.provided.dragHandleProps}
            className="featureRow"
            onMouseEnter={function() {
                setRowHover(true);
            }}
            onMouseLeave={function() {
                setRowHover(false);
            }}
        >
            <div className="feature-name-row">
                <Checkbox
                    checked={selected}
                    className="selected-checkbox"
                    value="checkedA"
                    style={{ height: "22px", padding: "0px" }}
                    icon={<CheckboxOutlineBlank style={{ fill: "#828282" }} />}
                    checkedIcon={<CheckboxIcon style={{ fill: "#3988E3" }} />}
                    onClick={function(e) {
                        return selected
                            ? props.featureUnselect(props.featureName, e.shiftKey)
                            : props.featureSelect(props.featureName, e.shiftKey);
                    }}
                />
                <span className="feature-name" style={virtualStyle}>
                    {props.featureName}
                </span>
            </div>
            {props.statsHidden || (
                <StatisticsRow
                    featureName={props.featureName}
                    featureListLoading={props.featureListLoading}
                    rowHover={rowHover}
                />
            )}
        </div>
    );
}

/*
    A component that manages the drag and drop component for the features
    and their corresponding statistics
*/
function FeatureListDND(props) {
    if (Object.keys(props.featureIndices).length == 0 || props.featureIndices == undefined)
        return <div />;

    function onDragEnd(result) {
        if (!result.destination) {
            return;
        }

        let reorderedObject = reorder(
            props.featureIndices,
            result.source.index,
            result.destination.index
        );

        props.setFeatureIndices(reorderedObject);
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable" type="OUTER">
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="drag-drop-div"
                    >
                        {props.featureNames.map(featureName => {
                            if (
                                featureName === undefined ||
                                props.featureIndices[featureName] === undefined
                            ) {
                                return <div key={featureName}> </div>;
                            }
                            return (
                                <Draggable
                                    key={featureName}
                                    draggableId={featureName + ""}
                                    index={props.featureIndices[featureName]}
                                >
                                    {(provided, snapshot) => (
                                        <FeatureListDNDRow
                                            featureName={featureName}
                                            featureInfo={props.featureMapping[featureName]}
                                            stats={props.stats[featureName]}
                                            data={props.data[featureName]}
                                            statsHidden={props.statsHidden}
                                            featureListLoading={props.featureListLoading}
                                            featureUnselect={props.featureUnselect}
                                            featureSelect={props.featureSelect}
                                            provided={provided}
                                        />
                                    )}
                                </Draggable>
                            );
                        })}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    );
}

/*
    Parent component that holds all of the other components and manages the
    data for the features section on the left side panel of the page
*/
function FeatureList(props) {
    const activeCount = props.featureList.filter(f => f.get("selected")).size;
    const shownCount = activeCount;
    const totalCount = props.featureList.size;
    
    const stats = useFeatureStatisticsLoader();
    const features = useFeatureMetadata();
    //manages the hidden state of the statistics panel
    const [statsHidden, setStatsHidden] = useState(true);
    //a map from feature names to their current list indices
    const [featureIndices, setFeatureIndices] = useState({});
    //the holder of feature data for sparklines
    const [featureData, setFeatureData] = useState({});
    //the holder of the stats data
    const [featureStats, setFeatureStats] = useState({});

    const [filterString, setFilterString] = useState("");
    //limit to the number of feature stats to load on page start
    const lazyLimit = 12;
    const [statsLoading, setStatsLoading] = useState(false);
    const [featureFilter, setFeatureFilter] = useState({
        func:function(feature) {return true;}
    });

    //translate featureList into interpretable js list of names
    const featureNames = props.featureList.toJS()
        .filter((feature) => {return featureFilter.func(feature)})
        .map(feature => {
            return feature.name;
        });

    const loadData = (a, b) => {};

    //holds other data about features
    let featureMapping = {};

    props.featureList.toJS().forEach(feature => {
        featureMapping[feature.name] = {
            selected: feature.selected,
            virtual: feature.virtual
        };
    });

    //runs on file change
    //it handles clearing the current data
    //and also starting the loading of the new data up to the lazy limit
    useEffect(
        _ => {
            let newFeatureIndices = {};
            featureNames.forEach((name, index) => {
                newFeatureIndices[name] = index;
            });

            setFeatureIndices(newFeatureIndices);
            setFeatureStats({});
            setFeatureData({});
        },
        [props.filename]
    );

    useEffect(
        _ => {
            let beforeLength = Object.keys(featureIndices).length;
            let newFeatureIndices = { ...featureIndices };

            featureNames
                .filter(name => {
                    return featureIndices[name] == undefined;
                })
                .forEach(name => {
                    newFeatureIndices[name] = beforeLength;
                    beforeLength++;
                });

            setFeatureIndices(newFeatureIndices);
        },
        [features]
    );

    //filters out the feautres based on the filter bar and
    //sorts them by their indices stored in featureIndices
    const sortedFeatureNames = featureNames
        .filter(featureName =>
            props.filterString
                ? featureName.startsWith(props.filterString)
                : true
        )
        .concat() //this is so it operates on a copy of stuff
        .sort((a, b) => {
            const aIndex = featureIndices[a];
            const bIndex = featureIndices[b];
            if (aIndex < bIndex) return -1;
            else if (aIndex > bIndex) return 1;
            else return 0;
        });

    return (
        <div
            className={
                "feature-list-container " + (statsHidden ? "stats-hidden" : "stats-not-hidden")
            }
        >   
            <FeaturePanelHeader
                statsHidden={statsHidden}
                setStatsHidden={setStatsHidden}
                totalCount={totalCount}
                activeCount={activeCount}
                shownCount={shownCount}
            />
            <div className="stats-bar-top">
                <SelectedDropdown
                    featureList={props.featureList}
                    setFeatureFilter={setFeatureFilter}
                />
                <StatsLabelRow statsHidden={statsHidden} />
            </div>
            <div className="features">
                {props.featureListLoading && (
                    <div className="loading-list">
                        <CircularProgress />
                    </div>
                )}
                <div className="list" hidden={props.featureListLoading}>
                    <FeatureListDND
                        featureIndices={featureIndices}
                        setFeatureIndices={setFeatureIndices}
                        data={featureData}
                        stats={featureStats}
                        statsHidden={statsHidden}
                        featureNames={sortedFeatureNames}
                        featureSelect={props.featureSelect}
                        featureUnselect={props.featureUnselect}
                        featureMapping={featureMapping}
                    />
                </div>
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return {
        featureList: state.data.get("featureList"),
        featureListLoading: state.data.get("featureListLoading"),
        filename: state.data.get("filename")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        featureSelect: bindActionCreators(dataActions.featureSelect, dispatch),
        featureUnselect: bindActionCreators(dataActions.featureUnselect, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FeatureList);
