import { useSelector, useDispatch } from "react-redux";

import * as uiActions from "../actions/ui";

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

export function useStatsPanelHidden() {
    const dispatch = useDispatch();
    return [
        useSelector(state => state.ui.get("statsPanelHidden")),
        hidden => dispatch(uiActions.setStatsPanelHidden(hidden))
    ];
}

export function useAllowGraphHotkeys() {
    const dispatch = useDispatch();
    return [
        useSelector(state => state.ui.get("allowGraphHotkeys")),
        allow => dispatch(uiActions.setAllowGraphHotkeys(allow))
    ];
}

export function useHelpMode() {
    const dispatch = useDispatch();
    return [
        useSelector(state => state.ui.get("helpMode")),
        helpMode => dispatch(uiActions.setHelpMode(helpMode))
    ];
}

export function useExportModalVisible() {
    const dispatch = useDispatch();
    return [
        useSelector(state => state.ui.get("exportModalVisible")),
        visible => dispatch(uiActions.setExportModalVisible(visible))
    ];
}

export function useSetStoredPlotImage() {
    const dispatch = useDispatch();
    return [
        useSelector(state => state.ui.get("storedPlotImages")),
        (id, image, filename) => dispatch(uiActions.setStoredPlotImage(id, image, filename))
    ];
}

export function useClearAllPlotImages() {
    const dispatch = useDispatch();
    return _ => dispatch(uiActions.clearAllPlotImages());
}
