import React from "react";
import ReactDOM from "react-dom";
import "css/fonts.css";
import "index.css";

//Other global css'
import "css/react-contextmenu.css";
import "bootstrap/dist/css/bootstrap.css";

import Main from "Components/Main/Main";
import registerServiceWorker from "registerServiceWorker";

// redux setup
import { Provider } from "react-redux";
import configureStore from "store";

// solely for use in old singletons
export const BANDAID_PATCH_STORE = store;

const store = configureStore();

ReactDOM.render(
    <Provider store={store}>
        <Main />
    </Provider>,
    document.getElementById("root")
);

registerServiceWorker();
