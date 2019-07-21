import React, { Component, useState, useEffect } from "react";
import "components/LeftPanel/SelectionList.scss";
import { connect } from "react-redux";
import classnames from "classnames";
import { bindActionCreators } from "redux";
import * as dataActions from "actions/data";
import * as selectionActions from "actions/selectionActions";
import Popover from "@material-ui/core/Popover";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import TextField from "@material-ui/core/TextField";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import CheckboxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import KeyboardArrowDown from "@material-ui/icons/KeyboardArrowDown";
import KeyboardArrowUp from "@material-ui/icons/KeyboardArrowUp";
import RemoveRedEye from "@material-ui/icons/RemoveRedEye";
import CheckboxIcon from "@material-ui/icons/CheckBox";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function SelectionContextMenu(props) {
    const [contextMode, setContextMode] = useState(null);

    const [renameSelectionBuffer, setRenameSelectionBuffer] = useState("");

    function submitRenamedSelection(e) {
        if (!e.key || (e.key && e.key === "Enter")) {
            props.setContextMenuVisible(false);
            setContextMode(null);
            props.setContextActiveSelection(null);
            props.renameSelection(props.contextActiveSelection.id, renameSelectionBuffer);
        }
    }

    return (
        <List>
            <ListItem
                button
                onClick={_ => {
                    setContextMode("rename");
                    setRenameSelectionBuffer(props.contextActiveSelection.displayName);
                }}
                hidden={contextMode}
            >
                Rename Selection
            </ListItem>
            <ListItem
                button
                onClick={_ => {
                    props.setContextMenuVisible(false);
                    props.deleteSelection(props.contextActiveSelection.id);
                    props.setContextActiveSelection(null);
                }}
                hidden={contextMode}
            >
                Delete Selection
            </ListItem>
            <ListItem hidden={contextMode !== "rename"}>
                <TextField
                    value={renameSelectionBuffer}
                    onChange={e => setRenameSelectionBuffer(e.target.value)}
                    onKeyPress={submitRenamedSelection}
                />
                <Button
                    variant="outlined"
                    style={{ marginLeft: "10px" }}
                    onClick={submitRenamedSelection}
                >
                    Rename
                </Button>
            </ListItem>
        </List>
    );
}

function GroupDisplayItem(props) {

    return (
        <div
            className="group-display-item"
        >
            <Checkbox
                checked={props.active}
                value="checkedA"
                icon={<CheckboxOutlineBlank style={{fill: "#828282"}} />}
                checkedIcon={<CheckboxIcon style={{ fill:"#3988E3"}} />}
                onClick={
                    _ => {
                        props.toggleGroupActive();
                    }
                }
                style={{height:"22px",  padding:"0px"}}
            />
            <div className="group-display-name-tag"><span> {props.name} </span></div>
            <Checkbox
                className="eye-icon-checkbox"
                checked={props.hidden}
                value="checkedA"
                icon={<RemoveRedEye style={{fill: "#DADADA"}} />}
                checkedIcon={<RemoveRedEye style={{ fill:"#061427"}} />}
                onClick={_ => {
                    props.toggleGroupHidden();
                    }
                }
                style={{height:"22px", padding:"0px"}}
            />
            <Checkbox
                className="keyboard-toggle"
                checked={!props.expanded}
                value="checkedA"
                icon={<KeyboardArrowDown className="keyboard-arrow"/>}
                checkedIcon={<KeyboardArrowUp className="keyboard-arrow"/> }
                onClick={_ => {
                        props.setGroupExpanded(!props.groupExpanded)
                    }
                }
                style={{height:"22px", padding:"0px"}}
            />
        </div>
    );
}

function SelectionDisplayItem(props){
    return (
        <div
            className="selection"
            key={
                props.selection.id +
                Math.random()
                    .toString(36)
                    .substring(7)
            }
            onContextMenu={e => {
                e.preventDefault();
                props.setContextMenuVisible(true);
                props.setContextMenuPosition({ top: e.clientY, left: e.clientX });
                props.setContextActiveSelection({
                    id: props.selection.id,
                    name: props.selection.name
                });
            }}
            onMouseEnter={_ => props.hoverSelection(props.selection.id)}
            onMouseLeave={_ => props.hoverSelection(null)}
        >
            <Checkbox
                checked={props.selection.active}
                value="checkedA"
                icon={<CheckboxOutlineBlank style={{ fill: "#828282" }} />}
                checkedIcon={<CheckboxIcon style={{ fill: "#3988E3" }} />}
                onClick={_ => {
                    props.toggleSelectionActive(props.selection.id);
                }}
                style={{ height: "22px", padding: "0px" }}
            />
            <div className="selection-name-tag">
                <span> {props.selection.name} </span>
            </div>
            <Checkbox
                className="eye-icon-checkbox"
                checked={props.selection.hidden}
                value="checkedA"
                icon={<RemoveRedEye style={{ fill: "#DADADA" }} />}
                checkedIcon={<RemoveRedEye style={{ fill: "#061427" }} />}
                onClick={_ => {
                    props.toggleSelectionHidden(props.selection.id);
                }}
                style={{ height: "22px", padding: "0px" }}
            />
            <div className="swatch" style={{ background: props.selection.color }} />
        </div>
    );
}

function CurrentSelection(props) {
    //checks to see if current selection is null
    const disabled = props.currentSelection.length == 0;

    return (
        <Button
            key={"currentSelection"}
            classes={{ disabled: "disabled", label: "label" }}
            variant="contained"
            disabled={disabled}
            className="current-selection-button"
            onMouseEnter={_ => props.hoverSelection("current_selection")}
            onMouseLeave={_ => props.hoverSelection(null)}
            onClick={() => {
                props.saveCurrentSelection();
                props.setCurrentSelection([]);
            }}
        >
            Save Selection
        </Button>
    );
}

const reorder = (list, startIndex, endIndex) => {
    //shift everything with an index after up one

    function findElementWithIndex(index) {
        for (let i = 0; i < list.length; i++) {
            if (list[i].index === index)
                return i;
        }
    }
    //set the element at startIndex's index to endIndex
    //add one to everything inbetween startIndex and endIndex including startIndex

    const realStartIndex = findElementWithIndex(startIndex);

    if (endIndex < startIndex) {
        //swapping back the list
        for (let selection of list) {
            if (selection.index >= endIndex && selection.index < startIndex) {
                selection.index++;
            }
        }
    } else if (startIndex < endIndex) {
        //swapping forward in the list
        for (let selection of list) {
            if (selection.index <= endIndex && selection.index > startIndex) {
                selection.index--;
            }
        }
    }

    list[realStartIndex].index = endIndex;

    return list;
};

function SelectionGroup(props) {

    const [groupExpanded, setGroupExpanded] = useState(true);

    return (
        <Draggable 
            key={props.groupKey} 
            draggableId={props.groupKey+""} 
            index={props.index}
        >
            {(provided, snapshot) => (
                <div 
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                >
                    <Droppable droppableId={props.groupKey} type={props.groupKey}>
                        {(provided, snapshot) => (
                            <div
                                className="group-container"
                                ref={provided.innerRef}
                            >
                                <GroupDisplayItem
                                    name={props.groupKey}
                                    hidden={props.group.hidden}
                                    active={props.group.active}
                                    toggleGroupActive={props.toggleGroupActive}
                                    toggleGroupHidden={props.toggleGroupHidden}
                                    setGroupExpanded={setGroupExpanded}
                                    groupExpanded={groupExpanded}
                                />
                                <div
                                    className="selection-group-sub-selections"
                                    hidden={!groupExpanded}
                                >
                                    {
                                        props.group.map((selection, index) => {
                                            return (
                                                <Draggable key={selection.id} draggableId={selection.id+""} index={index}>  
                                                    {(provided, snapshot) => (
                                                        <div 
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                        >  
                                                            <SelectionDisplayItem
                                                                hoverSelection={props.hoverSelection}     
                                                                selection={selection.value}
                                                                toggleSelectionActive={props.toggleSelectionActive}
                                                                toggleSelectionHidden={props.toggleSelectionHidden}
                                                                setContextMenuVisible={props.setContextMenuVisible}
                                                                setContextMenuPosition={props.setContextMenuPosition}
                                                                setContextActiveSelection={props.setContextActiveSelection}
                                                            />
                                                        </div>
                                                    )}
                                                </Draggable>
                                            );
                                        })
                                    }
                                </div>
                                {provided.placeholder}
                            </div>
                        )}
                  </Droppable>
                </div>
            )}
        </Draggable>
    );
    
}

const generateSelectionsGroupList = (savedSelections, selectionGroups, group) => {

    let list = []

    function getValuesOfGroup(groupID) {
        let values = [];
        for (let selection of savedSelections) {
            if (selection.groupID === groupID)
                values.push(selection);
        }
        return values;
    }

    function getGroupObjectById(groupID) {
        for (let group of selectionGroups) {
            if (groupID === group.id)
                return group;
        }
    }

    let usedGroups = [];

    for (let i = 0; i < savedSelections.length; i++) {
        const selection = savedSelections[i];
        if (selection.groupID == null || selection.groupID == undefined || group) {
            list.push(
                {
                    type:"selection",
                    id: selection.id,
                    value:selection,
                    index: list.length
                }
            );
        } else if(usedGroups.indexOf(selection.groupID) == -1){
            const groupObject = getGroupObjectById(selection.groupID);
            list.push(
                {
                    type:"group",
                    id: selection.groupID,
                    hidden: groupObject.hidden,
                    active: groupObject.active,
                    value: generateSelectionsGroupList(getValuesOfGroup(selection.groupID), selectionGroups, true),
                    index: list.length
                }
            );
            usedGroups.push(selection.groupID);
        }
    }

    return list;
};

const grid = 8;

function DragList(props) {
    /*
        This creates a list of objects with type "selection" or "group"
        This is how the information for ordering and such is retained
        in the selection panel.
    */
    const [selectionsGroupList, setSelectionsGroupList] = useState([]);

    //detects changes to the group sand saved selections and updates selectionsGroupList
    useEffect(_ => {

        function keepOldIndices(oldList, newListUncopied) {
            let newList = JSON.parse(JSON.stringify(newListUncopied));

            for (let i = 0; i < newList.length; i++) {
                if (i < oldList.length) {
                    newList[i].index = oldList[i].index;
                    if (newList[i].type === "group") {
                        newList[i].value = keepOldIndices(oldList[i].value, newList[i].value);
                    }
                }
            }

            return newList;
        }
        const newGenerated = generateSelectionsGroupList(props.savedSelections, props.selectionGroups, false);
        const newSelectionsGroupList = keepOldIndices(selectionsGroupList, newGenerated);
        setSelectionsGroupList(newSelectionsGroupList);
    }, [props.savedSelections, props.selectionGroups]);

    function onDragEnd(result){
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        const outputList =  reorder(
            selectionsGroupList,
            result.source.index,
            result.destination.index
        );

        setSelectionsGroupList(outputList);
    }   

    return (
        <div className="list">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="droppable" type="OUTER">
                  {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="drag-drop-div"
                    >
                        {
                            selectionsGroupList
                                .concat()//this is so it does not mutate the original list
                                .sort((a,b) => { 
                                    if ( a.index < b.index)
                                        return -1;
                                    else if (a.index > b.index)
                                        return 1;
                                    else 
                                        return 0;
                                })
                                .map((item, index) => {
                                if (item.type === "selection") {
                                    return (
                                         <Draggable key={item.id} draggableId={item.id+""} index={index}>
                                            {(provided, snapshot) => (
                                                <div 
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                >
                                                    <SelectionDisplayItem
                                                        hoverSelection={props.hoverSelection}     
                                                        selection={item.value}
                                                        toggleSelectionActive={props.toggleSelectionActive}
                                                        toggleSelectionHidden={props.toggleSelectionHidden}
                                                        setContextMenuVisible={props.setContextMenuVisible}
                                                        setContextMenuPosition={props.setContextMenuPosition}
                                                        setContextActiveSelection={props.setContextActiveSelection}
                                                    />
                                                </div>
                                            )}
                                        </Draggable>
                                    );
                                } else if (item.type === "group") {
                                    return (
                                        <SelectionGroup
                                            hoverSelection={props.hoverSelection}
                                            toggleSelectionActive={props.toggleSelectionActive}
                                            toggleSelectionHidden={props.toggleSelectionHidden}
                                            setContextMenuVisible={props.setContextMenuVisible}
                                            setContextMenuPosition={props.setContextMenuPosition}
                                            setContextActiveSelection={props.setContextActiveSelection}
                                            toggleGroupActive={function(){props.toggleGroupActive(item.id)}}
                                            toggleGroupHidden={function(){props.toggleGroupHidden(item.id)}}
                                            key={item.id}
                                            groupKey={item.id}
                                            group={item.value}
                                            index={index}
                                        />
                                    );
                                }
                            })
                        }
                        {provided.placeholder}
                    </div>
                  )}
                </Droppable>
            </DragDropContext>
            <CurrentSelection
                saveCurrentSelection={props.saveCurrentSelection}
                setCurrentSelection={props.setCurrentSelection}
                hoverSelection={props.hoverSelection}
                currentSelection={props.currentSelection}
            />
        </div>
    );
}

function SelectionList(props) {
    const activeCount = props.savedSelections.filter(sel => sel.active).length;
    const shownCount = activeCount;
    const totalCount = props.savedSelections.length;

    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });

    const [contextActiveSelection, setContextActiveSelection] = useState(null);

    return (
        <React.Fragment>
            <div className="selections">
                <div className="header">
                    <div className="title">Selections</div>
                    <span className="counts">
                        {activeCount}/{shownCount}/{totalCount}
                    </span>
                </div>
                <DragList
                    {...props}
                    setContextMenuVisible={setContextMenuVisible}
                    setContextMenuPosition={setContextMenuPosition}
                    setContextActiveSelection={setContextActiveSelection}
                />
            </div>
            <Popover
                id="simple-popper"
                open={contextMenuVisible}
                anchorReference="anchorPosition"
                anchorPosition={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left"
                }}
            >
                <ClickAwayListener onClickAway={_ => setContextMenuVisible(false)}>
                    <SelectionContextMenu
                        deleteSelection={props.deleteSelection}
                        setContextMenuVisible={setContextMenuVisible}
                        contextActiveSelection={contextActiveSelection}
                        setContextActiveSelection={setContextActiveSelection}
                        setContextMenuPosition={setContextMenuPosition}
                    />
                </ClickAwayListener>
            </Popover>
        </React.Fragment>
    );
}

function mapStateToProps(state) {
    return {
        savedSelections: state.selections.savedSelections,
        currentSelection: state.selections.currentSelection,
        selectionGroups: state.selections.groups,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleSelectionActive: bindActionCreators(selectionActions.toggleSelectionActive, dispatch),
        toggleSelectionHidden: bindActionCreators(selectionActions.toggleSelectionHidden, dispatch),
        toggleGroupActive: bindActionCreators(selectionActions.toggleGroupActive, dispatch),
        toggleGroupHidden: bindActionCreators(selectionActions.toggleGroupHidden, dispatch),
        deleteSelection: bindActionCreators(selectionActions.deleteSelection, dispatch),
        renameSelection: bindActionCreators(selectionActions.renameSelection, dispatch),
        setCurrentSelection: bindActionCreators(selectionActions.setCurrentSelection, dispatch),
        saveCurrentSelection: bindActionCreators(selectionActions.saveCurrentSelection, dispatch),
        hoverSelection: bindActionCreators(selectionActions.hoverSelection, dispatch),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SelectionList);
