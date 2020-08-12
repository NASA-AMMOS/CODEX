import React from "react";

const dialogBoxContent = win => {
    let variant = win?.data?.variant;

    switch (variant) {
        case "load_failure":
            return (
                <p>
                    Something went wrong processing your upload!
                    <br />
                    Traceback:
                    <br />
                    <code>{win.data.message}</code>
                </p>
            );
        default:
            break;
    }

    return (
        <p>
            {" "}
            Dialog box variant <code>{`${variant}`}</code> does not have an associated content
            function!{" "}
        </p>
    );
};

export default dialogBoxContent;
