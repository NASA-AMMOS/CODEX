import "components/ControlBar/ControlBar.scss";

import { bindActionCreators } from "redux";
import { connect } from "react-redux";
import React from "react";

import Lasso from "styles/resources/Icons/lasso.svg";
import Pan from "styles/resources/Icons/pan.svg";
import Zoom from "styles/resources/Icons/zoom.svg";
import classnames from "classnames";
import * as uiActions from "actions/ui";
import * as uiTypes from "constants/uiTypes";

function ControlBar(props) {
    const lassoClass = classnames({ icon: true, active: props.globalChartState === "lasso" });
    const zoomClass = classnames({ icon: true, active: props.globalChartState === "zoom" });
    const panClass = classnames({ icon: true, active: props.globalChartState === "pan" });

    return (
        <div
            className="controlBar"
            hidden={props.windows.every(
                win => !uiTypes.GRAPH_TYPES.includes(win.get("windowType"))
            )}
        >
            <Lasso className={lassoClass} onClick={_ => props.changeGlobalChartState("lasso")} />
            <Zoom className={zoomClass} onClick={_ => props.changeGlobalChartState("zoom")} />
            <Pan className={panClass} onClick={_ => props.changeGlobalChartState("pan")} />
        </div>
    );
}

function mapStateToProps(state) {
    return {
        windows: state.windowManager.get("windows"),
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
