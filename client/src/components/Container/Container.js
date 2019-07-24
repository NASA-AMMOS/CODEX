import React, { Component } from "react";
import "components/Container/Container.css";

import RightPanel from "components/RightPanel/RightPanel";
import WindowManager from "components/WindowManager/WindowManager";

class Container extends Component {
    render() {
        return (
            <div className="Container" id="Container">
                <WindowManager />
            </div>
        );
    }
}

export default Container;
