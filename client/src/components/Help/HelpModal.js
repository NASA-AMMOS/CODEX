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
    {
        type: KEYBOARD_SHORTCUTS,
        name: "Keyboard Shortcuts",
        guidancePath: "general:keyboard_shortcuts"
    }
];

function HelpItem(props) {
    const [textContent, setTextContent] = useState(null);
    // const guidancePath = MENU_ITEMS.find(item => item.type === props.mode).guidancePath;

    useEffect(
        _ => {
            async function getAboutText() {
                const res = await fetch("/public/user_guide.md");
                if (res.ok) {
                    setTextContent(
                        (await res.text()).replace(/user_guide_images/g, "public/user_guide_images")
                    );
                }
            }
            getAboutText();
        },
        [props.hidden]
    );

    return (
        <div className="help-modal-text-content">
            <div className="loading-indicator" hidden={textContent}>
                <CircularProgress />
            </div>
            <div className="about-content">
                <ReactMarkdown source={textContent} linkTarget="_blank" />
            </div>
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

    // const content = (function() {
    //     switch (mode) {
    //         case MAIN_MENU:
    //             return <MainMenu modeState={modeState} />;
    //         default:
    //             return ;
    //     }
    // })();

    function closeHelp() {
        setHelpMode(false);
        setMode(MAIN_MENU);
    }

    // const headerText =
    //     mode === MAIN_MENU ? "Help" : MENU_ITEMS.find(item => item.type === mode).name;
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
                            <span>Help</span>
                        </div>
                        <CloseIcon className="help-modal-close-icon" onClick={closeHelp} />
                    </div>
                    <HelpItem mode={mode} />
                </div>
            </Modal>
        </div>
    );
}

export default HelpModal;
