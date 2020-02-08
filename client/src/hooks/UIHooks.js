import { useSelector, useStore, useDispatch } from "react-redux";
import * as uiActions from "actions/ui";
import * as actionTypes from "constants/actionTypes";

/**
 * Get current global graph state
 * @return tuple of getter/setter for global chart state
 */
export function useGlobalChartState() {
    const dispatch = useDispatch();
    const gcs = useSelector(state => state.ui.get("globalChartState"));

    return [gcs, state => dispatch(uiActions.changeGlobalChartState(state))];
}

/**
 * Returns the current upload status
 * @return {null/string/number} of upload status
 */
export function useUploadStatus() {
    const status = useSelector(state => state.ui.get("uploadStatus"));

    return status;
}

/**
 * Returns the current confirmation modal state
 * @return {object} of confirmation modal state
 */
export function useConfirmationModalState() {
    return useSelector(state => state.ui.get("confirmationModal"));
}

/**
 * Returns the current snackbar state
 * @return {function} to close snackbar
 */
export function useSnackbarState() {
    const dispatch = useDispatch();
    return [
        useSelector(state => state.ui.get("snackbar")),
        _ => dispatch(uiActions.hideSnackbar())
    ];
}
