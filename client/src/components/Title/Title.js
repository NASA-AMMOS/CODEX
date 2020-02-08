import React, { Component } from "react";

// Be sure to include styles at some point, probably during your bootstraping
import "@trendmicro/react-buttons/dist/react-buttons.css";
import "@trendmicro/react-dropdown/dist/react-dropdown.css";

import "./Title.css";

class Title extends Component {
    render() {
        return (
            <div className="Title">
                <div id="title">CODEX</div>
            </div>
        );
    }
}

export default Title;
