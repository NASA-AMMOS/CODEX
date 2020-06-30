import "./SelectionList.scss";

import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";
import { RemoveRedEye } from "@material-ui/icons";
import { useDispatch } from "react-redux";
import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import CheckboxIcon from "@material-ui/icons/CheckBox";
import CheckboxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import InfoIcon from "@material-ui/icons/Info";
import InfoOutlinedIcon from "@material-ui/icons/InfoOutlined";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Popover from "@material-ui/core/Popover";
import React, { useState, useEffect, useRef } from "react";
import TextField from "@material-ui/core/TextField";
import TinyPopover, { ArrowContainer } from "react-tiny-popover";

import classnames from "classnames";

import { addNewItem, reorderList } from "../../utils/utils";
import { closeWindow } from "../../actions/windowManagerActions";
import { deleteSelection, hoverSelection } from "../../actions/selectionActions";
import {
    useChangeSelectionGroup,
    useCurrentSelection,
    useDeleteSelection,
    useDeleteSelectionGroup,
    useRenameSelection,
    useRenameSelectionGroup,
    useSaveCurrentSelection,
    useSavedSelections,
    useSelectionGroups,
    useSetHoverSelection,
    useSetSelectionActive,
    useSetSelectionGroupActive,
    useSetSelectionGroupHidden,
    useSetSelectionHidden
} from "../../hooks/DataHooks";
import { useOpenNewWindow, useWindowList } from "../../hooks/WindowHooks";
import { useStatsPanelHidden } from "../../hooks/UIHooks";
import SelectionGroupInfo from "../SelectionGroupInfo/SelectionGroupInfo";

function SelectionContextMenu(props) {
    const [contextMode, setContextMode] = useState(null);

    const [renameSelectionBuffer, setRenameSelectionBuffer] = useState(props.item.name);

    function clickDeleteSelection() {
        props.setContextMenuVisible(false);
        props.deleteFunc(props.item.id);
    }

    function submitRenamedSelection(e) {
        props.setContextMenuVisible(false);
        props.renameFunc(props.item.id, renameSelectionBuffer);
    }

    function clickCreateSelectionGroup() {
        props.setContextMenuVisible(false);
        props.createNewGroupFunc("New Group", [props.item.id]);
    }

    // To make sure the autofocus works, don't create the rename text field until we need it.
    const renameTextField =
        contextMode === "rename" ? (
            <TextField
                value={renameSelectionBuffer}
                onChange={e => setRenameSelectionBuffer(e.target.value)}
                onKeyPress={e => {
                    if (e.key && e.key === "Enter") submitRenamedSelection();
                }}
                autoFocus
            />
        ) : null;

    const createNewGroupItem = props.createNewGroupFunc ? (
        <ListItem button onClick={clickCreateSelectionGroup} hidden={contextMode}>
            Create Selection Group
        </ListItem>
    ) : null;

    return (
        <ClickAwayListener onClickAway={_ => props.setContextMenuVisible(false)}>
            <List>
                <ListItem button onClick={clickDeleteSelection} hidden={contextMode}>
                    Delete
                </ListItem>
                <ListItem hidden={contextMode !== "rename"}>
                    {renameTextField}
                    <Button
                        variant="outlined"
                        style={{ marginLeft: "10px" }}
                        onClick={submitRenamedSelection}
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
                {createNewGroupItem}
            </List>
        </ClickAwayListener>
    );
}

function GroupContextMenu(props) {
    const [contextMode, setContextMode] = useState(null);

    const [renameGroupBuffer, setRenameGroupBuffer] = useState(props.group.name);
    const deleteSelectionGroup = useDeleteSelectionGroup();
    const renameSelectionGroup = useRenameSelectionGroup();

    function clickDeleteGroup() {
        props.setContextMenuVisible(false);
        deleteSelectionGroup(props.group.id);
    }

    function submitRenamedGroup(e) {
        props.setContextMenuVisible(false);
        renameSelectionGroup(props.group.id, renameGroupBuffer);
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

function SelectionItem(props) {
    const deleteSelection = useDeleteSelection();
    const renameSelection = useRenameSelection();
    const setSelectionActive = useSetSelectionActive();
    const setSelectionHidden = useSetSelectionHidden();
    const [_, createSelectionGroup] = useSelectionGroups();
    const hoverSelection = useSetHoverSelection();

    const [anchorEl, setAnchorEl] = useState();

    function onContextMenu(e) {
        e.preventDefault();
        setAnchorEl(e.currentTarget);
    }

    function checkboxClick(e) {
        setSelectionActive(props.selection.id, e.target.checked);
    }

    function eyeballClick(e) {
        setSelectionHidden(props.selection.id, e.target.checked);
    }

    return (
        <Draggable draggableId={props.selection.id} index={props.idx}>
            {provided => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    onContextMenu={onContextMenu}
                    onMouseEnter={_ => hoverSelection(props.selection.id)}
                    onMouseLeave={_ => hoverSelection(null)}
                    className="selection-item"
                >
                    <div>
                        <Checkbox
                            checked={props.selection.active}
                            value="checkedA"
                            icon={<CheckboxOutlineBlank style={{ fill: "#828282" }} />}
                            checkedIcon={<CheckboxIcon style={{ fill: "#3988E3" }} />}
                            style={{ height: "22px", padding: "0px" }}
                            onChange={checkboxClick}
                        />
                        <label>{props.selection.name}</label>
                    </div>
                    <div className="selection-buttons">
                        <Checkbox
                            className="eye-icon-checkbox"
                            checked={props.selection.hidden}
                            value="checkedA"
                            icon={<RemoveRedEye style={{ fill: "#DADADA" }} />}
                            checkedIcon={<RemoveRedEye style={{ fill: "#061427" }} />}
                            onClick={eyeballClick}
                            style={{ height: "22px", padding: "0px" }}
                        />
                        <div
                            className="swatch"
                            style={{ backgroundColor: props.selection.color }}
                        />
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
                        <SelectionContextMenu
                            item={props.selection}
                            setContextMenuVisible={setAnchorEl}
                            deleteFunc={deleteSelection}
                            renameFunc={renameSelection}
                            createNewGroupFunc={createSelectionGroup}
                        />
                    </Popover>
                </div>
            )}
        </Draggable>
    );
}

function SelectionGroup(props) {
    const [anchorEl, setAnchorEl] = useState();
    const setGroupActive = useSetSelectionGroupActive();
    const setGroupHidden = useSetSelectionGroupHidden();

    function onContextMenu(e) {
        e.preventDefault();
        setAnchorEl(e.currentTarget);
    }

    function checkboxClick(e) {
        setGroupActive(props.group.id, e.target.checked);
    }

    function eyeballClick(e) {
        setGroupHidden(props.group.id, e.target.checked);
    }

    const [panelExpanded, setPanelExpanded] = useState(true);
    const iconClasses = classnames({ ["expand-icon"]: true, expanded: panelExpanded });

    const [showGroupInfo, setShowGroupInfo] = useState(false);

    return (
        <Droppable key={props.group.id} droppableId={props.group.id}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="selection-group"
                >
                    <div className="selection-group-header">
                        <div>
                            <button
                                className={iconClasses}
                                onClick={_ => setPanelExpanded(!panelExpanded)}
                            >
                                <KeyboardArrowRightIcon />
                            </button>
                            <Checkbox
                                checked={props.group.active}
                                value="checkedA"
                                icon={<CheckboxOutlineBlank style={{ fill: "#828282" }} />}
                                checkedIcon={<CheckboxIcon style={{ fill: "#3988E3" }} />}
                                style={{ height: "22px", padding: "0px" }}
                                onChange={checkboxClick}
                            />
                            <label onContextMenu={onContextMenu}>{props.group.name}</label>
                        </div>
                        <div>
                            <Checkbox
                                className="eye-icon-checkbox"
                                checked={props.group.hidden}
                                value="checkedA"
                                icon={<RemoveRedEye style={{ fill: "#DADADA" }} />}
                                checkedIcon={<RemoveRedEye style={{ fill: "#061427" }} />}
                                onClick={eyeballClick}
                                style={{ height: "22px", padding: "0px" }}
                            />
                            <TinyPopover
                                isOpen={showGroupInfo}
                                position="right"
                                content={({ position, targetRect, popoverRect }) => (
                                    <ArrowContainer
                                        position={position}
                                        targetRect={targetRect}
                                        popoverRect={popoverRect}
                                        arrowColor="#152f53"
                                    >
                                        <SelectionGroupInfo
                                            groupID={props.group.id}
                                            handleClose={_ => setShowGroupInfo(false)}
                                        />
                                    </ArrowContainer>
                                )}
                            >
                                <Checkbox
                                    className="eye-icon-checkbox"
                                    checked={showGroupInfo}
                                    value="checkedA"
                                    icon={<InfoIcon style={{ fill: "#DADADA" }} />}
                                    checkedIcon={<InfoOutlinedIcon style={{ fill: "#DADADA" }} />}
                                    onClick={_ => setShowGroupInfo(!showGroupInfo)}
                                    style={{ height: "22px", padding: "0px" }}
                                />
                            </TinyPopover>
                        </div>
                    </div>
                    {panelExpanded ? (
                        <div className="selection-group-items">
                            {props.group.selections.map((sel, idx) => (
                                <SelectionItem selection={sel} idx={idx} key={sel.id} />
                            ))}
                        </div>
                    ) : null}
                    {provided.placeholder}
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
                </div>
            )}
        </Droppable>
    );
}

function SelectionItems(props) {
    const [selections] = useSavedSelections();
    const [groups] = useSelectionGroups();
    const changeSelectionGroup = useChangeSelectionGroup();

    const [orderedSingletons, setOrderedSingletons] = useState(_ =>
        selections.filter(sel => !sel.groupID)
    );
    // Effect to keep our ordered list of selections updated.
    useEffect(
        _ => {
            setOrderedSingletons(
                orderedSingletons
                    .filter(
                        sel =>
                            selections.find(x => x.id === sel.id) &&
                            !selections.find(x => x.id === sel.id).groupID
                    )
                    .map(sel => Object.assign(sel, selections.find(x => x.id === sel.id)))
                    .concat(
                        selections.filter(
                            sel => !orderedSingletons.find(x => x.id === sel.id) && !sel.groupID
                        )
                    )
            );
        },
        [selections]
    );

    const [orderedGroups, setOrderedGroups] = useState(_ =>
        groups.map(group =>
            Object.assign(group, { selections: selections.filter(sel => sel.groupID === group.id) })
        )
    );
    useEffect(
        _ => {
            setOrderedGroups(
                groups.map(group => {
                    const oldGroup = orderedGroups.find(g => g.id === group.id);
                    const previousGroupSelections = oldGroup ? oldGroup.selections : [];
                    const currentGroupSelections = selections.filter(
                        sel => sel.groupID === group.id
                    );
                    const newSelectionOrder = previousGroupSelections
                        .filter(sel => currentGroupSelections.find(x => x.id === sel.id))
                        .map((
                            sel // Merge current state of the selection with the one we're storing
                        ) => Object.assign(sel, currentGroupSelections.find(x => x.id === sel.id)))
                        .concat(
                            currentGroupSelections.filter(
                                sel => !previousGroupSelections.find(x => x.id === sel.id)
                            )
                        );
                    return Object.assign(group, {
                        selections: newSelectionOrder
                    });
                })
            );
        },
        [selections, groups]
    );

    function onDragEnd(e) {
        if (!e.source.droppableId && !e.destination.droppableId) return;

        if (e.source.droppableId === e.destination.droppableId) {
            if (e.destination.droppableId === "singletonList") {
                return setOrderedSingletons(
                    reorderList(orderedSingletons, e.source.index, e.destination.index)
                );
            }
            return setOrderedGroups(orderedGroups =>
                orderedGroups.map(group =>
                    group.id === e.destination.droppableId
                        ? Object.assign(group, {
                              selections: reorderList(
                                  group.selections,
                                  e.source.index,
                                  e.destination.index
                              )
                          })
                        : group
                )
            );
        }

        if (e.source.droppableId !== e.destination.droppableId) {
            const item = selections.find(sel => sel.id === e.draggableId);

            // This effect smooths out the animation by updating our local state before the global one is updated
            if (e.destination.droppableId === "singletonList") {
                setOrderedSingletons(orderedSingletons =>
                    addNewItem(orderedSingletons, item, e.destination.index)
                );
            } else {
                setOrderedGroups(orderedGroups =>
                    orderedGroups.map(group =>
                        group.id === e.destination.droppableId
                            ? Object.assign(group, {
                                  selections: addNewItem(
                                      group.selections,
                                      item,
                                      e.destination.index
                                  )
                              })
                            : group
                    )
                );
            }

            changeSelectionGroup(
                e.draggableId,
                e.destination.droppableId === "singletonList" ? null : e.destination.droppableId
            );
        }
    }

    return (
        <React.Fragment>
            <div className="selections-container">
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="singletonList">
                        {(provided, snapshot) => (
                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                {orderedSingletons.map((sel, idx) => (
                                    <SelectionItem selection={sel} idx={idx} key={sel.id} />
                                ))}
                                {!orderedSingletons.length && groups.length ? (
                                    <div>(no ungrouped selections)</div>
                                ) : null}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                    <hr className="feature-list-divider" />
                    {orderedGroups.map(group => (
                        <SelectionGroup group={group} key={group.id} />
                    ))}
                </DragDropContext>
            </div>
        </React.Fragment>
    );
}

function SelectionList(props) {
    const [selections] = useSavedSelections();
    const [panelCollapsedState] = useStatsPanelHidden();
    const [currentSelection, setCurrentSelection] = useCurrentSelection();

    const dispatch = useDispatch();
    const hoverSelection = useSetHoverSelection();

    const saveCurrentSelection = useSaveCurrentSelection();
    const activeCount = selections.filter(sel => !sel.hidden).length;
    const shownCount = activeCount;
    const totalCount = selections.length;

    return (
        <React.Fragment>
            <div className="selections">
                <div className="header stats-hidden-header">
                    <div className="title">Selections</div>
                    <span className="counts">
                        {activeCount}/{shownCount}/{totalCount}
                    </span>
                </div>
                <SelectionItems panelCollapsed={props.panelCollapsed} />
                <Button
                    classes={{ disabled: "disabled", label: "label" }}
                    variant="contained"
                    disabled={!currentSelection.length}
                    className="current-selection-button"
                    onMouseEnter={_ => hoverSelection("current_selection")}
                    onMouseLeave={_ => hoverSelection(null)}
                    onClick={() => {
                        saveCurrentSelection();
                        setCurrentSelection([]);
                    }}
                >
                    Save Selection
                </Button>
            </div>
        </React.Fragment>
    );
}

export default SelectionList;
