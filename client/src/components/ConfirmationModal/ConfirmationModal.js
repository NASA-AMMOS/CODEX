import { useDispatch } from "react-redux";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import React from "react";

import { useConfirmationModalState } from "../../hooks/UIHooks";
import * as appStrings from "../../constants/appStrings";
import * as uiActions from "../../actions/ui";

function ConfirmationModal(props) {
    const confirmationModalState = useConfirmationModalState();
    const dispatch = useDispatch();

    if (!confirmationModalState.get("visible")) return null; // Don't render if we don't need it

    const modalStrings = appStrings.CONFIRMATION_MESSAGES[confirmationModalState.get("modalType")];

    function handleNo() {
        dispatch(confirmationModalState.get("noFunc")());
    }

    function handleYes() {
        dispatch(confirmationModalState.get("yesFunc")());
        dispatch(uiActions.hideConfirmationModal());
    }

    return (
        <Dialog
            open={confirmationModalState.get("visible")}
            onClose={handleNo}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">{modalStrings.title}</DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {modalStrings.message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleNo} color="primary">
                    No
                </Button>
                <Button onClick={handleYes} color="primary" autoFocus>
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default ConfirmationModal;
