import "./SelectionsList.css";

import { ContextMenu, MenuItem, ContextMenuTrigger } from "react-contextmenu";
import { SketchPicker } from "react-color";
import { SortableContainer, SortableElement, arrayMove } from "react-sortable-hoc";
import { connect } from "react-redux";
import IPropTypes from "react-immutable-proptypes";
import PropTypes from "prop-types";
import React, { Component, Fragment } from "react";
import classnames from "classnames";

import { formulas } from "formulas/formulas";
import {
    selectionToggle,
    selectionEmphasisToggle,
    selectionRecolor,
    selectionReorder,
    selectionRename,
    selectionRemove
} from "actions/data";

class SelectionsList extends Component {
    constructor(props) {
        super(props);

        this.state = { editedName: null, editedColor: null };

        this._refs = {
            colorBoxes: []
        };
    }
    /**
     * Create a single selection element
     */
    createSelection(name, color, visible, emphasize, index) {
        // computed style for the color opener button
        const style = { backgroundColor: color };

        // computed ids for the context menu and the color popover
        const menuID = `selection_menu_${name}_${index}`;
        const colorID = `selection_color_${name}_${index}`;

        /* Fragment containing
         *  1) list element (wrapped by context trigger)
         *  2) context menu
         *  3) popover for this element
         */
        return (
            <Fragment key={index}>
                <li
                    className={classnames("SelectionsList__selection", {
                        "SelectionsList__selection--selected": visible
                    })}
                    onClick={() => this.props.selectionToggle(index)}
                >
                    <div
                        className="SelectionsList__checkbox"
                        id={colorID}
                        ref={r => (this._refs.colorBoxes[index] = r)}
                        onContextMenu={e => {
                            e.preventDefault();
                            if (this.state.editedColor === index)
                                this.setState({ editedColor: null });
                            else this.setState({ editedColor: index });
                        }}
                        style={style}
                    />

                    <Fragment />

                    <ContextMenuTrigger
                        id={menuID}
                        attributes={{ className: "SelectionsList__Trigger" }}
                    >
                        {this.state.editedName === index ? (
                            <input
                                className="SelectionsList__rename"
                                defaultValue={name}
                                autoFocus={true}
                                onKeyUp={e => {
                                    // if we hit enter close the input
                                    if (e.keyCode === 13 || e.keyCode === 27) {
                                        this.setState({ editedName: null });
                                        this.props.selectionRename(index, e.target.value);
                                    }
                                }}
                                onBlur={e => {
                                    this.setState({ editedName: null });
                                    this.props.selectionRename(index, e.target.value);
                                }}
                            />
                        ) : (
                            formulas.markSubstring(name, this.props.filterString)
                        )}
                    </ContextMenuTrigger>
                </li>
                <ContextMenu id={menuID}>
                    <MenuItem onClick={() => this.setState({ editedName: index })}>
                        Rename "{name}"
                    </MenuItem>
                    <MenuItem>Change color</MenuItem>
                    <MenuItem onClick={() => this.props.selectionEmphasisToggle(index)}>
                        Toggle emphasis
                    </MenuItem>
                    <MenuItem divider />
                    <MenuItem
                        className="SelectionsList--danger"
                        onClick={() => this.props.selectionRemove(index)}
                    >
                        Remove "{name}"
                    </MenuItem>
                </ContextMenu>
            </Fragment>
        );
    }

    render() {
        // create the sortable item helper for the selections list
        const SortableItem = SortableElement(({ value }) => value);

        // prepare the selections list
        const selections = this.props.selections
            .filter(m => m.remove("mask")) // remove the mask before copying to JS
            .toJS() // JS copy
            // apply filtration from Panel
            .filter(n => {
                switch (this.props.onOffAll) {
                    case "all":
                        if (this.props.filterString === "") return true;
                        return (
                            n.name.toLowerCase().indexOf(this.props.filterString.toLowerCase()) !==
                            -1
                        );
                        break;
                    case "on":
                        if (this.props.filterString === "" && n.visible) return true;
                        return (
                            n.name.toLowerCase().indexOf(this.props.filterString.toLowerCase()) !==
                                -1 && n.visible
                        );
                        break;
                    case "off":
                        if (this.props.filterString === "" && !n.visible) return true;
                        return (
                            n.name.toLowerCase().indexOf(this.props.filterString.toLowerCase()) !==
                                -1 && !n.visible
                        );
                        break;
                    default:
                        return true;
                }
            })
            // create the selection element
            .map((n, i) => this.createSelection(n.name, n.color, n.visible, n.emphasize, i))
            // upgrade to SortableElements
            .map((el, i) => (
                <div key={`sel-sort-${i}`}>
                    <SortableItem index={i} helperClass="SelectionsList__dragged" value={el} />
                    {i === this.state.editedColor ? (
                        <div className="selectionListPopover">
                            <div className="selectionListPopoverArrow" />
                            <SketchPicker
                                className="selectionListColorPicker"
                                disableAlpha={true}
                                onChange={(color, e) => {
                                    this._refs.colorBoxes[i].style.backgroundColor = color.hex;
                                }}
                                presetColors={[
                                    "#f44336",
                                    "#e91e63",
                                    "#9c27b0",
                                    "#673ab7",
                                    "#3f51b5",
                                    "#2196f3",
                                    "#03a9f4",
                                    "#00bcd4",
                                    "#009688",
                                    "#4caf50",
                                    "#8bc34a",
                                    "#cddc39",
                                    "#ffeb3b",
                                    "#ffc107",
                                    "#ff9800",
                                    "#ff5722",
                                    "#795548",
                                    "#607d8b"
                                ]}
                            />
                            <div
                                id="selectionListColorPickingDone"
                                onClick={() => {
                                    this.setState({ editedColor: null });
                                    this.props.selectionRecolor(
                                        i,
                                        this._refs.colorBoxes[i].style.backgroundColor
                                    );
                                }}
                            >
                                Done
                            </div>
                        </div>
                    ) : (
                        <span />
                    )}
                </div>
            ));

        // get the number of emphasized selections
        // see List#reduce (or Array#reduce) for info on the reductor
        const activeCount = this.props.selections.reduce(
            (r, v) => r + (v.get("visible") ? 1 : 0),
            0
        );

        // get the total number of selections, and the shown count (which is not different)
        const totalCount = this.props.selections.size;
        const shownCount = selections.length;

        // create the sortable list container
        const SortableList = SortableContainer(({ items }) => <ul>{items}</ul>);

        return (
            <div className="SelectionsList">
                <div className="SelectionsList__title">
                    <div className="SelectionsList__align">
                        <span className="SelectionsList__titletext">Selections</span>
                        <span className="SelectionsList__summary">
                            {activeCount}/{shownCount}/{totalCount}
                        </span>
                        <div className="SelectionsList__statistics">
                            {activeCount} active, {shownCount} shown, {totalCount} total
                        </div>
                    </div>
                </div>
                <div className="SelectionsList__selections" style={{ direction: "rtl" }}>
                    <div style={{ direction: "ltr" }}>
                        <SortableList
                            items={selections}
                            distance={5}
                            onSortEnd={({ oldIndex, newIndex }) => {
                                this.props.selectionReorder(
                                    arrayMove(
                                        [...Array(selections.length).keys()],
                                        oldIndex,
                                        newIndex
                                    )
                                );
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }
}

// prop types
SelectionsList.propTypes = {
    // store interaction
    selections: IPropTypes.list.isRequired,
    selectionToggle: PropTypes.func.isRequired,
    selectionEmphasisToggle: PropTypes.func.isRequired,
    selectionRecolor: PropTypes.func.isRequired,
    selectionRename: PropTypes.func.isRequired,
    selectionRemove: PropTypes.func.isRequired,
    selectionReorder: PropTypes.func.isRequired,

    // filtration string
    filterString: PropTypes.string.isRequired
};

// store connections
const mapStateToProps = state => {
    const domain = state.data;
    return {
        selections: domain.get("selections")
    };
};
const mapDispatchToProps = dispatch => ({
    selectionReorder: order => dispatch(selectionReorder(order)),
    selectionToggle: index => dispatch(selectionToggle(index)),
    selectionEmphasisToggle: index => dispatch(selectionEmphasisToggle(index)),
    selectionRecolor: (index, color) => dispatch(selectionRecolor(index, color)),
    selectionRename: (index, name) => dispatch(selectionRename(index, name)),
    selectionRemove: index => dispatch(selectionRemove(index))
});

export { SelectionsList };
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(SelectionsList);
