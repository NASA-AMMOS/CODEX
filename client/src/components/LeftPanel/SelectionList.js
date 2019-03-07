import React, { Component } from "react";
import "components/LeftPanel/SelectionList.scss";
import { connect } from "react-redux";
import classnames from "classnames";
import { bindActionCreators } from "redux";
import * as dataActions from "actions/data";

function createSelection(selection) {
    return (
        <li
            className={classnames({ selection: true })}
            key={
                selection.name +
                Math.random()
                    .toString(36)
                    .substring(7)
            }
        >
            <span>{selection.name}</span>
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
                <ul>{props.selections.map(createSelection)}</ul>
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return {
        selections: state.selections.selections
    };
}

function mapDispatchToProps(dispatch) {
    return {};
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SelectionList);
