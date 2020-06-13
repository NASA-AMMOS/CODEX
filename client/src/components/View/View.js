import "./View.css";

import React from "react";

import CodexSnackbar from "../CodexSnackbar/CodexSnackbar";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
import LeftPanel from "../LeftPanel/LeftPanel";
import PropertyEditor from "../PropertyEditor/PropertyEditor";
import TopBar from "../TopBar/TopBar";
import WindowManager from "../WindowManager/WindowManager";
import { hot } from "react-hot-loader";
import KeyboardHandler from "../KeyboardHandler/KeyboardHandler";
import HelpModal from "../Help/HelpModal";
import Export from "../Export/Export";

function View(props) {
    return (
        <div className="View noselect">
            <TopBar />

            <div className="bottom-section">
                <LeftPanel />
                <WindowManager />
                <PropertyEditor />
            </div>
            <ConfirmationModal />
            <CodexSnackbar />
            <KeyboardHandler />
            <HelpModal />
            <Export />
        </div>
    );
}

export default hot(module)(View);
