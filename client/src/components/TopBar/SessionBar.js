import "./SessionBar.css";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import CircularProgress from "@material-ui/core/CircularProgress";
import CloudUploadIcon from "@material-ui/icons/CloudUpload";
import DescriptionIcon from "@material-ui/icons/Description";
import HelpOutlineIcon from "@material-ui/icons/HelpOutline";
import MaterialButton from "@material-ui/core/Button";
import React, { useEffect, useState } from "react";

import classnames from "classnames";

import { useFilename, useFileUpload } from "../../hooks/DataHooks";
import { useHelpMode, useUploadStatus } from "../../hooks/UIHooks";
import { useInterval, useTimeout } from "../../hooks/UtilHooks";
import Title from "../Title/Title";
import * as exportActions from "../../actions/exportActions";
import * as selectionActions from "../../actions/selectionActions";
import * as sessionsActions from "../../actions/sessionsActions";
import * as uiTypes from "../../constants/uiTypes";

const SessionBar = props => {
    const filename = useFilename();
    const fileLoad = useFileUpload();
    const uploadStatus = useUploadStatus();
    const [helpMode, setHelpMode] = useHelpMode();

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
        loadingClasses = classnames("session-bar-loading-bar", "session-bar-loading-bar--hidden");
    } else if (uploadStatus === "PROCESSING") {
        loadingClasses = classnames(
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
            <HelpOutlineIcon onClick={_ => setHelpMode(!helpMode)} className="help-icon" />
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
