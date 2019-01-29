import React, { Component } from "react";
import "./Features.css";

import FeaturesList from "../FeaturesList/FeaturesList";
import SelectionsList from "../SelectionsList/SelectionsList";

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
