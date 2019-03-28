import React, { Component } from "react";
import "components/LeftPanel/SelectionList.scss";
import { connect } from "react-redux";
import classnames from "classnames";
import { bindActionCreators } from "redux";
import * as dataActions from "actions/data";
import * as selectionActions from "actions/selectionActions";

function createSelection(props, selection) {
    console.log(selection);
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
        >
            <div>{selection.name}</div>
            <div
                className="swatch"
                style={{ background: selection.active ? selection.color : "#bbbbbb" }}
            />
        </li>
    );
}

function SelectionList(props) {
    return (
        <div className="selections">
            <div className="header">
                <div className="title">Selections</div>
            </div>
            <div className="list">
                <ul>{props.savedSelections.map(selection => createSelection(props, selection))}</ul>
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return {
        savedSelections: state.selections.savedSelections
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleSelectionActive: bindActionCreators(selectionActions.toggleSelectionActive, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SelectionList);
