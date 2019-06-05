import React, { Component , useState, useEffect} from "react";
import * as utils from "utils/utils";
import CircularProgress from "@material-ui/core/CircularProgress";
import "components/LeftPanel/FeatureData.scss";

//makes a request for the statistics of all of the features
//features is an array of strings of the feature names
function makeStatisticsRequests(features) {
    const request = {
        'routine': 'arrange',
        'hashType': 'feature', 
        'activity': 'metrics',
        //'name': features,
        'cid': '8vrjn'
    };

    let requests = features.map((feature) => {
        request.name = [feature];
        return utils.makeSimpleRequest(request);
    });

    return requests;
}

function featureStatisticsRow(stats) {

    let mean = stats.mean;
    //mean = mean.toFixed(3);
    mean = mean.toExponential(3);
    
    let median = stats.median;
    //median = median.toFixed(3);
    median = median.toExponential(3);

    return (
        <li className="featureStatisticsRow">
            <span> {stats.mean.toFixed(3)} </span>
            <span> {stats.median.toFixed(3)} </span>
        </li>
    );
}

function FeatureData(props) {
    if (props.featureListLoading) {
        return (
            <div className="chartLoading">
                <CircularProgress />
            </div>
        );
    }

    let names = props.featureList.map((feature) => {
        return feature.name;
    });

    let [statsData, setStatsData] = useState({});

    //handles loading the statistics data in a lifecycle safe way
    useEffect(() => {
        let requests = makeStatisticsRequests(names);
         //todo setup useEffect for cleanup
        requests.forEach((request) => {
            let {req, cancel} = request;

            req.then(data => {
                //handle building the list
                setStatsData((statsData) => {
                    return {
                        ...statsData,
                        [data.name[0]]: data
                    }
                });
            });
        });

        return function cleanup() {
            requests.forEach(request => request.cancel());
        };
    },[]);

    return (
        <React.Fragment>
            <div className="feature-statistics-panel" hidden={props.statsHidden}>
                <div className="header">
                    <span>mean</span>
                    <span>median</span>
                </div>
                <ul className="list">
                    {
                        names.map((name) => {
                            //console.log(loadingRows[name]);
                            if (statsData[name] == undefined) {
                                return <li> Loading ... </li>;
                            } else {
                                return featureStatisticsRow(statsData[name]);
                            }
                        })
                    }
                </ul>
            </div>
        </React.Fragment>
    );
}

export default FeatureData;