import React, { Component } from "react";
import "components/LeftPanel/FeatureList.scss";
import { connect } from "react-redux";
import classnames from "classnames";
import { bindActionCreators } from "redux";
import * as dataActions from "actions/data";

function createFeature(props, feature) {
    const name = feature.get("name");
    const selected = feature.get("selected");
    return (
        <li
            className={classnames({ feature: true, selected })}
            key={name}
            onClick={e => {
                if (props.onOffAll !== "all" || props.filterString !== "") e.shiftKey = false;
                return selected
                    ? props.featureUnselect(name, e.shiftKey)
                    : props.featureSelect(name, e.shiftKey);
            }}
        >
            <div className="checkbox" />
            <span>{name}</span>
        </li>
    );
}

function FeatureList(props) {
    const activeCount = props.featureList.filter(f => f.get("selected")).size;
    const shownCount = activeCount;
    const totalCount = props.featureList.size;

    const featureItems = props.featureList
        .filter(f =>
            props.filterString
                ? f
                      .get("name")
                      .toLowerCase()
                      .startsWith(props.filterString.toLowerCase())
                : true
        )
        .map(f => createFeature(props, f));

    return (
        <div className="Features">
            <div className="header">
                <div className="title">Features</div>
                <span className="counts">
                    {activeCount}/{shownCount}/{totalCount}
                </span>
            </div>
            <div className="list">
                <ul>{featureItems}</ul>
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return {
        featureList: state.data.get("featureList"),
        featureListLoading: state.data.get("featureListLoading")
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
