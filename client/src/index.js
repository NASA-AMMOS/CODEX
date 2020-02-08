import "bootstrap/dist/css/bootstrap.css";

import "styles/index.css";
import "styles/fonts.css";
import "styles/react-contextmenu.css";

import { Provider } from "react-redux";
import React from "react";
import ReactDOM from "react-dom";

import View from "components/View/View";
import configureStore from "store";
import registerServiceWorker from "registerServiceWorker";

export const store = configureStore();

ReactDOM.render(
    <Provider store={store}>
        <View />
    </Provider>,
    document.getElementById("root")
);

registerServiceWorker();
