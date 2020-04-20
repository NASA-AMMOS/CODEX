import HelpOutline from "@material-ui/icons/HelpOutline";
import IconButton from "@material-ui/core/IconButton";
import React, { useState } from "react";

import { WindowTogglableCover } from "./WindowLayout";
import HelpContent from "../Help/HelpContent";

/**
 * Shows a help button, that when clicked, draws the help over the window
 */
const HelpButton = props => {
    const [helpActive, setHelpActive] = useState(false);

    return (
        <React.Fragment>
            <IconButton onClick={() => setHelpActive(true)}>
                <HelpOutline />
            </IconButton>

            {!helpActive || (
                <WindowTogglableCover
                    open={helpActive}
                    onClose={() => setHelpActive(false)}
                    title={props.title}
                >
                    <HelpContent guidancePath={props.guidancePath} />
                </WindowTogglableCover>
            )}
        </React.Fragment>
    );
};

export default HelpButton;
