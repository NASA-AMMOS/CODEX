import React, { useEffect, useRef } from "react";
import { connect } from "react-redux";
import { bindActionCreators } from "redux";
import "components/ControlBar/ControlBar.scss";
import * as uiTypes from "constants/uiTypes";
import * as uiActions from "actions/ui";
import IconButton from "@material-ui/core/IconButton";
import Lasso from "styles/resources/Icons/lasso.svg";
import Zoom from "styles/resources/Icons/zoom.svg";
import ZoomIn from "styles/resources/Icons/zoom_in.svg";
import ZoomOut from "styles/resources/Icons/zoom_out.svg";
import Autoscale from "styles/resources/Icons/autoscale.svg";
import Pan from "styles/resources/Icons/pan.svg";
import ToggleHover from "styles/resources/Icons/toggle_hover.svg";
import classnames from "classnames";

const hotkeys = {
    KeyZ: "zoom",
    KeyS: "lasso",
    Space: "pan"
};

function ControlBar(props) {
    const previousChartMode = useRef(null);
    const keyPressTimer = useRef(null);
    useEffect(
        _ => {
            function handleKeyDown(e) {
                if (!Object.keys(hotkeys).includes(e.code) || keyPressTimer.current) return;
                keyPressTimer.current = setTimeout(_ => {
                    previousChartMode.current = props.globalChartState;
                    props.changeGlobalChartState(hotkeys[e.code]);
                    clearTimeout(keyPressTimer.current);
                }, 500);
            }

            function handleKeyUp(e) {
                clearTimeout(keyPressTimer.current);
                keyPressTimer.current = null;
                props.changeGlobalChartState(previousChartMode.current);
            }

            if (props.windows.some(win => uiTypes.GRAPH_TYPES.includes(win.windowType))) {
                document.addEventListener("keydown", handleKeyDown);
                document.addEventListener("keyup", handleKeyUp);
            }

            return _ => {
                document.removeEventListener("keydown", handleKeyDown);
                document.removeEventListener("keyup", handleKeyUp);
            };
        },
        [props.windows]
    );

    const lassoClass = classnames({ icon: true, active: props.globalChartState === "lasso" });
    const zoomClass = classnames({ icon: true, active: props.globalChartState === "zoom" });
    const panClass = classnames({ icon: true, active: props.globalChartState === "pan" });

    return (
        <div
            className="controlBar"
            hidden={props.windows.every(win => !uiTypes.GRAPH_TYPES.includes(win.windowType))}
        >
            <Lasso className={lassoClass} onClick={_ => props.changeGlobalChartState("lasso")} />
            <Zoom className={zoomClass} onClick={_ => props.changeGlobalChartState("zoom")} />
            <Pan className={panClass} onClick={_ => props.changeGlobalChartState("pan")} />
        </div>
    );
}

function mapStateToProps(state) {
    return {
        windows: state.windowManager.get("windows").toJS(),
        globalChartState: state.ui.get("globalChartState")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        changeGlobalChartState: bindActionCreators(uiActions.changeGlobalChartState, dispatch)
    };
}
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ControlBar);
