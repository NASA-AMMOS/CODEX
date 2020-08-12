import React from "react";
import Button from "@material-ui/core/Button";
import { useWindowManager } from "../../hooks/WindowHooks.js";
import dialogBoxContent from "./dialogBoxContent";
import { WindowLayout } from "../WindowHelpers/WindowLayout";
import "./DialogBox.css";

const DialogBox = props => {
    const win = useWindowManager(props, {
        width: 400,
        height: 250,
        minSize: {
            width: 400,
            height: 250
        }
    });

    console.log(win);

    const boxContent = dialogBoxContent(win);

    return (
        <WindowLayout direction="column" align="stretch">
            <div class="DialogBox__content">{boxContent}</div>
            <div class="DialogBox__actions">
                <Button onClick={() => win.close()} variant="contained" color="primary">
                    Okay
                </Button>
            </div>
        </WindowLayout>
    );
};

export default DialogBox;
