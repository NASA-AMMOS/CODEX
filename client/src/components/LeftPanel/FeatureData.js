import React, { Component, useState, useEffect } from "react";
import * as utils from "utils/utils";
import WorkerSocket from "worker-loader!workers/socket.worker";
import * as actionFunctions from "actions/actionFunctions";
import CircularProgress from "@material-ui/core/CircularProgress";
import { Sparklines, SparklinesLine } from "react-sparklines";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
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

function StatisticsRow(props) {
    if (props.stats === undefined) {
        return (
            <tr className="loading-tr">
                <td />
                <td />
                <td />
                <td />
                <td>Loading... </td>
            </tr>
        );
    }
    if (props.stats.status === "failed") {
        return (
            <tr className="loading-tr">
                <td />
                <td />
                <td />
                <td />
                <td>Failure... </td>
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
                <Sparklines
                    data={props.data}
                    limit={100}
                    style={{ fill: "none", height: "20px", width: "100%" }}
                >
                    <SparklinesLine color="white" />
                </Sparklines>
            </td>
        </tr>
    );
}

function FeatureData(props) {
    if (props.featureListLoading) {
        return <div className="chartLoading" />;
    }

    let names = props.featureList.map(feature => {
        return feature.name;
    });

    let [statsData, setStatsData] = useState({});
    let [featureData, setFeatureData] = useState({});

    //handles loading the statistics data in a lifecycle safe way
    //this will also handle returning the downsampled data
    useEffect(() => {
        const requestTemplate = {
            routine: "arrange",
            hashType: "feature",
            activity: "metrics",
            sessionkey: utils.getGlobalSessionKey(),
            cid: "8vrjn"
        };

        function lazyRecursizeHandler(request, index) {
            request.req.then(data => {
                setFeatureData(featureData => {
                    return {
                        ...featureData,
                        [data.name]: data.downsample
                    };
                });
                //handle building the list
                setStatsData(statsData => {
                    return {
                        ...statsData,
                        [data.name]: data
                    };
                });

                request.cancel();
                if (index + 1 >= names.length) return;

                //start next request
                const nextRequestObject = { ...requestTemplate, name: [names[index + 1]] };

                setTimeout(function() {
                    const nextRequest = utils.makeSimpleRequest(nextRequestObject);
                    lazyRecursizeHandler(nextRequest, index + 1);
                }, 120);
            });
        }

        if (names.length > 0) {
            const requestCopy = { ...requestTemplate, name: [names[0]] };

            const firstRequest = utils.makeSimpleRequest(requestCopy);

            lazyRecursizeHandler(firstRequest, 0);
        }
        //todo handle cleanup
    }, []);
    return (
        <React.Fragment>
            <div className="feature-statistics-panel" hidden={props.statsHidden}>
                <div className="stats-container">
                    <table className="stats-table">
                        <tbody>
                            {names.map(name => {
                                return (
                                    <StatisticsRow
                                        data={featureData[name]}
                                        key={name}
                                        name={name}
                                        stats={statsData[name]}
                                    />
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </React.Fragment>
    );
}

export default FeatureData;
