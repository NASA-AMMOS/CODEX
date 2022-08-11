import { FormControl, MenuItem, Select, Switch } from "@material-ui/core";
import React from "react";

import { useSavedSelections } from "../../hooks/DataHooks";
import "./SelectionLimiter.scss";

function SelectionLimiter({ limitState }) {
    const [selections] = useSavedSelections();
    const [limit, setLimit] = limitState;

    function handleToggle(filter) {
        return e => {
            const newLimit = { ...limit, filter: limit.filter === filter ? null : filter };
            newLimit.selection[filter] = newLimit.selection[filter] || selections[0];
            setLimit(newLimit);
        };
    }

    function handleChange(filter) {
        return e => {
            const newLimit = { ...limit, filter };
            limit.selection[filter] = e.target.value;
            setLimit(newLimit);
        };
    }

    return (
        <React.Fragment>
            <div className="selections-dropdown-container">
                <Switch
                    checked={limit.filter === "include"}
                    onChange={handleToggle("include")}
                    disabled={!selections.length}
                />
                <span className="selection-label">Limit Analysis To:</span>
                <FormControl>
                    <Select
                        onChange={handleChange("include")}
                        value={limit.selection.include}
                        name="checkedExclude"
                        inputProps={{ "aria-label": "primary checkbox" }}
                    >
                        {selections.map(selection => (
                            <MenuItem key={selection.id} value={selection}>
                                {selection.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>
            <div className="selections-dropdown-container">
                <Switch
                    checked={limit.filter === "exclude"}
                    onChange={handleToggle("exclude")}
                    disabled={!selections.length}
                />
                <span className="selection-label">Exclude:</span>
                <FormControl>
                    <Select
                        onChange={handleChange("exclude")}
                        value={limit.selection.exclude}
                        name="checkedExclude"
                        inputProps={{ "aria-label": "primary checkbox" }}
                    >
                        {selections.map(selection => (
                            <MenuItem key={selection.id} value={selection}>
                                {selection.name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>
        </React.Fragment>
    );
}

export default SelectionLimiter;
