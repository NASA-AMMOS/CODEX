import React, { useEffect, useRef, useState } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import { useFilename, useFileUpload } from "hooks/DataHooks";
import { useUploadStatus } from "hooks/UIHooks";
import MaterialButton from "@material-ui/core/Button";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import CodeIcon from "@material-ui/icons/Code";
import SaveIcon from "@material-ui/icons/Save";
import OpenIcon from "@material-ui/icons/FolderOpen";
import DescriptionIcon from "@material-ui/icons/Description";
import CircularProgress from "@material-ui/core/CircularProgress";
import Title from "components/Title/Title";
import classNames from "classnames";
import * as selectionActions from "actions/selectionActions";
import * as exportActions from "actions/exportActions";
import "./SessionBar.css";
import * as sessionsActions from "actions/sessionsActions";
import * as uiTypes from "constants/uiTypes";
import classnames from "classnames";
import { useInterval, useTimeout } from "hooks/UtilHooks";

const SessionBar = props => {
    const filename = useFilename();
    const fileLoad = useFileUpload();
    const uploadStatus = useUploadStatus();

    const [flashSaveButton, setFlashSaveButton] = useState();

    // Load autosave session on first load
    useEffect(_ => {
        if (uiTypes.AUTOSAVE_ENABLED) props.loadSession(uiTypes.AUTOSAVE_KEY);
    }, []);

    if (uiTypes.AUTOSAVE_ENABLED) {
        useInterval(_ => {
            setFlashSaveButton(true);
            props.saveSession(uiTypes.AUTOSAVE_KEY);
        }, uiTypes.AUTOSAVE_INTERVAL);
    }

    useTimeout(_ => setFlashSaveButton(false), flashSaveButton && 300);

    useEffect(
        _ => {
            // props.removeAllSelections();
        },
        [filename]
    );

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

    const saveButtonClasses = classnames({
        "session-bar-button": true,
        highlight: flashSaveButton
    });

    return (
        <div className="session-bar">
            <div className={loadingClasses} style={loadingStyle} />
            <ul className="session-bar-list">
                <li className="session-bar-title">
                    <Title />
                </li>
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
            </ul>
        </div>
    );
};

// redux store
const mapStateToProps = state => {
    return {};
};

function mapDispatchToProps(dispatch) {
    return {
        removeAllSelections: bindActionCreators(selectionActions.removeAllSelections, dispatch),
        requestServerExport: bindActionCreators(exportActions.requestServerExport, dispatch),
        openSessionsWindow: bindActionCreators(sessionsActions.openSessionsWindow, dispatch),
        saveSession: bindActionCreators(sessionsActions.saveSession, dispatch),
        loadSession: bindActionCreators(sessionsActions.loadSession, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SessionBar);
