import Immutable from "immutable";

export const windowManagerState = Immutable.fromJS({
    windows: [],
    tileActionPending: false
});

export const windowModel = {
    id: null,
    minimized: false,
    hover: false
};
