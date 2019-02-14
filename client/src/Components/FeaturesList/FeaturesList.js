import "Components/FeaturesList/FeaturesList.css";

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
import { formulas } from "formulas/formulas";

class FeaturesList extends Component {
    constructor(props) {
        super(props);
    }

    globalKeyDown(e) {
        var keyCode = e.keyCode;
        switch (keyCode) {
            case 27: //escape
                this.props.featuresUnselectAll();
                this.props.selectionsUnselectAll();
                break;
            default:
                break;
        }
    }

    /**
     * Create a single feature
     * @param {string} name name of feature
     * @param {boolean} selected selection status of feature
     * @param {key} key index for listing (required by react, don't modify)
     */
    createFeature(feature) {
        const name = feature.get("name");
        const selected = feature.get("selected");
        return (
            <li
                className={classnames("FeaturesList__feature", {
                    "FeaturesList__feature--selected": selected
                })}
                key={name}
                onClick={e => {
                    if (this.props.onOffAll !== "all" || this.props.filterString !== "")
                        e.shiftKey = false;
                    return selected
                        ? this.props.featureUnselect(name, e.shiftKey)
                        : this.props.featureSelect(name, e.shiftKey);
                }}
            >
                <div className="FeaturesList__checkbox" />
                {formulas.markSubstring(name, this.props.filterString)}
            </li>
        );
    }

    componentDidMount() {
        document.addEventListener("keydown", this.globalKeyDown.bind(this), false);
    }
    componentWillUnmount() {
        document.removeEventListener("keydown", this.globalKeyDown.bind(this), false);
    }

    render() {
        if (!this.props.featureList.size) return null;

        const features = this.props.featureList
            .filter(f =>
                this.props.filterString
                    ? f
                          .get("name")
                          .toLowerCase()
                          .startsWith(this.props.filterString.toLowerCase())
                    : true
            )
            .map(f => this.createFeature(f));

        // return null;
        // // create the list of features
        // // first filter by the filterString, then map to elements
        // const features = this.props.features
        //     .get(0)
        //     .filter(n => {
        //         switch (this.props.onOffAll) {
        //             case "all":
        //                 if (this.props.filterString === "") return true;
        //                 return (
        //                     n[0].toLowerCase().indexOf(this.props.filterString.toLowerCase()) !== -1
        //                 );
        //                 break;
        //             case "on":
        //                 if (this.props.filterString === "" && n[1]) return true;
        //                 return (
        //                     n[0].toLowerCase().indexOf(this.props.filterString.toLowerCase()) !==
        //                         -1 && n[1]
        //                 );
        //                 break;
        //             case "off":
        //                 if (this.props.filterString === "" && !n[1]) return true;
        //                 return (
        //                     n[0].toLowerCase().indexOf(this.props.filterString.toLowerCase()) !==
        //                         -1 && !n[1]
        //                 );
        //                 break;
        //             default:
        //                 return true;
        //         }
        //     })
        //     .map((n, i) => this.createFeature(n[0], n[1], i));

        // get the number of selected rows
        // see List#reduce (or Array#reduce) for info on the reductor
        const activeCount = this.props.featureList.filter(f => f.get("selected")).size;

        // get the total number of features, and the shown count
        const totalCount = this.props.featureList.size;
        const shownCount = features.size;

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
                <div className="FeaturesList__features" style={{ direction: "rtl" }}>
                    <div style={{ direction: "ltr" }}>
                        <ul>{features}</ul>
                    </div>
                </div>
            </div>
        );
    }
}

// prop types
FeaturesList.propTypes = {
    // store interaction
    featureList: PropTypes.object.isRequired,
    featureSelect: PropTypes.func.isRequired,
    featureUnselect: PropTypes.func.isRequired,
    featuresUnselectAll: PropTypes.func.isRequired,
    selectionsUnselectAll: PropTypes.func.isRequired,

    // filtration string
    filterString: PropTypes.string.isRequired,
    // state filter
    onOffAll: PropTypes.string.isRequired
};

// react state connection, autocreate a container component
const mapStateToProps = state => {
    return {
        featureList: state.data.get("featureList")
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
