import React from "react";
import CircularProgress from "@material-ui/core/CircularProgress";
import { connect } from "react-redux";
import WorkerSocket from "worker-loader!workers/socket.worker";
import * as actionTypes from "constants/actionTypes";
import { addDataset, featureRetain, featureRelease } from "actions/data";
import { getGlobalSessionKey } from "utils/utils";

function loadColumnFromServer(feature) {
    return new Promise(resolve => {
        const socketWorker = new WorkerSocket();

        socketWorker.addEventListener("message", e => {
            console.log("server column");
            console.log(JSON.parse(e.data));
            const data = JSON.parse(e.data).data.map(ary => ary[0]);
            resolve(data);
        });

        socketWorker.postMessage(
            JSON.stringify({
                action: actionTypes.GET_GRAPH_DATA,
                sessionkey: getGlobalSessionKey(),
                selectedFeatures: [feature]
            })
        );
    });
}

class DataWrapper extends React.Component {
    constructor(props) {
        super(props);

        console.log(props);

        this.state = {
            pinnedFeatures:
                props.features || props.selectedFeatures ? props.selectedFeatures.toJS() : []
        };
    }

    componentDidMount() {
        // load the component here, and the columns from the server

        console.log("pinned features: ", this.state.pinnedFeatures);

        this.resolveAllFeatures()
            .then(() => {
                for (let feature of this.state.pinnedFeatures) {
                    this.props.featureRetain(feature);
                }

                this.setState(state => ({ loaded: true }));
            })
            .catch(() => {
                console.warn("could not load: ", this.pinnedFeatures);
            });
    }

    componentWillUnmount() {
        // unload the same components
        // (TODO, do not need this ATM)
        console.log("unmounting datawrapper with pinned features: ", this.state.pinnedFeatures);
        for (let feature of this.state.pinnedFeatures) {
            this.props.featureRelease(feature);
        }
    }

    async resolveAllFeatures() {
        // first, figure out what we've got
        const loadedFeatures = this.props.loadedData.map(el => el.get("feature")).toJS();

        // ...then figure out what we still need to load
        const featuresToLoad = this.state.pinnedFeatures.filter(
            name => loadedFeatures.indexOf(name) === -1
        );

        console.log("loadedFeatures: ", loadedFeatures, "featuresToLoad: ", featuresToLoad);
        for (let featureName of featuresToLoad) {
            let data = await loadColumnFromServer(featureName);

            this.props.addDataset(featureName, data);
        }

        return true;
    }

    render() {
        if (this.state.loaded) {
            const features = {};
            console.log(this.state.pinnedFeatures);
            for (let name of this.state.pinnedFeatures) {
                features[name] = this.props.loadedData
                    .find(el => el.get("feature") === name)
                    .get("data");
            }
            const children = React.Children.map(this.props.children, (child, index) => {
                return React.cloneElement(child, {
                    featureNames: this.state.pinnedFeatures,
                    features
                });
            });

            return <React.Fragment>{children}</React.Fragment>;
        }
        return <CircularProgress />;
    }
}

const mapStateToProps = state => {
    const domain = state.data;
    return {
        selectedFeatures: domain.get("selected_features"),
        loadedData: domain.get("loadedData")
    };
};

const mapDispatchToProps = dispatch => ({
    featureRetain: feature => dispatch(featureRetain(feature)),
    featureRelease: feature => dispatch(featureRelease(feature)),
    addDataset: (feature, data) => dispatch(addDataset(feature, data))
});

export { DataWrapper };
export default connect(
    mapStateToProps,
    mapDispatchToProps
)(DataWrapper);
