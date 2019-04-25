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

function createSelection(
    props,
    selection,
    contextMenuVisible,
    contextMenuPosition,
    setContextMenuVisible,
    setContextMenuPosition
) {
    return (
        <li
            className={classnames({ selection: true })}
            key={
                selection.name +
                Math.random()
                    .toString(36)
                    .substring(7)
            }
            onClick={_ => props.toggleSelectionActive(selection.name)}
            onContextMenu={e => {
                e.preventDefault();
                setContextMenuVisible(true);
                setContextMenuPosition({ top: e.clientY, left: e.clientX });
            }}
        >
            <div>{selection.name}</div>
            <div
                className="swatch"
                style={{ background: selection.active ? selection.color : "#bbbbbb" }}
            />
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
                                setContextMenuVisible(false);
                            }}
                        >
                            Rename Selection
                        </ListItem>
                        <ListItem
                            button
                            onClick={_ => {
                                setContextMenuVisible(false);
                                props.deleteSelection(selection.name);
                            }}
                        >
                            Delete Selection
                        </ListItem>
                    </List>
                </ClickAwayListener>
            </Popover>
        </li>
    );
}

function SelectionList(props) {
    const activeCount = props.savedSelections.filter(sel => sel.active).length;
    const shownCount = activeCount;
    const totalCount = props.savedSelections.length;

    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });

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
                        {props.savedSelections.map(selection =>
                            createSelection(
                                props,
                                selection,
                                contextMenuVisible,
                                contextMenuPosition,
                                setContextMenuVisible,
                                setContextMenuPosition
                            )
                        )}
                    </ul>
                </div>
            </div>
        </React.Fragment>
    );
}

function mapStateToProps(state) {
    return {
        savedSelections: state.selections.savedSelections
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleSelectionActive: bindActionCreators(selectionActions.toggleSelectionActive, dispatch),
        deleteSelection: bindActionCreators(selectionActions.deleteSelection, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SelectionList);
