import React from "react";
import useWindowManager from "hooks/WindowHooks";
import { usePinnedFeatures, useLiveFeatures } from "hooks/DataHooks";

const Debugger = props => {
    const win = useWindowManager(props, {
        title: "Debug component"
    });

    const features = usePinnedFeatures();

    let featureList = features;
    if (features === null) {
        featureList = (
            <li>
                <i> No features loaded </i>
            </li>
        );
    } else {
        console.log("rendering: ", features);
        featureList = features.map(f => <li key={f.get("feature")}>{f.get("feature")}</li>);
    }

    return <ul>{featureList}</ul>;
};

export default Debugger;
