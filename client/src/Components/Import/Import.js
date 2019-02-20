import "components/Import/Import.css";

import { connect } from "react-redux";
import React from "react";

import { fileLoad } from "actions/data";
import WorkerUpload from "worker-loader!workers/upload.worker";

function Import(props) {
    function uploadClick(e) {
        const workerUpload = new WorkerUpload();

        // Clear out list of feature names while we handle new file
        props.fileLoad([], "");
        if (e.target.files.length) {
            workerUpload.addEventListener("message", msg => {
                const res = JSON.parse(msg.data);
                if (res.status === "complete") props.fileLoad(res.feature_names, res.filename);
            });

            workerUpload.postMessage({
                files: e.target.files,
                NODE_ENV: process.env.NODE_ENV
            });
        }
    }

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
                        onChange={uploadClick}
                        accept=".csv,.npy,.h5"
                    />
                </div>
            </div>
        </div>
    );
}

const mapDispatchToProps = dispatch => ({
    fileLoad: (data, name) => dispatch(fileLoad(data, name))
});

export default connect(
    null,
    mapDispatchToProps
)(Import);
