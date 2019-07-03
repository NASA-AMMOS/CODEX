import React, { useMemo, useState } from "react";
import { useWindowManager } from "hooks/WindowHooks";
import { useLiveFeatures } from "hooks/DataHooks";

import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TablePagination from "@material-ui/core/TablePagination";
import IconButton from "@material-ui/core/IconButton";
import FirstPageIcon from "@material-ui/icons/FirstPage";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import LastPageIcon from "@material-ui/icons/LastPage";

import {
    WindowLayout,
    FixedContainer,
    ExpandingContainer
} from "components/WindowHelpers/WindowLayout";
import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import styled from "styled-components";

// data table implementation based on https://material-ui.com/components/tables/#custom-table-pagination-action

const TablePaginationActions = props => {
    const { count, page, rowsPerPage, onChangePage } = props;

    const handleFirstPageButtonClick = event => onChangePage(event, 0);
    const handleBackButtonClick = event => onChangePage(event, page - 1);
    const handleNextButtonClick = event => onChangePage(event, page + 1);
    const handleLastPageButtonClick = event =>
        onChangePage(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1));

    const AlignedRow = styled.div`
        display: flex;
        flex-direction row;
        align-items: center;
        justify-content: flex-end;
    `;

    return (
        <AlignedRow>
            <IconButton onClick={handleFirstPageButtonClick} disabled={page === 0}>
                <FirstPageIcon />
            </IconButton>
            <IconButton onClick={handleBackButtonClick} disabled={page === 0}>
                <KeyboardArrowLeft />
            </IconButton>
            <IconButton
                onClick={handleNextButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
            >
                <KeyboardArrowRight />
            </IconButton>
            <IconButton
                onClick={handleLastPageButtonClick}
                disabled={page >= Math.ceil(count / rowsPerPage) - 1}
            >
                <LastPageIcon />
            </IconButton>
        </AlignedRow>
    );
};

const DataTable = props => {
    const win = useWindowManager(props, {
        title: "Data Table",
        minSize: { width: 400, height: 100 }
    });

    // by default, this will render as a row per feature
    const features = useLiveFeatures();

    // memoize the transposition bc it is *expensive*
    const [indices, transposed] = useMemo(() => {
        // end prematurely if we aren't loaded or we have zero features
        if (features === null || features.size === 0) {
            return [null, null];
        }

        // we want a transpose of this, as we want to be able to scroll *down* the row
        // first, we'll try to keep track of which feature corresponds to which row
        const indices = features.map(f => f.get("feature"));
        // indices now contains a lookup of the index to feature name

        // next, map across the features to extract the feature data, creating
        // a (features x data length) matrix. next, perform a features-ary zip
        // to create a (data length x features) matrix. this must be done carefully
        // in order to preserve the indices for the lookup. because immutable doesn't support
        // N-ary zips, we'll have to emulate it by mapping along axis zero
        const cleaned = features.map(f => f.get("data")); // indices preserved

        // this may be inefficient but w/e
        const transposed = cleaned.get(0).map((f, i) => cleaned.map(row => row.get(i)));

        return [indices, transposed];
    }, [features]); // depend on the features list

    // table setup
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);

    //  ---- NO MORE HOOKS BEYOND THIS POINT ----

    // validate that the faetures have been successfully loaded
    if (features === null) {
        return <WindowCircularProgress />;
    } else if (features.size === 0) {
        return <WindowError>No features selected.</WindowError>;
    }

    // update the window title with the displayed features
    win.setTitle(`Data Table: ${indices.join(", ")}`);

    // compute empty rows, and make sure we have our event emitters
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, transposed.size - page * rowsPerPage);
    const handleChangePage = (event, newPage) => setPage(newPage);
    const handleChangeRowsPerPage = event => setRowsPerPage(parseInt(event.target.value, 25));

    // compute the table headers + visible rows
    const headers = indices.map(n => (
        <TableCell key={n} align="right">
            {n}
        </TableCell>
    ));
    const rows = transposed
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) // slice to visible
        .map((row, idx) => {
            let cells = row.map((v, i) => (
                <TableCell key={i} align="right">
                    {v}
                </TableCell>
            ));

            return (
                <TableRow key={idx}>
                    <TableCell>{page * rowsPerPage + idx}</TableCell>
                    {cells}
                </TableRow>
            );
        });

    // final render: nested flex layout
    return (
        <WindowLayout direction="column">
            <ExpandingContainer scrollable={true}>
                <Table size={"small"}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Index</TableCell>
                            {headers}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {rows}
                        {emptyRows > 0 && (
                            <TableRow style={{ height: 48 * emptyRows }}>
                                <TableCell colSpan={indices.length} />
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ExpandingContainer>
            <FixedContainer>
                {/* row layout here to shove the pagination controls to the right */}
                <WindowLayout direction="row">
                    <ExpandingContainer />
                    <FixedContainer>
                        <TablePagination
                            rowsPerPageOptions={[5, 10, 25, 50, 75, 100, 500, 1000]}
                            colSpan={3}
                            count={transposed.size}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            SelectProps={{
                                inputProps: { "aria-label": "Rows per page" },
                                native: true
                            }}
                            onChangePage={handleChangePage}
                            onChangeRowsPerPage={handleChangeRowsPerPage}
                            ActionsComponent={TablePaginationActions}
                        />
                    </FixedContainer>
                </WindowLayout>
            </FixedContainer>
        </WindowLayout>
    );
};

export default DataTable;
