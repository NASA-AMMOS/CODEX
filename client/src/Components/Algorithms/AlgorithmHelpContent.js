import React, { useState, useEffect } from "react";
import "components/Algorithms/algorithmStyles.scss";
import WorkerSocket from "worker-loader!workers/socket.worker";
import * as actionTypes from "constants/actionTypes";
import ReactMarkdown from "react-markdown";

function AlgorithmHelpContent(props) {
    useEffect(_ => {
        const socketWorker = new WorkerSocket();

        socketWorker.addEventListener("message", e => {
            const textContent = JSON.parse(e.data).guidance;
            props.updateTextContent(textContent);
        });

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.GET_HELP_TEXT,
                path: props.guidancePath
            })
        );
    }, []);

    return (
        <ReactMarkdown
            source={props.helpModeState.textContent}
            className="help-content"
            linkTarget="_blank"
        />
    );
}

export default AlgorithmHelpContent;
