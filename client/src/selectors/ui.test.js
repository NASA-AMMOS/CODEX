import * as actions from "../actions/data";
import * as uiactions from "../actions/ui";
import reducer from "../reducers/ui";
import uireducer, { getInitialState } from "../reducers/ui";
import * as sels from "./data";
import * as uisels from "./ui";
import { List } from "immutable";

/* When NODE_ENV === 'test', config.mock is pulled in.
   These compare against config.mock's arrangement */

describe("Data selector tests", () => {
    const base_state = getInitialState();

    it("should get graphs", () => {
        let sel1 = uisels.getGraphs(base_state);
        expect(sel1.size).toEqual(10);
        expect(sel1.getIn([0, "name"])).toEqual("Scatter");
        expect(sel1.getIn([0, "type"])).toEqual("scatter");
    });

    it("should get graphs by type", () => {
        let sel1 = uisels.getGraphByType(base_state, "scatter");
        let sel2 = uisels.getGraphByType(base_state, "histogram");

        expect(sel1.get("name")).toEqual("Scatter");
        expect(sel2.get("name")).toEqual("Histogram");
    });

    it("should get algorithms", () => {
        let sel1 = uisels.getAlgorithms(base_state);
        expect(sel1.size).toEqual(4);
        expect(sel1.getIn([0, "name"])).toEqual("Filter");
        expect(sel1.getIn([1, "name"])).toEqual("Cluster");
    });

    it("should get algorithms by name", () => {
        let sel1 = uisels.getAlgorithmByName(base_state, "Cluster");
        expect(sel1.get("name")).toEqual("Cluster");
    });

    it("should get subalgorithms of algorithm by name", () => {
        let sel1 = uisels.getSubAlgorithmByName(base_state, "Cluster", "kmeans");
        expect(sel1.get("simplename")).toEqual("kmeans");
    });

    it("should get reports", () => {
        let sel1 = uisels.getReports(base_state);
        expect(sel1.size).toEqual(1);
        expect(sel1.getIn([0, "name"])).toEqual("Quality Scan");
    });
});
