import React, { Component , useState} from "react";
import "components/LeftPanel/FeatureList.scss";
import { connect } from "react-redux";
import classnames from "classnames";
import { bindActionCreators } from "redux";
import * as dataActions from "actions/data";
import CircularProgress from "@material-ui/core/CircularProgress";
import FeatureData from "components/LeftPanel/FeatureData";
import Checkbox from '@material-ui/core/Checkbox';
import CheckboxOutlineBlank from "@material-ui/icons/CheckBoxOutlineBlank";
import CheckboxIcon from "@material-ui/icons/CheckBox";

function createFeature(props, feature) {
    const name = feature.get("name");
    const selected = feature.get("selected");

    return (
        <li
            className={classnames({ feature: true})}
            key={name}
        >
            <Checkbox
                checked={selected}
                value="checkedA"
                style={{height:"22px",padding:"0px", paddingRight:"10px"}}
                icon={<CheckboxOutlineBlank style={{fill: "#828282"}} />}
                checkedIcon={<CheckboxIcon style={{ fill:"#3988E3"}} />}
                onClick={function(e) {
                    return selected
                        ? props.featureUnselect(name, e.shiftKey)
                        : props.featureSelect(name, e.shiftKey);
                }}
              />
            <span>{name}</span>
        </li>
    );
}

function FeatureList(props) {
    const activeCount = props.featureList.filter(f => f.get("selected")).size;
    const shownCount = activeCount;
    const totalCount = props.featureList.size;

    const [statsHidden, setStatsHidden] = useState(true);

    const featureItems = props.featureList
        .filter(f =>
            props.filterString
                ? f
                    .get("name")
                    .toLowerCase()
                    .startsWith(props.filterString.toLowerCase())
                : true
        )
        .map(f => createFeature(props, f));

    return (
        <div className={"feature-lists-container " + (statsHidden ? 'stats-hidden' : 'stats-not-hidden')}>
            <div className="header-container">
                <div className={"header " + (statsHidden ? 'stats-hidden-header' : 'stats-not-hidden-header')}>
                    <div className="title">Features</div>
                    <span className="stats-toggle"
                          onClick={function(){setStatsHidden(!statsHidden)}}>
                             {statsHidden ? "stats off" : "stats on"} 
                    </span>
                    <span className="counts">
                        {activeCount}/{shownCount}/{totalCount}
                    </span>
                </div>
                <div className="label-row" hidden={statsHidden}>
                    <table>
                        <tbody>
                            <tr>
                                <td>C</td>
                                <td>R</td>
                                <td>mean</td>
                                <td>median</td>
                                <td>sparkline</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="scroll-container">
                <div className="Features">
                    <div className="loading" hidden={!props.featureListLoading}>
                        <CircularProgress />
                    </div>
                    <div className="list" hidden={props.featureListLoading}>
                        <ul>{featureItems}</ul>
                    </div>
                </div>
                <FeatureData 
                    statsHidden={statsHidden} 
                    featureListLoading={props.featureListLoading}
                    featureList={props.featureList.toJS()}
                />
            </div>
        </div>
    );
}

function mapStateToProps(state) {
    return {
        featureList: state.data.get("featureList"),
        featureListLoading: state.data.get("featureListLoading")
    };
}

function mapDispatchToProps(dispatch) {
    return {
        featureSelect: bindActionCreators(dataActions.featureSelect, dispatch),
        featureUnselect: bindActionCreators(dataActions.featureUnselect, dispatch)
    };
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(FeatureList);
