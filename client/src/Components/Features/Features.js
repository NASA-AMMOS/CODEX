import "./Features.css";

import React, { Component } from "react";

import FeaturesList from "components/FeaturesList/FeaturesList";
import SelectionsList from "components/SelectionsList/SelectionsList";

class Features extends Component {
    render() {
        return (
            <div className="Features">
                <FeaturesList
                    filterString={this.props.filterString}
                    onOffAll={this.props.onOffAll}
                />
                <SelectionsList
                    filterString={this.props.filterString}
                    onOffAll={this.props.onOffAll}
                />
            </div>
        );
    }
}

export default Features;
