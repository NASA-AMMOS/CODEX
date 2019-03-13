import React, { useState, useEffect } from "react";
import "components/Algorithms/algorithmStyles.scss";
import WorkerSocket from "worker-loader!workers/socket.worker";
import * as actionTypes from "constants/actionTypes";
import ReactMarkdown from "react-markdown";
import CircularProgress from "@material-ui/core/CircularProgress";

function AlgorithmHelpContent(props) {
    const [textContent, setTextContent] = useState(null);

    useEffect(_ => {
        let socketWorker = new WorkerSocket();

        socketWorker.addEventListener("message", e => {
            const textContent = JSON.parse(e.data).guidance;
            setTextContent(textContent);
        });

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.GET_HELP_TEXT,
                path: props.guidancePath
            })
        );

        return function cleanup() {
            socketWorker.postMessage(JSON.stringify({ action: actionTypes.CLOSE_SOCKET }));
            socketWorker = null;
        };
    }, []);

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
