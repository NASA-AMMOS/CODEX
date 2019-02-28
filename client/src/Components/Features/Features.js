import React, { Component } from "react";
import "./Features.css";
import { connect } from "react-redux";
import FeaturesList from "../FeaturesList/FeaturesList";

function createSelectionsList(props) {
    return props.selectionState.selections.map(selection => (
        <div key={selection.rowIndex}>{selection.name}</div>
    ));
}

function Features(props) {
    return (
        <div className="Features">
            <FeaturesList filterString={props.filterString} onOffAll={props.onOffAll} />
            {createSelectionsList(props)}
        </div>
    );
}

function mapStateToProps(state) {
    return {
        selectionState: state.selections
    };
}

export default connect(
    mapStateToProps,
    null
)(Features);
