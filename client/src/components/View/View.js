import "./View.css";

import { hot } from "react-hot-loader";
import React from "react";
import SplitterLayout from "react-splitter-layout";

import CodexSnackbar from "../CodexSnackbar/CodexSnackbar";
import ConfirmationModal from "../ConfirmationModal/ConfirmationModal";
import Export from "../Export/Export";
import HelpModal from "../Help/HelpModal";
import KeyboardHandler from "../KeyboardHandler/KeyboardHandler";
import LeftPanel from "../LeftPanel/LeftPanel";
import PropertyEditor from "../PropertyEditor/PropertyEditor";
import TopBar from "../TopBar/TopBar";
import WindowManager from "../WindowManager/WindowManager";

function View(props) {
    const rightPane = PropertyEditor() ? (
        <SplitterLayout secondaryInitialSize={250}>
            <WindowManager />
            <PropertyEditor />
        </SplitterLayout>
    ) : (
        <WindowManager />
    );

    return (
        <div className="View noselect">
            <TopBar />

            <div className="bottom-section">
                <SplitterLayout primaryIndex={1} secondaryInitialSize={250}>
                    <LeftPanel />
                    {rightPane}
                </SplitterLayout>
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
