import "./GraphWrapper.css";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import Plotly from "plotly.js";
import Popover from "@material-ui/core/Popover";
import React, { useState, useEffect } from "react";
import ReactResizeDetector from "react-resize-detector";
import mergeImg from "merge-img";

import { useSetStoredPlotImage } from "../../hooks/UIHooks";
import { useSetWindowNeedsPlotImage } from "../../hooks/WindowHooks";
import * as selectionActions from "../../actions/selectionActions";

const Jimp = require("jimp");

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_SELECTION_COLOR = "#FF0000";

export const useBoxSelection = (type, currentSelection, savedSelections, data) => {
    //ignoring type for now.
    const [shapes, setShapes] = useState([]);

    const createRectangle = (range, color, hidden, id) => {
        let opaqueColor = color + "80";
        let rect = {
            type: "rect",
            xref: "x",
            yref: "y",
            fillcolor: opaqueColor,
            line: {
                width: 0
            },
            visible: !hidden,
            selectionId: id
        };

        if (type === "vertical") {
            rect = {
                ...rect,
                x0: -0.5,
                y0: range.min,
                x1: 0.5,
                y1: range.max
            };
        } else if (type === "horizontal") {
            return {
                ...rect,
                yref: "paper",
                x0: range.min,
                y0: 0,
                x1: range.max,
                y1: 1
            };
        }
        return rect;
    };

    const getRangesFromIndices = indices => {
        let min = data[0];
        let max = data[0];
        data.forEach(row => {
            min = row < min ? row : min;
            max = row > max ? row : max;
        });

        const numBuckets = 50;
        const divisor = (max - min) / numBuckets;

        function squashDataIntoBuckets() {
            let ret = new Array(numBuckets).fill(0);

            for (let index of indices) {
                let value = Math.floor((data[index] - min) / divisor);
                ret[value] += 1;
            }
            return ret;
        }
        let buckets = squashDataIntoBuckets();

        let ranges = [];
        for (let i = 0; i < buckets.length; i++) {
            if (buckets[i] > 0) {
                ranges.push({ min: min + divisor * i, max: min + divisor * (i + 1) });
            }
        }
        //todo squash adjacent buckets so there is no white line
        return ranges;
    };

    //effect hook that manages the creation of selection rectangles
    useEffect(
        _ => {
            //add range to the selection state and optimize this
            let newShapes = [];

            const mappedSavedSelections = savedSelections
                .concat()
                .reverse()
                .map(selection => {
                    return {
                        indices: selection.rowIndices,
                        color: selection.color,
                        active: selection.active,
                        hidden: selection.hidden
                    };
                });

            let allSelections = [...mappedSavedSelections];
            if (currentSelection.length != 0)
                allSelections.push({
                    indices: currentSelection,
                    color: DEFAULT_SELECTION_COLOR,
                    active: true,
                    hidden: false
                });

            //check to see if there are any selections to render
            if (allSelections.length != 0) {
                allSelections.forEach(selection => {
                    const selectionRanges = getRangesFromIndices(selection.indices);
                    for (let range of selectionRanges) {
                        const rect = createRectangle(
                            range,
                            selection.color,
                            selection.hidden,
                            selection.id
                        );
                        newShapes.push(rect);
                    }
                });
            }

            setShapes(newShapes);
        },
        [savedSelections, currentSelection]
    );

    return [shapes];
};

function downloadImage(image, title) {
    image.getBase64Async("image/png").then(url => {
        const a = document.createElement("a");
        a.href = url;
        a.download = title;
        a.click();
        a.remove();
    });
}

function makeTitleImage(title, width) {
    return new Promise(resolve => {
        new Jimp(width, 40, "#ffffff", (err, image) => {
            Jimp.loadFont("./styles/resources/Fonts/jimp/open-sans-32-black.fnt").then(font => {
                image.print(
                    font,
                    0,
                    0,
                    {
                        text: title,
                        alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
                    },
                    width,
                    40
                );
                resolve(image);
            });
        });
    });
}

function handleSingleChartDownload(chartId, title) {
    const width = 800;
    return async returnImage => {
        const titleImage = await makeTitleImage(title, width);
        const graphImage = await Plotly.toImage(chartId, {
            format: "png",
            width,
            height: 800,
            filename: title
        });
        const mergedImages = await mergeImg([titleImage, graphImage], { direction: true });
        return returnImage ? mergedImages : downloadImage(mergedImages, title);
    };
}

function handleMultipleChartDownload(chartIds, title, stacked) {
    const width = 800;
    return async returnImage => {
        const img = Promise.all(
            chartIds.map(id => Plotly.toImage(id, { format: "png", width, height: 400 }))
        )
            .then(urls => Promise.all(urls.map(url => Jimp.read(url))))
            .then(images => mergeImg(images, { direction: stacked }))
            .then(chartImage =>
                makeTitleImage(title, stacked ? width : width * chartIds.length).then(titleImage =>
                    mergeImg([titleImage, chartImage], { direction: true })
                )
            );
        return returnImage ? img : downloadImage(img, title);
    };
}

function GraphWrapper(props) {
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });
    const [needsPlotImage, setNeedsPlotImage] = useSetWindowNeedsPlotImage(props.win.id);
    const [_, setStoredPlotImage] = useSetStoredPlotImage();

    //you either need a custom resize handler or to give GraphWrapper chart
    const resizeHandler =
        props.resizeHandler !== undefined
            ? props.resizeHandler
            : _ => props.chart.current.resizeHandler();

    function handleContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuVisible(true);
        setContextMenuPosition({ top: e.clientY, left: e.clientX });
    }

    const saveImageFunction = props.saveImageFunction
        ? props.saveImageFunction
        : props.chartId
        ? handleSingleChartDownload(props.chartId, props.win.title)
        : handleMultipleChartDownload(props.chartIds, props.win.title, props.stacked);

    useEffect(
        _ => {
            if (needsPlotImage) {
                saveImageFunction(true).then(image => {
                    setStoredPlotImage(props.win.id, image, props.win.title);
                    setNeedsPlotImage(false);
                });
            }
        },
        [needsPlotImage]
    );

    return (
        <React.Fragment>
            <ReactResizeDetector handleWidth handleHeight onResize={resizeHandler} />
            <div className="chart-container" onContextMenu={handleContextMenu}>
                {props.children}
            </div>
            <Popover
                id="simple-popper"
                open={contextMenuVisible}
                anchorReference="anchorPosition"
                anchorPosition={{ top: contextMenuPosition.top, left: contextMenuPosition.left }}
                anchorOrigin={{
                    vertical: "bottom",
                    horizontal: "left"
                }}
                transformOrigin={{
                    vertical: "top",
                    horizontal: "left"
                }}
            >
                <ClickAwayListener onClickAway={_ => setContextMenuVisible(false)}>
                    <List>
                        <ListItem
                            button
                            onClick={_ => {
                                setContextMenuVisible(false);
                                props.saveCurrentSelection();
                            }}
                        >
                            Save Selection
                        </ListItem>
                        <ListItem
                            button
                            onClick={_ => {
                                saveImageFunction();
                                setContextMenuVisible(false);
                            }}
                        >
                            Save Plot
                        </ListItem>
                    </List>
                </ClickAwayListener>
            </Popover>
        </React.Fragment>
    );
}

function mapStateToProps(state) {
    return {
        currentSelection: state.selections.currentSelection,
        savedSelections: state.selections.savedSelections
    };
}

function mapDispatchToProps(dispatch) {
    return {
        setCurrentSelection: bindActionCreators(selectionActions.setCurrentSelection, dispatch),
        saveCurrentSelection: bindActionCreators(selectionActions.saveCurrentSelection, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(GraphWrapper);
