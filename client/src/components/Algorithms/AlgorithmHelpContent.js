import "./algorithmStyles.scss";

import CircularProgress from "@material-ui/core/CircularProgress";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

import WorkerSocket from "worker-loader!../../workers/socket.worker";

import { getGlobalSessionKey } from "../../utils/utils";
import * as actionTypes from "../../constants/actionTypes";

function AlgorithmHelpContent(props) {
    const [textContent, setTextContent] = useState(null);

    useEffect(
        _ => {
            if (props.hidden) return;
            let socketWorker = new WorkerSocket();

            socketWorker.addEventListener("message", e => {
                const textContent = JSON.parse(e.data).guidance;
                setTextContent(textContent);
            });

            socketWorker.postMessage(
                JSON.stringify({
                    action: actionTypes.GET_HELP_TEXT,
                    sessionkey: getGlobalSessionKey(),
                    path: props.guidancePath
                })
            );

            return function cleanup() {
                socketWorker.postMessage(JSON.stringify({ action: actionTypes.CLOSE_SOCKET }));
                socketWorker = null;
            };
        },
        [props.hidden]
    );

    return (
        <div className="help-container" hidden={props.hidden}>
            <div className="loading-indicator" hidden={textContent}>
                <CircularProgress />
            </div>
            <ReactMarkdown source={textContent} className="help-content" linkTarget="_blank" />
        </div>
    );
}

export default AlgorithmHelpContent;
