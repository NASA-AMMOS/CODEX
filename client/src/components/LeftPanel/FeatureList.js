import "./FeatureList.scss";

import { CircularProgress } from "@material-ui/core";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { Sparklines, SparklinesLine } from "react-sparklines";
import ArrowDropDownIcon from "@material-ui/icons/ArrowDropDown";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import CheckboxIcon from "@material-ui/icons/CheckBox";
import CheckboxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import FormControl from "@material-ui/core/FormControl";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import MenuItem from "@material-ui/core/MenuItem";
import Popover from "@material-ui/core/Popover";
import React, { useState, useEffect, useContext } from "react";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";

import classnames from "classnames";

import { reorderList, addNewItem } from "../../utils/utils";
import { useAllowGraphHotkeys, useStatsPanelHidden } from "../../hooks/UIHooks";
import {
    useChangeFeatureGroup,
    useDeleteFeatureGroup,
    useFeatureDelete,
    useFeatureDisplayNames,
    useFeatureGroups,
    useFeatureListLoading,
    useFeatureMetadata,
    useFeatureStatistics,
    useFeatureStatisticsLoader,
    useRenameFeatureGroup,
    useSelectFeatureGroup,
    useSetFeatureSelect
} from "../../hooks/DataHooks";
import { useWindowList } from "../../hooks/WindowHooks";
import featureList from "./FeatureList";

const FeatureListContext = React.createContext({});

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
    The section of the header that shows the labels for the
    feature statistics
*/
function StatsLabelRow(props) {
    return (
        <div className="label-row" hidden={props.statsHidden}>
            <span className="label-field"> mean </span>
            <span className="label-field"> median </span>
            <span className="label-field"> min </span>
            <span className="label-field"> max </span>
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
                "header " + (props.statsHidden ? "stats-hidden-header" : "stats-not-hidden-header")
            }
        >
            <div className="title">Features</div>
            <span
                className="stats-toggle"
                onClick={function() {
                    props.setStatsHidden(!props.statsHidden);
                }}
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

    // Count features currently in use by windows
    const windowList = useWindowList();
    const featuresInUseCount = windowList.reduce((acc, win) => {
        win.getIn(["data", "features"], []).forEach(feature => acc.add(feature));
        return acc;
    }, new Set()).size;

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [lastSelected, setLastSelected] = useState(0);

    const featureFilterFunctions = [
        function(feature) {
            return true;
        },
        function(feature) {
            return feature.selected;
        },
        function(feature) {
            return !feature.selected;
        },
        feature => {
            return windowList.some(win => win.getIn(["data", "features"]).contains(feature.name));
        }
    ];

    return (
        <FormControl className="selected-dropdown">
            <Select
                value={lastSelected}
                onChange={e => {
                    setLastSelected(e.target.value);
                    props.setFeatureFilter({ func: featureFilterFunctions[e.target.value] });
                }}
            >
                <MenuItem key="total" value={0}>
                    {"All Columns (" + totalCount + "/" + totalCount + ")"}
                </MenuItem>
                <MenuItem key="selected" value={1}>
                    {"Selected (" + activeCount + "/" + totalCount + ")"}
                </MenuItem>
                <MenuItem key="not_selected" value={2}>
                    {"Not Selected (" + inactive + "/" + totalCount + ")"}
                </MenuItem>{" "}
                <MenuItem key="not_selected" value={3}>
                    {`Displayed in Graphs (${featuresInUseCount}/${totalCount})`}
                </MenuItem>
            </Select>
            <ArrowDropDownIcon color="white" />
        </FormControl>
    );
}

/*
    The section of a feature row that displays the feature statistics
    data like mean, median, and sparkline
*/
function StatisticsRow(props) {
    const [loading, failed, stats] = useFeatureStatistics(props.feature.name);
    let [featureTypeData, setFeatureTypeData] = useState({ c: false, r: false });

    if (loading) {
        return <div className="feature-statistics-row loading">Loading...</div>;
    } else if (failed) {
        return <div className="feature-statistics-row failed">Failure ...</div>;
    } else if (stats === null) {
        return <div className="feature-statistics-row">Working...</div>;
    }

    const min = processFloatingPointNumber(stats.get("min"));
    const max = processFloatingPointNumber(stats.get("max"));
    let mean = processFloatingPointNumber(stats.get("mean"));
    let median = processFloatingPointNumber(stats.get("median"));
    let downsample = stats.get("downsample");
    if (downsample) {
        downsample = downsample.toJS();
    }

    return (
        <div className="feature-statistics-row">
            <span className="label-field"> {mean} </span>
            <span className="label-field"> {median} </span>
            <span className="label-field"> {min} </span>
            <span className="label-field"> {max} </span>
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

function FeatureContextMenu(props) {
    const [contextMode, setContextMode] = useState(null);
    const [renameSelectionBuffer, setRenameSelectionBuffer] = useState("");
    const featureDelete = useFeatureDelete();

    const [featureNames, setFeatureName] = useFeatureDisplayNames();
    const displayName = featureNames.get(props.featureName, props.featureName);

    const [_, createNewFeatureGroup] = useFeatureGroups();

    function submitRenamedFeature(e) {
        if (!e.key || (e.key && e.key === "Enter")) {
            props.setContextMenuVisible(false);
            setContextMode(null);
            setFeatureName(props.featureName, renameSelectionBuffer);
        }
    }

    function submitNewFeatureGroup() {
        createNewFeatureGroup("New Group", [props.featureName]);
        props.setContextMenuVisible(false);
    }

    // To make sure the autofocus works, don't create the rename text field until we need it.
    const renameTextField =
        contextMode === "rename" ? (
            <TextField
                value={renameSelectionBuffer}
                onChange={e => setRenameSelectionBuffer(e.target.value)}
                onKeyPress={submitRenamedFeature}
                autoFocus
            />
        ) : null;

    return (
        <ClickAwayListener onClickAway={_ => props.setContextMenuVisible(false)}>
            <List>
                <ListItem
                    button
                    onClick={_ => {
                        props.setContextMenuVisible(false);
                        featureDelete(props.featureName);
                    }}
                    hidden={contextMode}
                >
                    Delete Feature
                </ListItem>
                <ListItem hidden={contextMode !== "rename"}>
                    {renameTextField}
                    <Button
                        variant="outlined"
                        style={{ marginLeft: "10px" }}
                        onClick={submitRenamedFeature}
                    >
                        Rename
                    </Button>
                </ListItem>
                <ListItem
                    button
                    onClick={_ => {
                        setContextMode("rename");
                        setRenameSelectionBuffer(displayName);
                    }}
                    hidden={contextMode}
                >
                    Rename Feature
                </ListItem>
                <ListItem button onClick={submitNewFeatureGroup} hidden={contextMode}>
                    Create New Feature Group
                </ListItem>
            </List>
        </ClickAwayListener>
    );
}

function GroupContextMenu(props) {
    const [contextMode, setContextMode] = useState(null);

    const [renameGroupBuffer, setRenameGroupBuffer] = useState(props.group.name);
    const deleteFeatureGroup = useDeleteFeatureGroup();
    const renameFeatureGroup = useRenameFeatureGroup();

    function clickDeleteGroup() {
        props.setContextMenuVisible(false);
        deleteFeatureGroup(props.group.id);
    }

    function submitRenamedGroup(e) {
        props.setContextMenuVisible(false);
        renameFeatureGroup(props.group.id, renameGroupBuffer);
    }

    const renameTextField =
        contextMode === "rename" ? (
            <TextField
                value={renameGroupBuffer}
                onChange={e => setRenameGroupBuffer(e.target.value)}
                onKeyPress={e => {
                    if (e.key && e.key === "Enter") submitRenamedGroup();
                }}
                autoFocus
            />
        ) : null;

    return (
        <ClickAwayListener onClickAway={_ => props.setContextMenuVisible(false)}>
            <List>
                <ListItem button onClick={clickDeleteGroup} hidden={contextMode}>
                    Delete
                </ListItem>
                <ListItem hidden={contextMode !== "rename"}>
                    {renameTextField}
                    <Button
                        variant="outlined"
                        style={{ marginLeft: "10px" }}
                        onClick={submitRenamedGroup}
                    >
                        Rename
                    </Button>
                </ListItem>
                <ListItem
                    button
                    onClick={_ => {
                        setContextMode("rename");
                    }}
                    hidden={contextMode}
                >
                    Rename
                </ListItem>
            </List>
        </ClickAwayListener>
    );
}

function FeatureGroup(props) {
    const featureListContext = useContext(FeatureListContext);
    const selectGroup = useSelectFeatureGroup();
    const [_, setAllowGraphHotkeys] = useAllowGraphHotkeys();

    function groupSelectClick(e) {
        selectGroup(props.group.id, e.target.checked);
        setAllowGraphHotkeys(true);
    }

    const [anchorEl, setAnchorEl] = useState();
    function onContextMenu(e) {
        e.preventDefault();
        setAnchorEl(e.currentTarget);
    }

    const [panelExpanded, setPanelExpanded] = useState(true);
    const iconClasses = classnames({ ["expand-icon"]: true, expanded: panelExpanded });
    return (
        <Droppable droppableId={props.group.id}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="selection-group"
                >
                    <button className={iconClasses} onClick={_ => setPanelExpanded(!panelExpanded)}>
                        <KeyboardArrowRightIcon />
                    </button>
                    <Checkbox
                        checked={Boolean(props.group.selected)}
                        className="selected-checkbox"
                        value="checkedA"
                        style={{ height: "22px", padding: "0px" }}
                        icon={<CheckboxOutlineBlank style={{ fill: "#828282" }} />}
                        checkedIcon={<CheckboxIcon style={{ fill: "#3988E3" }} />}
                        onClick={groupSelectClick}
                    />
                    <label onContextMenu={onContextMenu}>{props.group.name}</label>
                    {panelExpanded ? (
                        <div className="selection-group-items">
                            {props.group.features
                                .filter(feature => featureListContext.featureFilter.func(feature))
                                .filter(featureListContext.searchStringFilter)
                                .map((feature, idx) => (
                                    <FeatureItem key={feature.name} feature={feature} idx={idx} />
                                ))}
                        </div>
                    ) : null}
                    <Popover
                        id="simple-popper"
                        open={Boolean(anchorEl)}
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left"
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "left"
                        }}
                    >
                        <GroupContextMenu group={props.group} setContextMenuVisible={setAnchorEl} />
                    </Popover>
                    {provided.placeholder}
                </div>
            )}
        </Droppable>
    );
}

function FeatureItem(props) {
    const selectFeature = useSetFeatureSelect();
    const [featureListLoading] = useFeatureListLoading();

    const [featureNames, setFeatureName] = useFeatureDisplayNames();
    const displayName = featureNames.get(props.feature.name, props.feature.name);
    const [rowHover, setRowHover] = useState(false);
    const [_, setAllowGraphHotkeys] = useAllowGraphHotkeys();

    const featureListContext = useContext(FeatureListContext);

    function getShiftSelectedFeatures() {
        const range = [
            featureListContext.baseIndex.findIndex(
                feature => feature.name === featureListContext.lastSelected[0]
            ),
            featureListContext.baseIndex.findIndex(feature => feature.name == props.feature.name)
        ];

        return featureListContext.baseIndex.reduce((acc, feature, idx) => {
            if (idx >= Math.min(...range) && idx <= Math.max(...range)) acc.push(feature.name);
            return acc;
        }, []);
    }

    function onSelectClick(e) {
        featureListContext.lastSelected[1](e.target.checked ? props.feature.name : null);
        const featuresToSelect =
            e.shiftKey && featureListContext.lastSelected[0]
                ? getShiftSelectedFeatures()
                : [props.feature.name];
        featuresToSelect.forEach(feature => selectFeature(feature, e.target.checked));
        setAllowGraphHotkeys(true);
    }

    const [anchorEl, setAnchorEl] = useState();
    function onContextMenu(e) {
        e.preventDefault();
        setAnchorEl(e.currentTarget);
    }

    return (
        <Draggable draggableId={props.feature.name} index={props.idx}>
            {provided => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <div
                        className="featureRow"
                        onContextMenu={onContextMenu}
                        onMouseEnter={_ => setRowHover(true)}
                        onMouseLeave={_ => setRowHover(false)}
                    >
                        <div className="feature-name-row">
                            <Checkbox
                                checked={props.feature.selected}
                                className="selected-checkbox"
                                value="checkedA"
                                style={{ height: "22px", padding: "0px" }}
                                icon={<CheckboxOutlineBlank style={{ fill: "#828282" }} />}
                                checkedIcon={<CheckboxIcon style={{ fill: "#3988E3" }} />}
                                onClick={onSelectClick}
                            />
                            <span className="feature-name">{displayName}</span>
                        </div>
                        {featureListContext.statsHidden ? null : (
                            <StatisticsRow
                                feature={props.feature}
                                featureListLoading={featureListLoading}
                                rowHover={rowHover}
                            />
                        )}
                    </div>
                    <Popover
                        id="simple-popper"
                        open={Boolean(anchorEl)}
                        anchorEl={anchorEl}
                        anchorOrigin={{
                            vertical: "bottom",
                            horizontal: "left"
                        }}
                        transformOrigin={{
                            vertical: "top",
                            horizontal: "left"
                        }}
                    >
                        <FeatureContextMenu
                            featureName={props.feature.name}
                            setContextMenuVisible={setAnchorEl}
                        />
                    </Popover>
                </div>
            )}
        </Draggable>
    );
}

/*
    Parent component that holds all of the other components and manages the
    data for the features section on the left side panel of the page
*/
function FeatureList(props) {
    const featureList = useFeatureMetadata();
    const activeCount = featureList.filter(f => f.get("selected")).size;
    const shownCount = activeCount;
    const totalCount = featureList.size;
    const selectFeature = useSetFeatureSelect();

    const stats = useFeatureStatisticsLoader();
    const selectFeatureGroup = useSelectFeatureGroup();

    const [featureListLoading] = useFeatureListLoading();

    const [groups] = useFeatureGroups();
    const changeFeatureGroup = useChangeFeatureGroup();

    const [featureFilter, setFeatureFilter] = useState({
        func: function(feature) {
            return true;
        }
    });

    // Text filter stuff
    const caseSensitive = Boolean(props.filterString && props.filterString.match(/[A-Z]/g));
    const exactMatch = props.filterString.match(/^"(.*)"$/); // Allows users to specify an exact match with quotes.
    function searchStringFilter(feature) {
        if (!props.filterString) return true;
        return exactMatch
            ? feature.name === exactMatch[1]
            : (caseSensitive ? feature.name : feature.name.toLowerCase()).includes(
                  props.filterString
              );
    }

    // Organization and ordering of features and feature groups
    const [ungroupedFeatures, setUngroupedFeatures] = useState(_ => featureList.toJS());
    const [groupedFeatures, setGroupedFeatures] = useState([]);
    useEffect(
        _ => {
            const ungrouped = featureList.filter(feature =>
                groups.every(group =>
                    group.get("featureIDs").every(id => id !== feature.get("name"))
                )
            );
            setUngroupedFeatures(
                ungroupedFeatures
                    .filter(feature => ungrouped.find(x => x.get("name") === feature.name))
                    .map(feature => featureList.find(x => x.get("name") === feature.name).toJS())
                    .concat(
                        ungrouped
                            .filter(
                                feature =>
                                    !ungroupedFeatures.find(x => x.name === feature.get("name"))
                            )
                            .toJS()
                    )
            );
            setGroupedFeatures(
                groups
                    .map(group => {
                        const oldGroup = groupedFeatures.find(g => g.id === group.get("id"));
                        const newGroup = group.toJS();
                        const previousGroupFeatures = oldGroup ? oldGroup.features : [];
                        const currentGroupFeatures = newGroup.featureIDs.map(id =>
                            featureList.toJS().find(feature => feature.name === id)
                        );
                        const newFeatureOrder = previousGroupFeatures
                            .filter(feature =>
                                currentGroupFeatures.find(x => x.name === feature.name)
                            )
                            .map(feature =>
                                featureList.find(x => x.get("name") === feature.name).toJS()
                            )
                            .concat(
                                currentGroupFeatures.filter(
                                    feature =>
                                        !previousGroupFeatures.find(x => x.name === feature.name)
                                )
                            );
                        return Object.assign(group.toJS(), { features: newFeatureOrder });
                    })
                    .toJS()
            );
        },
        [featureList, groups]
    );

    // Mass-selection functions
    function deselectAll() {
        featureList.forEach(feature => selectFeature(feature.get("name"), false));
        groups.forEach(group => selectFeatureGroup(group.get("id"), false));
    }

    function selectAll() {
        ungroupedFeatures
            .filter(feature => featureFilter.func(feature))
            .filter(searchStringFilter)
            .forEach(feature => selectFeature(feature.name, true));
        groupedFeatures.forEach(group =>
            group.features
                .filter(feature => featureFilter.func(feature))
                .filter(searchStringFilter)
                .forEach(feature => selectFeature(feature.name, true))
        );
    }

    // Stuff for shift-selection
    const lastSelected = useState();
    const baseIndex = ungroupedFeatures.concat(
        groupedFeatures
            .map(group =>
                group.featureIDs.map(feature =>
                    featureList.find(x => x.get("name") === feature).toJS()
                )
            )
            .flat()
    );

    function onDragEnd(e) {
        lastSelected[1](null);
        if (!e.source.droppableId && !e.destination.droppableId) return;
        if (e.source.droppableId === e.destination.droppableId) {
            if (e.destination.droppableId === "ungroupedFeatures") {
                return setUngroupedFeatures(ungroupedFeatures =>
                    reorderList(ungroupedFeatures, e.source.index, e.destination.index)
                );
            }
            return setGroupedFeatures(orderedGroups =>
                orderedGroups.map(group =>
                    group.id === e.destination.droppableId
                        ? Object.assign(group, {
                              features: reorderList(
                                  group.features,
                                  e.source.index,
                                  e.destination.index
                              )
                          })
                        : group
                )
            );
        }

        if (e.source.droppableId !== e.destination.droppableId) {
            const item = featureList.find(feature => feature.get("name") === e.draggableId).toJS();

            // This effect smooths out the animation by updating our local state before the global one is updated
            if (e.destination.droppableId === "ungroupedFeatures") {
                setUngroupedFeatures(ungroupedFeatures =>
                    addNewItem(ungroupedFeatures, item, e.destination.index)
                );
            } else {
                setGroupedFeatures(orderedGroups =>
                    orderedGroups.map(group =>
                        group.id === e.destination.droppableId
                            ? Object.assign(group, {
                                  features: addNewItem(group.features, item, e.destination.index)
                              })
                            : group
                    )
                );
            }

            changeFeatureGroup(
                e.draggableId,
                e.destination.droppableId === "ungroupedFeatures" ? null : e.destination.droppableId
            );
        }
    }

    const [statsHidden, setStatsHidden] = useStatsPanelHidden();
    const containerClasses = classnames({
        ["feature-list-container"]: true,
        ["stats-hidden"]: statsHidden,
        ["stats-not-hidden"]: !statsHidden
    });
    return (
        <div className={containerClasses}>
            <FeatureListContext.Provider
                value={{
                    baseIndex,
                    lastSelected,
                    featureFilter,
                    statsHidden,
                    searchStringFilter
                }}
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
                        featureList={featureList}
                        setFeatureFilter={setFeatureFilter}
                    />
                    <StatsLabelRow statsHidden={statsHidden} />
                </div>
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="features">
                        <div className="select-buttons">
                            <Button
                                classes={{ label: "deselect-button-label" }}
                                onClick={selectAll}
                            >
                                select all
                            </Button>
                            <Button
                                classes={{ label: "deselect-button-label" }}
                                onClick={deselectAll}
                            >
                                deselect all
                            </Button>
                        </div>
                        {featureListLoading && (
                            <div className="loading-list">
                                <CircularProgress />
                            </div>
                        )}
                        <Droppable droppableId="ungroupedFeatures">
                            {(provided, snapshot) => (
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    className="list"
                                >
                                    {ungroupedFeatures
                                        .filter(feature => featureFilter.func(feature))
                                        .filter(searchStringFilter)
                                        .map((feature, idx) => (
                                            <FeatureItem
                                                feature={feature}
                                                key={feature.name}
                                                idx={idx}
                                            />
                                        ))}
                                    {!ungroupedFeatures.length && featureList.size ? (
                                        <span>No ungrouped features</span>
                                    ) : null}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                        <hr className="feature-list-divider" />
                        {groupedFeatures.map(group => (
                            <FeatureGroup key={group.name} group={group} />
                        ))}
                    </div>
                </DragDropContext>
            </FeatureListContext.Provider>
        </div>
    );
}

export default FeatureList;
