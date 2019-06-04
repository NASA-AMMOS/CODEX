import React, { Component } from "react";
import * as utils from "utils/utils";
import CircularProgress from "@material-ui/core/CircularProgress";

//makes a request for the statistics of all of the features
//features is an array of strings of the feature names
function makeStatisticsRequest(features) {
    const request = {
        'routine': 'arrange',
        'hashType': 'feature', 
        'activity': 'metrics',
        'name': features,
        'cid': '8vrjn'
    };

    return utils.makeSimpleRequest(request);
}

function FeatureData(props) {
    if (props.featureListLoading) {
        return (
            <div className="chartLoading">
                <CircularProgress />
            </div>
        );
    }

    console.log(props.featureList.toJS());

    let {req, cancel} = makeStatisticsRequest(props.featureList);

    req.then(data => {
        console.log(data);
    });

    return (
        <React.Fragment>
            <div className="feature-statistics-panel" hidden={props.statsHidden}>
                <div className="header">
                    <span className="counts">
                        10
                    </span>
                </div>
            </div>
        </React.Fragment>
    );
}

export default FeatureData;