import React, { Component } from "react";
import "./Export.css";

import { invocation } from "../../invocation/invocation";

class Export extends Component {
    export() {
        invocation.invoke({ routine: "download_code" }, reaction.bind(this));

        function reaction(r) {
            this.dl.href = "data:application/octet-stream;base64," + r.code;
            this.dl.click();
        }
    }

    render() {
        return (
            <div className="Export">
                <div id="container">
                    <a
                        id="exportdownloadlink"
                        ref={a => {
                            this.dl = a;
                        }}
                        download="CodexCode.py"
                    />
                    <a id="export" onClick={() => this.export()}>
                        Export
                    </a>
                </div>
            </div>
        );
    }
}

export default Export;
