/**
 * Interface selection tools.
 * @author Tariq Soliman
 */

import { List, Map } from "immutable";
import * as actions from "./ui";

/**
 * Get graphs
 * @param {Map} domain current domain structure
 * @return {List} list of graphs
 */
export const getGraphs = domain => {
    return domain.get("graphs");
};

/**
 * Get graph with matching type
 * @param {Map} domain current domain structure
 * @param {type} type of graph (from config)
 * @return {Map} graph
 */
export const getGraphByType = (domain, type) => {
    return domain
        .get("graphs")
        .filter(g => {
            return g.get("type") === type;
        })
        .get(0);
};

/**
 * Get algorithms
 * @param {Map} domain current domain structure
 * @return {List} list of algorithms
 */
export const getAlgorithms = domain => {
    return domain.get("algorithms");
};

/**
 * Get algorithm with matching name
 * @param {Map} domain current domain structure
 * @return {Map} algorithm
 */
export const getAlgorithmByName = (domain, name) => {
    return domain
        .get("algorithms")
        .filter(a => {
            return a.get("name") === name;
        })
        .get(0);
};

/**
 * Get the subalgorithm by name of an algorithm
 * @param {Map} domain current domain structure
 * @return {Map} algorithm
 */
export const getSubAlgorithmByName = (domain, algorithmName, name) => {
    const algo = domain
        .get("algorithms")
        .filter(a => {
            return a.get("name") === algorithmName;
        })
        .get(0);
    return algo
        .get("subalgorithms")
        .filter(a => {
            return a.get("simplename") === name;
        })
        .get(0);
};

/**
 * Get reports
 * @param {Map} domain current domain structure
 * @return {List} list of reports
 */
export const getReports = domain => {
    return domain.get("reports");
};
