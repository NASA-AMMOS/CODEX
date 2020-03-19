import Immutable from "immutable";

export const uiState = Immutable.fromJS({
    globalChartState: "lasso",
    uploadStatus: null,
    confirmationModal: {
        visible: false,
        modalType: null,
        yesFunc: null,
        noFunc: null
    },
    snackbar: {
        visible: false,
        message: null
    },
    statsPanelHidden: true,
    allowGraphHotkeys: true,
    helpMode: false,
    exportModalVisible: false
});
