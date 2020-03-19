import "./Export.scss";

import { Checkbox, Modal } from "@material-ui/core";
import CheckboxIcon from "@material-ui/icons/CheckBox";
import CheckboxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import JSZip from "jszip";
import React, { useState, useEffect } from "react";

import { CloseIcon } from "../../react-cristal/src/styled";
import { WindowCircularProgress } from "../WindowHelpers/WindowCenter";
import { graphs } from "../../constants/windowTypes";
import { makeSimpleRequest } from "../../utils/utils";
import {
    useClearAllPlotImages,
    useExportModalVisible,
    useSetStoredPlotImage
} from "../../hooks/UIHooks";
import { useSetWindowNeedsPlotImageById, useWindowList } from "../../hooks/WindowHooks";

const OPTIONS = [
    { key: "images", text: "Images of open plots" },
    { key: "selections", text: "Selections as a CSV" },
    { key: "features", text: "Features as a CSV" },
    { key: "code", text: "Python code" }
];

function Export(props) {
    const [exportModalVisible, setExportModalVisible] = useExportModalVisible();
    const setWindowNeedsPlotImage = useSetWindowNeedsPlotImageById();
    const windowList = useWindowList();
    const [plotImages, setPlotImage] = useSetStoredPlotImage();
    const [loading, setLoading] = useState(false);
    const clearAllPlotImages = useClearAllPlotImages();

    const [options, setOptions] = useState(
        OPTIONS.reduce((acc, opt) => {
            acc[opt.key] = false;
            return acc;
        }, {})
    );

    function closeExport() {
        setExportModalVisible(false);
    }

    function handleSetOption(name) {
        return e => setOptions({ ...options, [name]: !options[name] });
    }

    function handleClickExport() {
        if (options.images) {
            setLoading(true);
            const graphWindows = windowList.filter(win => graphs.includes(win.get("windowType")));
            graphWindows.forEach(win => setPlotImage(win.get("id"), null));
            graphWindows.forEach(win => setWindowNeedsPlotImage(win.get("id"), true));
        }

        const serverRequests = Object.entries(options)
            .filter(([key, value]) => key !== "images" && value)
            .map(
                ([key]) =>
                    makeSimpleRequest({
                        routine: "export",
                        type: key
                    }).req
            );
        Promise.all(serverRequests).then(reqs => reqs.forEach(data => console.log(data)));
    }

    useEffect(
        _ => {
            if (loading && plotImages.every(plot => plot.get("image"))) {
                const zip = new JSZip();
                plotImages.forEach(plot =>
                    zip.file(plot.get("filename"), plot.get("image").getBufferAsync("image/png"))
                );
                zip.generateAsync({ type: "base64" }).then(url => {
                    const a = document.createElement("a");
                    a.href = "data:application/zip;base64," + url;
                    a.download = "CODEX.zip";
                    a.click();
                    a.remove();
                });
                clearAllPlotImages();
                setLoading(false);
            }
        },
        [plotImages]
    );

    return (
        <div>
            <Modal open={exportModalVisible} onClose={closeExport}>
                <div className="export-modal-container">
                    <div className="export-modal-header">
                        <div>
                            <span>Export</span>
                        </div>
                        <CloseIcon className="export-modal-close-icon" onClick={closeExport} />
                    </div>
                    <div className="export-modal-loading-overlay" hidden={!loading}>
                        <WindowCircularProgress />
                    </div>
                    <div className="export-modal-content">
                        <ul>
                            <div className="export-modal-explanation-text">
                                Choose what you would like to export.
                            </div>
                            {OPTIONS.map(opt => (
                                <li key={opt.key} onClick={handleSetOption(opt.key)}>
                                    <Checkbox
                                        checked={options[opt.key]}
                                        className="selected-checkbox"
                                        style={{ height: "22px", padding: "0px" }}
                                        icon={<CheckboxOutlineBlank style={{ fill: "#828282" }} />}
                                        checkedIcon={<CheckboxIcon style={{ fill: "#3988E3" }} />}
                                    />
                                    {opt.text}
                                </li>
                            ))}
                            <div className="export-modal-button-row">
                                <button onClick={handleClickExport}>export</button>
                            </div>
                        </ul>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Export;
