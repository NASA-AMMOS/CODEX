import React from "react";
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

function ControlBar(props) {
    return (
        <div
            className="controlBar"
            hidden={props.windows.every(win => !uiTypes.GRAPH_TYPES.includes(win.windowType))}
        >
            <Lasso className="icon" onClick={_ => props.changeGlobalChartState("lasso")} />
            <Zoom className="icon" onClick={_ => props.changeGlobalChartState("zoom")} />
            <Pan className="icon" onClick={_ => props.changeGlobalChartState("pan")} />
        </div>
    );
}

function mapStateToProps(state) {
    return {
        windows: state.windowManager.get("windows").toJS()
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
