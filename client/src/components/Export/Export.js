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
    { key: "plots", text: "Images of open plots" },
    { key: "features", text: "Features as a CSV" },
    { key: "selections", text: "Selections as a CSV" },
    //{ key: "code", text: "Python code" }
];

function Export(props) {
    const [exportModalVisible, setExportModalVisible] = useExportModalVisible();
    const setWindowNeedsPlotImage = useSetWindowNeedsPlotImageById();
    const windowList = useWindowList();
    const [plotImages, setPlotImage] = useSetStoredPlotImage();
    const [loading, setLoading] = useState(false);
    const clearAllPlotImages = useClearAllPlotImages();

    const [itemsLoading, setItemsLoading] = useState([]);

    const graphWindows = windowList.filter(win => graphs.includes(win.get("windowType")));

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
        setLoading(true);
        if (options.plots) {
            graphWindows.forEach(win => setPlotImage(win.get("id"), null));
            graphWindows.forEach(win => setWindowNeedsPlotImage(win.get("id"), true));
            setItemsLoading(itemsLoading.concat([{ name: "plots", files: null }]));
        }

        const serverRequests = Object.entries(options)
            .filter(([key, value]) => key !== "plots" && value)
            .map(entry => {
                setItemsLoading(itemsLoading =>
                    itemsLoading.concat([{ name: entry[0], files: null }])
                );
                return entry;
            })
            .map(
                ([key]) =>
                    makeSimpleRequest({
                        routine: "export",
                        type: key
                    }).req
            );
        Promise.all(serverRequests).then(reqs =>
            reqs.forEach(data => {
                setItemsLoading(itemsLoading =>
                    itemsLoading.map(item =>
                        item.name === data.type
                            ? Object.assign(item, {
                                  files: [
                                      { filename: data.filename, data: data.data, base64: true }
                                  ]
                              })
                            : item
                    )
                );
            })
        );
    }

    useEffect(
        _ => {
            if (
                itemsLoading.find(item => item.name === "plots") &&
                plotImages.every(plot => plot.get("image"))
            ) {
                const files = plotImages
                    .map(plot => ({
                        filename: plot.get("filename").replace(/ /g, "_") + ".png",
                        data: plot.get("image").getBufferAsync("image/png")
                    }))
                    .toJS();
                setItemsLoading(
                    itemsLoading.map(item =>
                        item.name === "plots" ? Object.assign(item, { files }) : item
                    )
                );
            }
        },
        [plotImages]
    );

    useEffect(
        _ => {
            if (!itemsLoading.length || itemsLoading.some(item => !item.files)) return;
            const zip = new JSZip();
            itemsLoading.forEach(item => {
                item.files.forEach(file =>
                    zip
                        .folder(item.name)
                        .file(file.filename, file.data, { base64: Boolean(file.base64) })
                );
            });
            zip.generateAsync({ type: "base64" }).then(url => {
                const a = document.createElement("a");
                a.href = "data:application/zip;base64," + url;
                a.download = "CODEX.zip";
                a.click();
                a.remove();
            });
            setItemsLoading([]);
            clearAllPlotImages();
            setLoading(false);
            setExportModalVisible(false);
        },
        [itemsLoading]
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
                            {OPTIONS.map(opt => {
                                const disabled = opt.key === "plots" && !graphWindows.length;
                                return (
                                    <li
                                        key={opt.key}
                                        onClick={!disabled ? handleSetOption(opt.key) : null}
                                        className={disabled ? "disabled" : null}
                                    >
                                        <Checkbox
                                            checked={options[opt.key]}
                                            className="selected-checkbox"
                                            style={{ height: "22px", padding: "0px" }}
                                            icon={
                                                <CheckboxOutlineBlank style={{ fill: "#828282" }} />
                                            }
                                            checkedIcon={
                                                <CheckboxIcon style={{ fill: "#3988E3" }} />
                                            }
                                        />
                                        {opt.text}
                                    </li>
                                );
                            })}
                            <div className="export-modal-button-row">
                                <button
                                    onClick={handleClickExport}
                                    disabled={Object.values(options).every(opt => !opt)}
                                >
                                    export
                                </button>
                            </div>
                        </ul>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

export default Export;
