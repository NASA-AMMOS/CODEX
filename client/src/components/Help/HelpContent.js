import CircularProgress from "@material-ui/core/CircularProgress";
import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";

import { makeHelpRequest } from "../../utils/utils";

function HelpContent(props) {
    const [textContent, setTextContent] = useState("");
    useEffect(
        _ => {
            if (props.hidden || textContent) return;
            const { req, cancel } = makeHelpRequest(props.guidancePath);
            req.then(({ guidance }) => setTextContent(guidance));
            return cancel;
        },
        [props.hidden]
    );

    if (props.hidden) return null;
    if (!textContent) return <CircularProgress />;
    return <ReactMarkdown source={textContent} className="help-content" linkTarget="_blank" />;
}

export default HelpContent;
