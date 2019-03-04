import "components/FeaturesList/FeaturesList.css";

import { connect } from "react-redux";
import PropTypes from "prop-types";
import React, { Component } from "react";
import classnames from "classnames";

import {
    featureSelect,
    featureUnselect,
    featuresUnselectAll,
    selectionsUnselectAll
} from "actions/data";

function createFeature(props, feature) {
    const name = feature.get("name");
    const selected = feature.get("selected");
    return (
        <li
            className={classnames("FeaturesList__feature", {
                "FeaturesList__feature--selected": selected
            })}
            key={name}
            onClick={e => {
                if (props.onOffAll !== "all" || props.filterString !== "") e.shiftKey = false;
                return selected
                    ? props.featureUnselect(name, e.shiftKey)
                    : props.featureSelect(name, e.shiftKey);
            }}
        >
            <div className="FeaturesList__checkbox" />
            <span>{name}</span>
        </li>
    );
}

function FeaturesList(props) {
    if (!props.featureList.size) return null;

    const features = props.featureList
        .filter(f =>
            props.filterString
                ? f
                      .get("name")
                      .toLowerCase()
                      .startsWith(props.filterString.toLowerCase())
                : true
        )
        .map(f => createFeature(props, f));

    // get the number of selected rows
    // see List#reduce (or Array#reduce) for info on the reductor
    const activeCount = props.featureList.filter(f => f.get("selected")).size;

    // get the total number of features, and the shown count
    const totalCount = props.featureList.size;
    const shownCount = features.size;

    const featureList = (
        <div className="FeaturesList__features" style={{ direction: "rtl" }}>
            <div style={{ direction: "ltr" }}>
                <ul>{features}</ul>
            </div>
        </div>
    );

    const loadingIndicator = <div>LOADING</div>;

    return (
        <div className="FeaturesList">
            <div className="FeaturesList__title">
                <div className="FeaturesList__align">
                    <span className="FeaturesList__titletext">Features</span>
                    <span className="FeaturesList__summary">
                        {activeCount}/{shownCount}/{totalCount}
                    </span>
                    <div className="FeaturesList__statistics">
                        {activeCount} active, {shownCount} shown, {totalCount} total
                    </div>
                </div>
            </div>
            {props.featureListLoading ? loadingIndicator : featureList}
        </div>
    );
}

// prop types
FeaturesList.propTypes = {
    // store interaction
    featureList: PropTypes.object.isRequired,
    featureSelect: PropTypes.func.isRequired,
    featureUnselect: PropTypes.func.isRequired,
    featuresUnselectAll: PropTypes.func.isRequired,
    selectionsUnselectAll: PropTypes.func.isRequired,
    featureListLoading: PropTypes.bool.isRequired,

    // filtration string
    filterString: PropTypes.string.isRequired,
    // state filter
    onOffAll: PropTypes.string.isRequired
};

// react state connection, autocreate a container component
const mapStateToProps = state => {
    return {
        featureList: state.data.get("featureList"),
        featureListLoading: state.data.get("featureListLoading")
    };
};
const mapDispatchToProps = dispatch => ({
    featureSelect: (name, shifted) => dispatch(featureSelect(name, shifted)),
    featureUnselect: (name, shifted) => dispatch(featureUnselect(name, shifted)),
    featuresUnselectAll: () => dispatch(featuresUnselectAll()),
    selectionsUnselectAll: () => dispatch(selectionsUnselectAll())
});

// export presentation component for testing
export { FeaturesList };
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FeaturesList);
