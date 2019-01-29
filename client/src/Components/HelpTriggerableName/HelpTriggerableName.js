import React, { Component } from "react";
import "./HelpTriggerableName.css";

class HelpTriggerableName extends Component {
    render() {
        let mainClass = "HelpTriggerableName";
        if (this.props.spacebetween) mainClass += " spacebetween";

        return (
            <div className={mainClass}>
                <div id="helpname" onClick={() => this.props.nameClick()}>
                    {this.props.name}
                </div>
                <div
                    id="helptrigger"
                    title="Help"
                    onClick={() => this.props.trigger(this.props.guidancePath)}
                />
            </div>
        );
    }
}

export default HelpTriggerableName;
