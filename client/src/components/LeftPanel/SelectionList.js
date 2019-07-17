import React, { Component, useState } from "react";
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
import Checkbox from '@material-ui/core/Checkbox';
import CheckboxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
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

function SelectionDisplayItem(props){
    return (
        <div
            className={classnames({ selection: true })}
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
                props.setContextActiveSelection({ id: props.selection.id, name: props.selection.name });
            }}
            onMouseEnter={_ => props.hoverSelection(props.selection.id)}
            onMouseLeave={_ => props.hoverSelection(null)}
        >
            <Checkbox
                checked={props.selection.active}
                value="checkedA"
                icon={<CheckboxOutlineBlank style={{fill: "#828282"}} />}
                checkedIcon={<CheckboxIcon style={{ fill:"#3988E3"}} />}
                onClick={
                    _ => {
                        props.toggleSelectionActive(props.selection.id);
                    }
                }
                style={{height:"22px",  padding:"0px"}}
              />
            <div className="selection-name-tag"><span> {props.selection.name} </span></div>
            <Checkbox
                className="eye-icon-checkbox"
                checked={props.selection.hidden}
                value="checkedA"
                icon={<RemoveRedEye style={{fill: "#DADADA"}} />}
                checkedIcon={<RemoveRedEye style={{ fill:"#061427"}} />}
                onClick={_ => {
                    props.toggleSelectionHidden(props.selection.id);
                    }
                }
                style={{height:"22px", padding:"0px"}}
              />
              <div
                className="swatch"
                style={{ background: props.selection.color}}
            />
        </div>
    );
}

function CurrentSelection(props) {
    //checks to see if current selection is null
    const disabled = (props.currentSelection.length == 0);

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
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

const grid = 8;

function DragList(props) {

    function onDragEnd(result){
        // dropped outside the list
        if (!result.destination) {
            return;
        }

        const savedSelections = reorder(
            props.savedSelections,
            result.source.index,
            result.destination.index
        );
        props.setSavedSelections(savedSelections);
    }

    return (
        <div className="list">
            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="droppable">
                    {(provided, snapshot) => (
                        <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="drag-drop-div"
                            //style={getListStyle(snapshot.isDraggingOver)}
                        >
                            {props.savedSelections.map((selection, index) => (
                                <Draggable key={selection.id} draggableId={selection.id+""} index={index}>
                                    {(provided, snapshot) => (
                                        <div 
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                        >
                                            <SelectionDisplayItem
                                                hoverSelection={props.hoverSelection}     
                                                selection={selection}
                                                toggleSelectionActive={props.toggleSelectionActive}
                                                toggleSelectionHidden={props.toggleSelectionHidden}
                                                setContextMenuVisible={props.setContextMenuVisible}
                                                setContextMenuPosition={props.setContextMenuPosition}
                                                setContextActiveSelection={props.setContextActiveSelection}
                                            />
                                        </div>
                                    )}
                                </Draggable>
                            ))}
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
                    savedSelections={props.savedSelections}
                    setSavedSelections={props.setSavedSelections}
                    saveCurrentSelection={props.saveCurrentSelection}
                    currentSelection={props.currentSelection}
                    hoverSelection={props.hoverSelection}
                    toggleSelectionActive={props.toggleSelectionActive}
                    toggleSelectionHidden={props.toggleSelectionHidden}
                    setContextMenuVisible={setContextMenuVisible}
                    setContextMenuPosition={setContextMenuPosition}
                    contextActiveSelection={contextActiveSelection}
                    setContextActiveSelection={setContextActiveSelection}
                    setCurrentSelection={props.setCurrentSelection}
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
        currentSelection: state.selections.currentSelection
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleSelectionActive: bindActionCreators(selectionActions.toggleSelectionActive, dispatch),
        toggleSelectionHidden: bindActionCreators(selectionActions.toggleSelectionHidden, dispatch),
        deleteSelection: bindActionCreators(selectionActions.deleteSelection, dispatch),
        renameSelection: bindActionCreators(selectionActions.renameSelection, dispatch),
        setCurrentSelection: bindActionCreators(selectionActions.setCurrentSelection, dispatch),
        saveCurrentSelection: bindActionCreators(selectionActions.saveCurrentSelection, dispatch),
        hoverSelection: bindActionCreators(selectionActions.hoverSelection, dispatch),
        setSavedSelections: bindActionCreators(selectionActions.setSavedSelections, dispatch),
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SelectionList);