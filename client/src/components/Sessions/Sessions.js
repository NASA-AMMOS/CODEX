import "./Sessions.scss";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import React, { useReducer, useEffect } from "react";

import { useWindowManager } from "../../hooks/WindowHooks";
import * as sessionsActions from "../../actions/sessionsActions";
import * as utils from "../../utils/utils";

function sessionsStateReducer(sessionsState, action) {
    switch (action.type) {
        case "getSessions":
            return {
                sessionsList: action.sessionsList
            };
            break;
    }
}

function Sessions(props) {
    const win = useWindowManager(props, {
        title: "Sessions",
        width: 500,
        height: 500,
        resizeable: true
    });

    const [sessionsState, sessionsStateDispatch] = useReducer(sessionsStateReducer, {
        sessionsList: []
    });

    useEffect(_ => {
        const { req } = utils.makeSimpleRequest({
            routine: "get_sessions"
        });
        req.then(data => {
            sessionsStateDispatch({
                type: "getSessions",
                sessionsList: data.sessions
            });
        });
    }, []);

    let sessionsByFileName = {};
    sessionsState.sessionsList.forEach(sessionName => {
        let fileName = sessionName.slice(0, sessionName.lastIndexOf("_"));

        if (!sessionsByFileName.hasOwnProperty(fileName)) {
            sessionsByFileName[fileName] = [];
        }
        sessionsByFileName[fileName].push(sessionName);
    });

    console.log(sessionsByFileName);

    const transformSessionName = sessionName => {
        console.log(sessionName);
        sessionName = sessionName.slice(sessionName.lastIndexOf("_") + 1, sessionName.length + 1);
        sessionName = new Date(sessionName).toLocaleString();
        return sessionName;
    };

    return (
        <div className="sessions">
            {Object.entries(sessionsByFileName)
                .filter(([fileName]) => fileName !== "AUTOSAV")
                .map(([fileName, sessionNames]) => {
                    return (
                        <div key={fileName}>
                            <div className="fileName">{fileName}</div>
                            {sessionNames.map(sessionName => {
                                return (
                                    <div
                                        className="sessionName"
                                        key={sessionName}
                                        onClick={() => props.loadSession(sessionName)}
                                    >
                                        {transformSessionName(sessionName)}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}
        </div>
    );
}

function mapDispatchToProps(dispatch) {
    return {
        loadSession: bindActionCreators(sessionsActions.loadSession, dispatch)
    };
}

export default connect(
    null,
    mapDispatchToProps
)(Sessions);
