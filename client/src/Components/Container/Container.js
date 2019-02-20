import React, { Component } from "react";
import "components/Container/Container.css";

import WindowManager from "components/WindowManager/WindowManager";

class Container extends Component {
    render() {
        return (
            <div className="Container">
                <WindowManager />
            </div>
        );
    }
}

export default Container;
