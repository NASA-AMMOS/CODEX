import "./ControlBar.scss";

import React from "react";

import classnames from "classnames";

import { graphs } from "../../constants/windowTypes";
import { useGlobalChartState } from "../../hooks/UIHooks";
import { useWindowList } from "../../hooks/WindowHooks";
import Lasso from "../../styles/resources/Icons/lasso.svg";
import Pan from "../../styles/resources/Icons/pan.svg";
import Zoom from "../../styles/resources/Icons/zoom.svg";

function ControlBar(props) {
    const [globalChartState, changeGlobalChartState] = useGlobalChartState();
    const windowList = useWindowList();

    const lassoClass = classnames({ icon: true, active: globalChartState === "lasso" });
    const zoomClass = classnames({ icon: true, active: globalChartState === "zoom" });
    const panClass = classnames({ icon: true, active: globalChartState === "pan" });

    return (
        <div
            className="controlBar"
            hidden={windowList.every(win => !graphs.includes(win.get("windowType")))}
        >
            <Lasso className={lassoClass} onClick={_ => changeGlobalChartState("lasso")} />
            <Zoom className={zoomClass} onClick={_ => changeGlobalChartState("zoom")} />
            <Pan className={panClass} onClick={_ => changeGlobalChartState("pan")} />
        </div>
    );
}

export default ControlBar;
