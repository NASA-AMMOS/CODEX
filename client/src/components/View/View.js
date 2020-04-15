import "./View.css";

import React from "react";

import CodexSnackbar from "components/CodexSnackbar/CodexSnackbar";
import ConfirmationModal from "components/ConfirmationModal/ConfirmationModal";
import LeftPanel from "components/LeftPanel/LeftPanel";
import PropertyEditor from "components/PropertyEditor/PropertyEditor";
import TopBar from "components/TopBar/TopBar";
import WindowManager from "components/WindowManager/WindowManager";
import { hot } from "react-hot-loader";
import KeyboardHandler from "components/KeyboardHandler/KeyboardHandler";
import HelpModal from "components/Help/HelpModal";
import Export from "components/Export/Export";

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
