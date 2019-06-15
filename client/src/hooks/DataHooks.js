import React, { useState, useRef, useEffect } from "react";
import { useSelector, useStore, useDispatch } from "react-redux";
import WorkerSocket from "worker-loader!workers/socket.worker";
import * as actionTypes from "constants/actionTypes";
import { addDataset, featureRetain, featureRelease } from "actions/data";
import { fromJS, Set } from "immutable";
import { batchActions } from "redux-batched-actions";

function loadColumnFromServer(feature) {
    return new Promise(resolve => {
        const socketWorker = new WorkerSocket();

        socketWorker.addEventListener("message", e => {
            //console.log("server column");
            //console.log(JSON.parse(e.data));
            const data = JSON.parse(e.data).data.map(ary => ary[0]);
            resolve(data);
        });

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.GET_GRAPH_DATA,
                selectedFeatures: [feature]
            })
        );
    });
}

async function resolveFeature(feature) {
    return addDataset(feature, await loadColumnFromServer(feature)); // autoref
}

/**
 * Previous value state hook, used to
 */
function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

/**
 * Get (and lock) a set of features
 * @param {array} features list of feature names
 * @return {array} feature state
 */
export function useFeatures(features) {
    features = Set(features);

    // know what we had before
    let oldFeatures = usePrevious(features);
    if (oldFeatures === undefined) {
        oldFeatures = Set([]);
    }

    /*
     * HOW THIS WORKS
     *
     * Figure out what actions are needed to sync the previous features with these features
     * Batch those actions at the end
     */

    const domain = useSelector(state => state.data);
    const dispatch = useDispatch();

    // make sure we keep the list of features to release at the end up to date
    const cleanupFeatureList = useRef();
    cleanupFeatureList.current = features;

    // final cleanup
    useEffect(() => {
        return () => {
            let out = [];
            for (let feature of cleanupFeatureList.current) {
                console.log("releasing " + feature);
                out.push(featureRelease(feature));
            }
            dispatch(batchActions(out));
        };
    }, []);

    // batching actions to dispatch all at once (so as to only notify subscribers once, and to avoid race conditions)
    const actionsToDispatch = [];

    const loadedData = domain.get("loadedData");
    const loadedFeatures = Set(loadedData.map(f => f.get("feature")));

    console.log("new vs old features: ", features.toJS(), oldFeatures.toJS());

    // final cleanup

    let outgoing = oldFeatures.subtract(features); // features that have been added since last call
    let incoming = features.subtract(oldFeatures);

    console.log("features incoming / outgoing: ", incoming.toJS(), outgoing.toJS());

    // deal with incoming features
    let needsload = incoming.subtract(loadedFeatures);
    for (let feature of needsload) {
        actionsToDispatch.push(resolveFeature(feature));
    }

    for (let feature of incoming) {
        actionsToDispatch.push(featureRetain(feature));
    }

    // outgoing
    for (let feature of outgoing) {
        actionsToDispatch.push(featureRelease(feature));
    }

    //console.log('batched promises (pre-resolve): ', actionsToDispatch);
    Promise.all(actionsToDispatch).then(actions => {
        // console.log(actions);
        dispatch(batchActions(actions));
    });

    // if this is the case, then we're probably done resolving
    if (incoming.size === 0 && outgoing.size === 0) {
        return loadedData.filter(f => features.find(fo => fo == f.get("feature")));
    } else {
        return null;
    }
}

/**
 * Get features that are selected, live updating as features are selected or unselected
 */
export function useLiveFeatures() {
    const domain = useSelector(state => state.data);
    const selectedFeatures = domain
        .get("featureList")
        .filter(f => f.get("selected"))
        .map(f => f.get("name"));

    console.log("selected_features: ", selectedFeatures.toJS());

    return useFeatures(selectedFeatures);
}

/**
 * Get features that are selected, WITHOUT live updating as features are selected or unselected
 */
export function usePinnedFeatures() {
    const domain = useSelector(state => state.data);
    const selectedFeatures = domain
        .get("featureList")
        .filter(f => f.get("selected"))
        .map(f => f.get("name"));

    // pin the selected features to the state on the first run
    const [pinned, setPinned] = useState(null);

    useEffect(() => {
        setPinned(selectedFeatures);
    }, []); // run once

    return useFeatures(pinned);
}
