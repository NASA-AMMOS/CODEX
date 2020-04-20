import React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";

const WindowCenter = props => {
    const containerStyle = {
        display: "flex",
        flexDirection: "col",
        alignItems: "center",
        justifyContent: "center",
        height: "100%"
    };

    return <div style={containerStyle}>{props.children}</div>;
};

export const WindowCircularProgress = props => (
    <WindowCenter>
        <CircularProgress />
    </WindowCenter>
);

export const WindowError = props => (
    <WindowCenter>
        <p style={{ color: "red", textAlign: "center" }}>{props.children}</p>
    </WindowCenter>
);

export default WindowCenter;
