import "components/Graphs/GraphWrapper.css";
import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import * as selectionActions from "actions/selectionActions";
import Popover from "@material-ui/core/Popover";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import ReactResizeDetector from "react-resize-detector";

const DEFAULT_POINT_COLOR = "#3386E6";
const DEFAULT_SELECTION_COLOR = "#FF0000";

export const useBoxSelection = (type, currentSelection, savedSelections, data) => {
    //ignoring type for now.
    const [shapes, setShapes] = useState([]);

    const createRectangle = (range, color) => {
        let opaqueColor = color + "80";
        let rect = {
            type: "rect",
            xref: "x",
            yref: "y",
            fillcolor: opaqueColor,
            line: {
                width: 0
            }
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

    const getRangeFromIndices = indices => {
        let min = data[indices[0]];
        let max = data[indices[0]];
        indices.forEach(row => {
            min = data[row] < min ? data[row] : min;
            max = data[row] > max ? data[row] : max;
        });
        return { min: min, max: max };
    };

    //effect hook that manages the creation of selection rectangles
    useEffect(
        _ => {
            //add range to the selection state and optimize this
            let newShapes = [];

            const mappedSavedSelections = savedSelections.map(selection => {
                return { indices: selection.rowIndices, color: selection.color };
            });

            let allSelections = [...mappedSavedSelections];
            if (currentSelection.length != 0)
                allSelections.push({ indices: currentSelection, color: DEFAULT_SELECTION_COLOR });

            //check to see if there are any selections to render
            if (allSelections.length != 0) {
                allSelections.forEach(selection => {
                    const selectionRange = getRangeFromIndices(selection.indices);
                    const rect = createRectangle(selectionRange, selection.color);

                    newShapes.push(rect);
                });
            }

            setShapes(newShapes);
        },
        [savedSelections, currentSelection]
    );

    return [shapes];
};

function GraphWrapper(props) {
    const [contextMenuVisible, setContextMenuVisible] = useState(false);
    const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });

    //you either need a custom resize handler or to give GraphWrapper chart
    const resizeHandler =
        props.resizeHandler != undefined
            ? props.resizeHandler
            : _ => props.chart.current.resizeHandler();

    function handleContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        setContextMenuVisible(true);
        setContextMenuPosition({ top: e.clientY, left: e.clientX });
    }

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
