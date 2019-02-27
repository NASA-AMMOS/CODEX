import React, { Component } from "react";
import "./Features.css";

import FeaturesList from "../FeaturesList/FeaturesList";

class Features extends Component {
    render() {
        return (
            <div className="Features">
                <FeaturesList
                    filterString={this.props.filterString}
                    onOffAll={this.props.onOffAll}
                />
            </div>
        );
    }
}

export default Features;
