import "./View.css";

import React from "react";

import CodexSnackbar from "components/CodexSnackbar/CodexSnackbar";
import ConfirmationModal from "components/ConfirmationModal/ConfirmationModal";
import LeftPanel from "components/LeftPanel/LeftPanel";
import PropertyEditor from "components/PropertyEditor/PropertyEditor";
import TopBar from "components/TopBar/TopBar";
import WindowManager from "components/WindowManager/WindowManager";

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
        </div>
    );
}

export default View;
