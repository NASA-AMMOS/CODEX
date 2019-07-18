import React from "react";
import useWindowManager from "hooks/WindowHooks";
import { getGlobalSessionKey } from "utils/utils";

import WindowCenter from "components/WindowHelpers/WindowCenter";

const Debugger = props => {
    const win = useWindowManager(props, {
        title: "Debug component"
    });

    return (
        <WindowCenter>
            <p className="monospace">current session key: {getGlobalSessionKey() || "[unset]"}</p>
        </WindowCenter>
    );
};

export default Debugger;
