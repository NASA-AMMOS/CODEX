import styled from "styled-components";
import classNames from "classnames";
import React from "react";
import "./WindowLayout.css";

export const WindowLayout = props => {
    const classes = classNames("WindowLayout__LayoutContainer", {
        "WindowLayout__LayoutContainer--row": props.direction === "row"
    });

    return <div className={classes}>{props.children}</div>;
};

export const FixedContainer = props => {
    const classes = classNames("WindowLayout__Fixed", {
        "WindowLayout--scrollable": props.scrollable
    });
    return <div className={classes}>{props.children}</div>;
};

export const ExpandingContainer = props => {
    const classes = classNames("WindowLayout__Expanding", {
        "WindowLayout--scrollable": props.scrollable
    });
    return <div className={classes}>{props.children}</div>;
};
