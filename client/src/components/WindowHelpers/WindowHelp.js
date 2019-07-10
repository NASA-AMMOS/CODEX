import React, { useState } from "react";

import HelpContent from "components/Help/HelpContent";

import {
    WindowLayout,
    FixedContainer,
    ExpandingContainer
} from "components/WindowHelpers/WindowLayout";
import Typography from "@material-ui/core/Typography";
import HelpOutline from "@material-ui/icons/HelpOutline";
import Close from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import { WindowYScroller } from "components/WindowHelpers/WindowScroller";
import "./WindowHelp.css";

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
                <div className="HelpButton__content">
                    <WindowLayout>
                        <WindowLayout fluid direction="row" align="center">
                            <Typography variant="h6">{props.title}</Typography>
                            <ExpandingContainer />
                            <FixedContainer>
                                <IconButton onClick={() => setHelpActive(false)}>
                                    <Close />
                                </IconButton>
                            </FixedContainer>
                        </WindowLayout>
                        <ExpandingContainer>
                            <HelpContent guidancePath={props.guidancePath} />
                        </ExpandingContainer>
                    </WindowLayout>
                </div>
            )}
        </React.Fragment>
    );
};

export default HelpButton;
