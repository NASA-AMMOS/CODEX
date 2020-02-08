import * as windowTypes from "constants/windowTypes";

export const defaultInitialSettings = {
    width: 650,
    height: 500,
    isResizable: true,
    title: "",
    minSize: {
        width: 100,
        height: 100
    }
};

export const initialSettingsByWindowType = {
    [windowTypes.QUALITY_SCAN_WINDOW]: {
        wrapperStyle: {
            background: "black",
            padding: 0
        },
        isFullscreen: true,
        isResizable: false
    }
};
