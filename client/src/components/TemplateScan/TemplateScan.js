import "./TemplateScan.scss";

import { Button, IconButton } from "@material-ui/core";
import { useDispatch } from "react-redux";
import HelpIcon from "@material-ui/icons/Help";
import Plot from "react-plotly.js";
import React, { useState, useEffect, useContext } from "react";

import classnames from "classnames";

import { WindowCircularProgress } from "../WindowHelpers/WindowCenter";
import { getMean, makeSimpleRequest, removeSentinelValuesRevised } from "../../utils/utils";
import {
    useFeatureDisplayNames,
    useFileInfo,
    useNewFeature,
    usePinnedFeatures
} from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import * as wmActions from "../../actions/windowManagerActions";

const DEFAULT_POINT_COLOR = "rgba(0, 0, 0, 0.5)";

function makeServerRequestObj(algorithmName, feature1, feature2) {
    return {
        routine: "algorithm",
        algorithmName,
        algorithmType: "template_scan",
        dataFeatures: [feature1.get("feature")],
        labelName: [feature2.get("feature")],
        downsampled: false,
        file: null,
        guidance: null,
        identification: { id: "dev0" },
        parameters: { radius: 10, dist: "euclidean" },
        dataSelections: []
    };
}

function TemplateScan(props) {
    // Window initialization
    const win = useWindowManager(props, {
        width: 726,
        height: 600,
        isResizable: true,
        title: "Template Scan"
    });

    let features = usePinnedFeatures(win);
    const [featureNameList] = useFeatureDisplayNames();

    const requestObj = features && makeServerRequestObj("dtw", features.get(0), features.get(1));
    const [res, setRes] = useState();
    useEffect(
        _ => {
            if (!features || res) return;
            const { req, cancel } = makeSimpleRequest(requestObj);
            req.then(data => {
                setRes(data);
            });
        },
        [features]
    );

    if (features === null || !win.data) {
        return <WindowCircularProgress />;
    }

    features = features.map(feature => {
        const featureName = featureNameList.get(feature.get("feature"), feature.get("feature"));
        return feature.set("displayName", featureName);
    });

    const dispatch = useDispatch();
    function closeWindow() {
        dispatch(wmActions.closeWindow(win.id));
    }

    return (
        <div className="normalize-container">
            <div className="normalize-top-bar">
                <div className="help-row">
                    <span>Here's a test page for Jack.</span>
                    <IconButton>
                        <HelpIcon />
                    </IconButton>
                </div>
            </div>
            <div className="normalize-previews">
                <strong>request:</strong>
                <p>{JSON.stringify(requestObj)}</p>
                <strong>response:</strong>
                <p>{JSON.stringify(res)}</p>
            </div>
            <div className="normalize-action-row">
                <div>
                    <Button variant="contained" size="small" onClick={_ => closeWindow()}>
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default TemplateScan;
