import Immutable from "immutable";
import * as uiActions from "actions/ui";

export default class UiReducer {
    static changeGlobalChartState(state, action) {
        return state.set("globalChartState", action.chartState);
    }

    static setUploadStatusUploading(state, action) {
        return state.set("uploadStatus", action.percentage);
    }

    static setUploadStatusProcessing(state, action) {
        return state.set("uploadStatus", "PROCESSING");
    }

    static setUploadStatusDone(state, action) {
        return state.set("uploadStatus", null);
    }

    static showConfirmationModal(state, action) {
        const modalState = Immutable.fromJS({
            visible: true,
            modalType: action.modalType,
            yesFunc: action.yesFunc,
            noFunc: action.noFunc || uiActions.hideConfirmationModal
        });
        return state.set("confirmationModal", modalState);
    }

    static hideConfirmationModal(state, action) {
        const modalState = Immutable.fromJS({
            visible: false,
            modalType: null,
            yesFunc: null,
            noFunc: null
        });
        return state.set("confirmationModal", modalState);
    }

    static showSnackbar(state, action) {
        const snackbarState = Immutable.fromJS({
            visible: action.visible,
            message: action.message
        });
        return state.set("snackbar", snackbarState);
    }

    static setStatsPanelHidden(state, action) {
        return state.set("statsPanelHidden", action.hidden);
    }

    static setAllowGraphHotkeys(state, action) {
        return state.set("allowGraphHotkeys", action.allow);
    }

    static setHelpMode(state, action) {
        return state.set("helpMode", action.helpMode);
    }
}
