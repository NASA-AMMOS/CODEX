import "components/Import/Import.css";

import { connect } from "react-redux";
import React from "react";

import * as dataActions from "actions/data";
import WorkerUpload from "worker-loader!workers/upload.worker";
import { bindActionCreators } from "redux";

function Import(props) {
    return (
        <div className="Import">
            <div id="container">
                <div id="inputfilebutton">
                    Import
                    <input
                        id="inputfile"
                        multiple={true}
                        name="files[]"
                        type="file"
                        onChange={e => props.fileLoad(e.target.files)}
                        accept=".csv,.npy,.h5"
                    />
                </div>
            </div>
        </div>
    );
}

const mapDispatchToProps = dispatch => ({
    fileLoad: bindActionCreators(dataActions.fileLoad, dispatch)
});

export default connect(
    null,
    mapDispatchToProps
)(Import);
