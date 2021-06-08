import "./SelectionList.scss";

import { Checkbox } from "@material-ui/core";
import { RemoveRedEye } from "@material-ui/icons";
import CheckboxIcon from "@material-ui/icons/CheckBox";
import CheckboxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import KeyboardArrowRightIcon from "@material-ui/icons/KeyboardArrowRight";
import React, { useState } from "react";

import classnames from "classnames";

import { CloseIcon } from "../../react-cristal/src/styled";
import {
    useSavedSelections,
    useSelectionGroups,
    useSetHoverSelection,
    useSetSelectionGroupHidden,
    useSetSelectionHidden
} from "../../hooks/DataHooks";
import CombineIcon from "../Icons/Combine";
import DifferenceIcon from "../Icons/Difference";
import IntersectIcon from "../Icons/Intersect";

function EditSelectionItem(props) {
    const hoverSelection = useSetHoverSelection();
    const setSelectionHidden = useSetSelectionHidden();

    function eyeballClick(e) {
        setSelectionHidden(props.item.id, e.target.checked);
    }

    return (
        <div
            className="selection-item"
            onMouseEnter={_ => hoverSelection(props.item.id)}
            onMouseLeave={_ => hoverSelection(null)}
        >
            <div>
                <Checkbox
                    checked={props.selected}
                    value="checkedA"
                    icon={<CheckboxOutlineBlank style={{ fill: "#828282" }} />}
                    checkedIcon={<CheckboxIcon style={{ fill: "#3988E3" }} />}
                    style={{ height: "22px", padding: "0px" }}
                    onChange={props.onSelect}
                />
                <label>{props.item.name}</label>
            </div>
            <div className="selection-buttons">
                <Checkbox
                    className="eye-icon-checkbox"
                    checked={props.item.hidden}
                    value="checkedA"
                    icon={<RemoveRedEye style={{ fill: "#DADADA" }} />}
                    checkedIcon={<RemoveRedEye style={{ fill: "#061427" }} />}
                    onClick={eyeballClick}
                    style={{ height: "22px", padding: "0px" }}
                />
                <div className="swatch" style={{ backgroundColor: props.item.color }} />
            </div>
        </div>
    );
}

function EditSelectionGroup(props) {
    const [panelExpanded, setPanelExpanded] = useState(false);
    const [selectedToEdit, setSelectedToEdit] = props.selectedToEditState;
    const setGroupHidden = useSetSelectionGroupHidden();

    const groupActive = props.group.selections.every(sel => selectedToEdit.includes(sel.id));

    const iconClasses = classnames({ ["expand-icon"]: true, expanded: panelExpanded });

    function eyeballClick(e) {
        setGroupHidden(props.group.id, e.target.checked);
    }

    function groupCheckboxClick() {
        const newSelections = groupActive
            ? selectedToEdit.filter(id => !props.group.selections.find(sel => sel.id === id))
            : selectedToEdit.concat(props.group.selections.map(sel => sel.id));
        setSelectedToEdit(newSelections);
    }

    return (
        <div className="selection-group">
            <div className="selection-group-header">
                <div>
                    <button className={iconClasses} onClick={_ => setPanelExpanded(!panelExpanded)}>
                        <KeyboardArrowRightIcon />
                    </button>
                    <Checkbox
                        checked={groupActive}
                        value="checkedA"
                        icon={<CheckboxOutlineBlank style={{ fill: "#828282" }} />}
                        checkedIcon={<CheckboxIcon style={{ fill: "#3988E3" }} />}
                        style={{ height: "22px", padding: "0px" }}
                        onChange={groupCheckboxClick}
                    />
                    <label>{props.group.name}</label>
                </div>
                <div>
                    <Checkbox
                        className="eye-icon-checkbox"
                        checked={props.group.hidden}
                        value="checkedA"
                        icon={<RemoveRedEye style={{ fill: "#DADADA" }} />}
                        checkedIcon={<RemoveRedEye style={{ fill: "#061427" }} />}
                        onClick={eyeballClick}
                        style={{ height: "22px", padding: "0px" }}
                    />
                </div>
            </div>
            {panelExpanded ? (
                <div className="selection-group-items">
                    {props.group.selections.map(item => (
                        <EditSelectionItem
                            key={item.id}
                            item={item}
                            selected={selectedToEdit.includes(item.id)}
                            onSelect={props.toggleSelection(item.id)}
                        />
                    ))}
                </div>
            ) : null}
        </div>
    );
}

function SelectionEdit(props) {
    const [selections, saveNewSelection] = useSavedSelections();
    const [groups] = useSelectionGroups();

    const selectedToEditState = useState([]);
    const [selectedToEdit, setSelectedToEdit] = selectedToEditState;
    const [selectionEditMode, setSelectionEditMode] = props.selectionEditModeState;

    function getSelectionTitle(titleText) {
        const selectionTitleIndex =
            selections.reduce((acc, sel) => {
                const match = sel.name.match(`/${titleText} (\\d*)/`);
                return match ? Math.max(acc, match[1]) : acc;
            }, 0) + 1;
        return `${titleText} ${selectionTitleIndex}`;
    }

    function combineSelections() {
        const combinedRowIndices = selections
            .filter(sel => selectedToEdit.includes(sel.id))
            .reduce((acc, sel) => acc.concat(sel.rowIndices), []);
        const rowIndices = [...new Set(combinedRowIndices)];
        saveNewSelection(getSelectionTitle("Combined Selection"), rowIndices, null);
        setSelectedToEdit([]);
    }

    function intersectSelections() {
        const currentSelections = selections.filter(sel => selectedToEdit.includes(sel.id));
        const combinedRowIndices = currentSelections.reduce(
            (acc, sel) => acc.concat(sel.rowIndices),
            []
        );
        const intersectedRowIndices = [...new Set(combinedRowIndices)].filter(val =>
            currentSelections.every(sel => sel.rowIndices.includes(val))
        );
        saveNewSelection(getSelectionTitle("Intersected Selection"), intersectedRowIndices, null);
        setSelectedToEdit([]);
    }

    function differenceSelections() {
        const currentSelections = selections.filter(sel => selectedToEdit.includes(sel.id));
        const differenceRowIndices = currentSelections.reduce((acc, sel, idx) => {
            sel.rowIndices.forEach(val => {
                if (
                    currentSelections.every(
                        (sel, selIdx) => selIdx === idx || !sel.rowIndices.includes(val)
                    )
                ) {
                    acc.push(val);
                }
            });
            return acc;
        }, []);
        saveNewSelection(getSelectionTitle("Difference Selection"), differenceRowIndices, null);
        setSelectedToEdit([]);
    }

    function toggleSelection(id) {
        return _ => {
            const newSelections = selectedToEdit.includes(id)
                ? selectedToEdit.filter(sel => sel !== id)
                : selectedToEdit.concat([id]);
            setSelectedToEdit(newSelections);
        };
    }

    function handleSelectionAction(action) {
        return _ => {
            const selected = selectedToEdit.map(id => selections.find(item => item.id === id));
            switch (action) {
                case "combination":
                    return combineSelections();
                case "intersection":
                    return intersectSelections();
                case "difference":
                    return differenceSelections();
            }
        };
    }

    return (
        <React.Fragment>
            <div className="selections">
                <div className="header stats-hidden-header" style={{ alignItems: "center" }}>
                    <div className="title">Edit Selections</div>
                    <span className="counts" onClick={_ => setSelectionEditMode(mode => !mode)}>
                        <CloseIcon />
                    </span>
                </div>
                <div className="selections-container">
                    {selections
                        .filter(sel => !sel.groupID)
                        .map(item => (
                            <EditSelectionItem
                                key={item.id}
                                item={item}
                                selected={selectedToEdit.includes(item.id)}
                                onSelect={toggleSelection(item.id)}
                            />
                        ))}
                    {groups.map(group => (
                        <EditSelectionGroup
                            key={group.id}
                            group={group}
                            selectedToEditState={selectedToEditState}
                            toggleSelection={toggleSelection}
                        />
                    ))}
                </div>
            </div>
            <div className="selectionButtonsContainer">
                <button
                    onClick={handleSelectionAction("combination")}
                    disabled={selectedToEdit.length < 2}
                >
                    <CombineIcon />
                    <span>Combination</span>
                </button>
                <button
                    onClick={handleSelectionAction("intersection")}
                    disabled={selectedToEdit.length < 2}
                >
                    <IntersectIcon />
                    <span>Intersection</span>
                </button>
                <button
                    onClick={handleSelectionAction("difference")}
                    disabled={selectedToEdit.length < 2}
                >
                    <DifferenceIcon />
                    <span>Difference</span>
                </button>
                <button onClick={_ => setSelectionEditMode(false)} className="done">
                    <span>Done</span>
                </button>
            </div>
        </React.Fragment>
    );
}

export default SelectionEdit;
