import React, { Component, useState, useEffect } from "react";
import * as utils from "utils/utils";
import WorkerSocket from "worker-loader!workers/socket.worker";
import * as actionFunctions from "actions/actionFunctions";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Sparklines, SparklinesLine } from 'react-sparklines';
import { bindActionCreators} from "redux";
import { connect} from "react-redux";
import * as actionTypes from "constants/actionTypes";

function processFloatingPointNumber(number) {
    let roundedNumber = Math.round(number * Math.pow(10, 2)) / Math.pow(10, 2);
    let newNumber = "";
    //see if has decimal
    if ((roundedNumber + "").length > 6) {
        //convert to scientific notation
        newNumber = roundedNumber.toExponential(1);
    } else {
        newNumber = roundedNumber;
    }

    return newNumber;
}

//makes a request for the statistics of all of the features
//features is an array of strings of the feature names
function makeStatisticsRequests(features) {
    const request = {
        routine: "arrange",
        hashType: "feature",
        activity: "metrics",
        //'name': features,
        cid: "8vrjn"
    };

    let requests = features.map(feature => {
        request.name = [feature];
        return utils.makeSimpleRequest(request);
    });

    return requests;
}

function StatisticsRow(props) {
    if (props.stats === undefined) {
        return (
            <tr>
                <td> Loading ... </td>
            </tr>
        );
    }

    let mean = processFloatingPointNumber(props.stats.mean);
    let median = processFloatingPointNumber(props.stats.median);

    let [featureTypeData, setFeatureTypeData] = useState({ c: false, r: false });

    return (
        <tr className="feature-statistics-row">
            <td
                className={featureTypeData.c ? "lit" : "dim"}
                onClick={function() {
                    setFeatureTypeData({ r: featureTypeData.r, c: !featureTypeData.c });
                }}
            >
                C
            </td>
            <td
                className={featureTypeData.r ? "lit" : "dim"}
                onClick={function() {
                    setFeatureTypeData({ r: !featureTypeData.r, c: featureTypeData.c });
                }}
            >
                R
            </td>
            <td> {mean} </td>
            <td> {median} </td>
            <td>
                <Sparklines data={props.data} limit={100} style={{ fill: "none" , height:"20px", width:"100%"}}>
                    <SparklinesLine color="white" />
                </Sparklines>
            </td>
        </tr>
    );
}

function loadColumnFromServer(feature) {
    return new Promise(resolve => {
        const socketWorker = new WorkerSocket();

        socketWorker.addEventListener("message", e => {
            const data = JSON.parse(e.data).data.map(ary => ary[0]);
            resolve(data);
        });

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.GET_GRAPH_DATA,
                selectedFeatures: [feature]
            })
        );
    });
}

function FeatureData(props) {
    if (props.featureListLoading) {
        return (
            <div className="chartLoading">
                <CircularProgress />
            </div>
        );
    }

    let names = props.featureList.map(feature => {
        return feature.name;
    });

    let [statsData, setStatsData] = useState({});
    let [featureData, setFeatureData] = useState({});

    //handles making the requests to get the column data for each of the features
    useEffect(() => {
        let promises = names.map((featureName) => {
            return loadColumnFromServer(featureName);
        });

        Promise.all(promises).then(cols => {
            let newFeatureData = {};
            cols.forEach((col, idx) => {
                newFeatureData[names[idx]] = col;
            })

            setFeatureData(newFeatureData);
        });

    },[]);

    //handles loading the statistics data in a lifecycle safe way
    useEffect(() => {
        let requests = makeStatisticsRequests(names);
        //todo setup useEffect for cleanup
        requests.forEach(request => {
            let { req, cancel } = request;

            req.then(data => {
                //handle building the list
                setStatsData(statsData => {
                    return {
                        ...statsData,
                        [data.name[0]]: data
                    };
                });
            });
        });

        return function cleanup() {
            requests.forEach(request => request.cancel());
        };
    }, []);

    return (
        <React.Fragment>
            <div className="feature-statistics-panel" hidden={props.statsHidden}>
                <div className="stats-container">
                    <table className="stats-table">
                        <tbody>
                            {names.map(name => {
                                return <StatisticsRow data={featureData[name]} key={name} stats={statsData[name]}/>;
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </React.Fragment>
    );
}

export default FeatureData;
