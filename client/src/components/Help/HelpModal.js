import "./HelpModal.scss";

import { CircularProgress, Modal } from "@material-ui/core";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import CloseIcon from "@material-ui/icons/Close";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

import WorkerSocket from "worker-loader!../../workers/socket.worker";

import { getGlobalSessionKey } from "../../utils/utils";
import { useHelpMode } from "../../hooks/UIHooks";
import * as actionTypes from "../../constants/actionTypes";

const MAIN_MENU = "MAIN_MENU";
const ABOUT = "ABOUT";
const GETTING_STARTED = "GETTING_STARTED";
const KEYBOARD_SHORTCUTS = "KEYBOARD_SHORTCUTS";
const ML_REFERENCE = "ML_REFERENCE";

const MENU_ITEMS = [
    { type: ABOUT, name: "About", guidancePath: "general:about" },
    { type: GETTING_STARTED, name: "Getting Started", guidancePath: "general:getting_started" },
    {
        type: KEYBOARD_SHORTCUTS,
        name: "Keyboard Shortcuts",
        guidancePath: "general:keyboard_shortcuts"
    },
    {
        type: ML_REFERENCE,
        name: "Machine Learning Reference",
        guidancePath: "general:machine_learning_resources"
    }
];

function HelpItem(props) {
    const [textContent, setTextContent] = useState(null);
    const guidancePath = MENU_ITEMS.find(item => item.type === props.mode).guidancePath;

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
                    path: guidancePath
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
        <div className="help-modal-text-content">
            <div className="loading-indicator" hidden={textContent}>
                <CircularProgress />
            </div>
            <ReactMarkdown source={textContent} linkTarget="_blank" />
        </div>
    );
}

function MainMenu(props) {
    const [mode, setMode] = props.modeState;
    return (
        <ul className="help-modal-menu">
            {MENU_ITEMS.map(item => (
                <li key={item.type} onClick={_ => setMode(item.type)}>
                    {item.name}
                </li>
            ))}
        </ul>
    );
}

function HelpModal(props) {
    const [helpMode, setHelpMode] = useHelpMode();

    const modeState = useState(MAIN_MENU);
    const [mode, setMode] = modeState;

    const content = (function() {
        switch (mode) {
            case MAIN_MENU:
                return <MainMenu modeState={modeState} />;
            default:
                return <HelpItem mode={mode} />;
        }
    })();

    function closeHelp() {
        setHelpMode(false);
        setMode(MAIN_MENU);
    }

    const headerText =
        mode === MAIN_MENU ? "Help" : MENU_ITEMS.find(item => item.type === mode).name;
    return (
        <div>
            <Modal open={helpMode} onClose={closeHelp}>
                <div className="help-modal-container">
                    <div className="help-modal-header">
                        <div>
                            <ArrowBackIcon
                                hidden={mode === MAIN_MENU}
                                onClick={_ => setMode(MAIN_MENU)}
                                className="help-modal-back-button"
                            />
                            <span>{headerText}</span>
                        </div>
                        <CloseIcon className="help-modal-close-icon" onClick={closeHelp} />
                    </div>
                    {content}
                </div>
            </Modal>
        </div>
    );
}

export default HelpModal;
