import "./WindowLayout.css";

import Close from "@material-ui/icons/Close";
import IconButton from "@material-ui/core/IconButton";
import React from "react";
import Typography from "@material-ui/core/Typography";

import classNames from "classnames";

export const WindowLayout = props => {
    const classes = classNames("WindowLayout__LayoutContainer", {
        "WindowLayout__LayoutContainer--row": props.direction === "row",
        "WindowLayout__LayoutContainer--fullsize": !props.fluid
    });

    const override = {};
    if (props.align) {
        override.alignItems = props.align;
    }

    return (
        <div className={classes} style={override}>
            {props.children}
        </div>
    );
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

export const WindowNoPad = props => <div className="WindowLayout__nopad">{props.children}</div>;

export const WindowCover = props => <div className="WindowLayout__cover">{props.children}</div>;

export const WindowTogglableCover = props =>
    props.open ? (
        <WindowCover>
            <WindowLayout>
                <WindowLayout fluid direction="row" align="center">
                    <Typography variant="h6">{props.title}</Typography>
                    <ExpandingContainer />
                    <FixedContainer>
                        <IconButton onClick={props.onClose}>
                            <Close />
                        </IconButton>
                    </FixedContainer>
                </WindowLayout>
                <ExpandingContainer>{props.children}</ExpandingContainer>
            </WindowLayout>
        </WindowCover>
    ) : null;
