
import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";
import Popover from "@material-ui/core/Popover";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ClickAwayListener from "@material-ui/core/ClickAwayListener";
import Plot from "react-plotly.js";
import * as utils from "utils/utils";
import ReactResizeDetector from "react-resize-detector";



function ExplainThis(props) {

    console.log(props);

	return (
		<div>
			Test
		</div>
	);
}

function mapStateToProps(state) {
    return {
     //   currentSelection: state.selections.currentSelection,
     //   savedSelections: state.selections.savedSelections
    };
}

function mapDispatchToProps(dispatch) {
    return {
   //     setCurrentSelection: bindActionCreators(selectionActions.setCurrentSelection, dispatch),
   //     saveCurrentSelection: bindActionCreators(selectionActions.saveCurrentSelection, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ExplainThis);