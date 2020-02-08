import React, { useState } from "react";

import HelpContent from "components/Help/HelpContent";

import {
    WindowLayout,
    FixedContainer,
    ExpandingContainer,
    WindowTogglableCover
} from "components/WindowHelpers/WindowLayout";
import Typography from "@material-ui/core/Typography";
import HelpOutline from "@material-ui/icons/HelpOutline";
import Close from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import { WindowYScroller } from "components/WindowHelpers/WindowScroller";

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
