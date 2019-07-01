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

function createSelection(
    props,
    selection,
    setContextMenuVisible,
    setContextMenuPosition,
    setContextActiveSelection
) {
    return (
        <li
            className={classnames({ selection: true })}
            key={
                selection.id +
                Math.random()
                    .toString(36)
                    .substring(7)
            }
            onClick={_ => {
                    props.toggleSelectionHidden(selection.id);
                    }
                }
            onContextMenu={e => {
                e.preventDefault();
                setContextMenuVisible(true);
                setContextMenuPosition({ top: e.clientY, left: e.clientX });
                setContextActiveSelection({ id: selection.id, displayName: selection.displayName });
            }}
        >
            <div>{selection.displayName}</div>
            <div
                className="swatch"
                style={{ background: !selection.hidden ? selection.color : "#bbbbbb" }}
            />
        </li>
    );
}

function createCurrentSelection(props) {
    //checks to see if current selection is null
    if (props.currentSelection.length == 0) return <li key={"currentSelection"} />;

    return (
        <li
            key={"currentSelection"}
            className={classnames({ selection: true })}
            onClick={() => {
                props.saveCurrentSelection();
                props.setCurrentSelection([]);
            }}
        >
            Current Selection
        </li>
    );
}

function SelectionList(props) {
    const activeCount = props.savedSelections.filter(sel => sel.active).length;
    const shownCount = activeCount;
    const totalCount = props.savedSelections.length;

    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });

    const [contextActiveSelection, setContextActiveSelection] = useState(null);
    const [contextMode, setContextMode] = useState(null);

    const [renameSelectionBuffer, setRenameSelectionBuffer] = useState("");

    function submitRenamedSelection(e) {
        if (!e.key || (e.key && e.key === "Enter")) {
            setContextMenuVisible(false);
            setContextMode(null);
            setContextActiveSelection(null);
            props.renameSelection(contextActiveSelection.id, renameSelectionBuffer);
        }
    }

    return (
        <React.Fragment>
            <div className="selections">
                <div className="header">
                    <div className="title">Selections</div>
                    <span className="counts">
                        {activeCount}/{shownCount}/{totalCount}
                    </span>
                </div>
                <div className="list">
                    <ul>
                        {props.savedSelections
                            .map(selection =>
                                createSelection(
                                    props,
                                    selection,
                                    setContextMenuVisible,
                                    setContextMenuPosition,
                                    setContextActiveSelection
                                )
                            )
                            .concat(createCurrentSelection(props))}
                    </ul>
                </div>
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
                    <List>
                        <ListItem
                            button
                            onClick={_ => {
                                setContextMode("rename");
                                setRenameSelectionBuffer(contextActiveSelection.displayName);
                            }}
                            hidden={contextMode}
                        >
                            Rename Selection
                        </ListItem>
                        <ListItem
                            button
                            onClick={_ => {
                                setContextMenuVisible(false);
                                props.deleteSelection(contextActiveSelection.id);
                                setContextActiveSelection(null);
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
        saveCurrentSelection: bindActionCreators(selectionActions.saveCurrentSelection, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SelectionList);
