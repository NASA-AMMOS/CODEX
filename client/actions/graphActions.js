import * as types from "./dataTypes";
import * as uiActions from "./ui";

/* eslint import/no-webpack-loader-syntax: off */
import WorkerSocket from "worker-loader!../src/workers/socket.worker";

export function createGraph(graphMode) {
	return (dispatch, getState) => {
		const selectedFeatures = getState()
			.get("data")
			.get("featureList")
			.filter(f => f.get("selected"))
			.map(f => f.get("name"))
			.toJS();

		const socketWorker = new WorkerSocket();

		socketWorker.addEventListener("message", e => {
			const data = JSON.parse(e.data).data;

			// This is a bit of a hack to make the data structure look like it used to when we were parsing whole files.
			data.unshift(selectedFeatures);
			dispatch({ type: types.UPDATE_DATA, data });
			dispatch(uiActions.openGraph(getState().get("data"), graphMode));
		});

		socketWorker.postMessage(
			JSON.stringify({
				action: types.GET_GRAPH_DATA,
				selectedFeatures
			})
		);
		dispatch({ type: types.NO_ACTION });
	};
}
