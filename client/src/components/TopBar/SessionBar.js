import React from "react";
import { useFilename, useFileUpload } from "hooks/DataHooks";
import { useUploadStatus } from "hooks/UIHooks";
import MaterialButton from "@material-ui/core/Button";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import CodeIcon from "@material-ui/icons/Code";
import SaveIcon from "@material-ui/icons/Save";
import OpenIcon from "@material-ui/icons/FolderOpen";
import DescriptionIcon from "@material-ui/icons/Description";
import CircularProgress from "@material-ui/core/CircularProgress";
import classNames from "classnames";

import "./SessionBar.css";

const SessionBar = props => {
    const filename = useFilename();
    const fileLoad = useFileUpload();
    const uploadStatus = useUploadStatus();

    let uploadButtonContents = null;
    if (filename === null) {
        uploadButtonContents = (
            <React.Fragment>
                <CloudUploadIcon fontSize="small" />
                &nbsp; Upload
            </React.Fragment>
        );
    } else if (filename === "") {
        uploadButtonContents = (
            <React.Fragment>
                <CircularProgress size="16px" color="inherit" />
                &nbsp; Loading...
            </React.Fragment>
        );
    } else {
        uploadButtonContents = (
            <React.Fragment>
                <DescriptionIcon fontSize="small" />
                &nbsp;
                {filename}
            </React.Fragment>
        );
    }

    // compute the loading bar status
    let loadingStyle = {};
    let loadingClasses = "";
    if (uploadStatus === null) {
        loadingClasses = classNames("session-bar-loading-bar", "session-bar-loading-bar--hidden");
    } else if (uploadStatus === "PROCESSING") {
        loadingClasses = classNames(
            "session-bar-loading-bar",
            "session-bar-loading-bar--indeterminate"
        );
    } else {
        loadingClasses = "session-bar-loading-bar";
        loadingStyle = { width: `${uploadStatus * 100}%` };
    }

    return (
        <div className="session-bar">
            <div className={loadingClasses} style={loadingStyle} />
            <ul className="session-bar-list">
                <li className="session-bar-list-element">
                    <input
                        className="session-bar-file-input inputfile"
                        multiple={false}
                        id="codex-file-upload-button"
                        name="files[]"
                        type="file"
                        hidden
                        accept=".csv,.npy,.h5"
                        onChange={e => {
                            if (e.target.files.length) fileLoad(e.target.files);
                        }}
                    />
                </li>
                <li>
                    <label htmlFor="codex-file-upload-button">
                        <MaterialButton component="span" size="small" color="inherit">
                            {uploadButtonContents}
                        </MaterialButton>
                    </label>
                </li>
                <li className="session-bar__spacer" />
                <li>
                    <MaterialButton
                        className="session-bar-button"
                        size="small"
                        color="inherit"
                        onClick={props.requestServerExport}
                    >
                        Export File &nbsp;
                        <CodeIcon fontSize="small" />
                    </MaterialButton>
                </li>
                <li>
                    <MaterialButton
                        className="session-bar-button"
                        size="small"
                        color="inherit"
                        onClick={props.openSessionsWindow}
                    >
                        Load Session &nbsp;
                        <OpenIcon fontSize="small" />
                    </MaterialButton>
                </li>
                <li>
                    <MaterialButton
                        className="session-bar-button"
                        size="small"
                        color="inherit"
                        onClick={() => {
                            props.saveSession(`${props.filename}_${new Date().toISOString()}`);
                        }}
                    >
                        Save Session &nbsp;
                        <SaveIcon fontSize="small" />
                    </MaterialButton>
                </li>
            </ul>
        </div>
    );
};

export default SessionBar;
