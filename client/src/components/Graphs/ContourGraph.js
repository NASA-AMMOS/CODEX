import "components/Graphs/ContourGraph.css";

import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";
import Plot from "react-plotly.js";
import * as utils from "utils/utils";
import GraphWrapper from "components/Graphs/GraphWrapper.js";

import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useCurrentSelection, useSavedSelections, usePinnedFeatures } from "hooks/DataHooks";
import { useWindowManager } from "hooks/WindowHooks";
import { useGlobalChartState } from "hooks/UiHooks";

const DEFAULT_POINT_COLOR = "#3386E6";

/**
 * transpose a (possibly ragged) 2d array z. inspired by
 * http://stackoverflow.com/questions/17428587/
 * transposing-a-2d-array-in-javascript
 */
function transposeRagged(z) {
    let maxlen = 0;
    let zlen = z.length;
    let i, j;
    // Maximum row length:
    for (i = 0; i < zlen; i++) maxlen = Math.max(maxlen, z[i].length);

    let t = new Array(maxlen);
    for (i = 0; i < maxlen; i++) {
        t[i] = new Array(zlen);
        for (j = 0; j < zlen; j++) t[i][j] = z[j][i];
    }

    return t;
}

// our own dot function so that we don't need to include numeric
function dot(x, y) {
    if (!(x.length && y.length) || x.length !== y.length) return null;

    let len = x.length;
    let out;
    let i;

    if (x[0].length) {
        // mat-vec or mat-mat
        out = new Array(len);
        for (i = 0; i < len; i++) out[i] = dot(x[i], y);
    } else if (y[0].length) {
        // vec-mat
        let yTranspose = transposeRagged(y);
        out = new Array(yTranspose.length);
        for (i = 0; i < yTranspose.length; i++) out[i] = dot(x, yTranspose[i]);
    } else {
        // vec-vec
        out = 0;
        for (i = 0; i < len; i++) out += x[i] * y[i];
    }

    return out;
}

/**
 * Test if a segment of a points array is bent or straight
 *
 * @param pts Array of [x, y] pairs
 * @param start the index of the proposed start of the straight section
 * @param end the index of the proposed end point
 * @param tolerance the max distance off the line connecting start and end
 *      before the line counts as bent
 * @returns boolean: true means this segment is bent, false means straight
 */
function isSegmentBent(pts, start, end, tolerance) {
    let startPt = pts[start];
    let segment = [pts[end][0] - startPt[0], pts[end][1] - startPt[1]];
    let segmentSquared = dot(segment, segment);
    let segmentLen = Math.sqrt(segmentSquared);
    let unitPerp = [-segment[1] / segmentLen, segment[0] / segmentLen];
    let i;
    let part;
    let partParallel;

    for (i = start + 1; i < end; i++) {
        part = [pts[i][0] - startPt[0], pts[i][1] - startPt[1]];
        partParallel = dot(part, segment);

        if (
            partParallel < 0 ||
            partParallel > segmentSquared ||
            Math.abs(dot(part, unitPerp)) > tolerance
        )
            return true;
    }
    return false;
}

/**
 * Make a filtering polygon, to minimize the number of segments
 *
 * @param pts Array of [x, y] pairs (must start with at least 1 pair)
 * @param tolerance the maximum deviation from straight allowed for
 *      removing points to simplify the polygon
 *
 * @returns Object {addPt, raw, filtered}
 *      addPt is a function(pt: [x, y] pair) to add a raw point and
 *          continue filtering
 *      raw is all the input points
 *      filtered is the resulting filtered Array of [x, y] pairs
 */
function filterPolygon(pts) {
    let tolerance = 1.5;
    let ptsFiltered = [pts[0]];
    let doneRawIndex = 0;
    let doneFilteredIndex = 0;

    function addPt(pt) {
        pts.push(pt);
        let prevFilterLen = ptsFiltered.length;
        let iLast = doneRawIndex;
        ptsFiltered.splice(doneFilteredIndex + 1);

        for (let i = iLast + 1; i < pts.length; i++) {
            if (i === pts.length - 1 || isSegmentBent(pts, iLast, i + 1, tolerance)) {
                ptsFiltered.push(pts[i]);
                if (ptsFiltered.length < prevFilterLen - 2) {
                    doneRawIndex = i;
                    doneFilteredIndex = ptsFiltered.length - 1;
                }
                iLast = i;
            }
        }
    }

    if (pts.length > 1) {
        let lastPt = pts.pop();

        addPt(lastPt);
    }

    return {
        addPt: addPt,
        raw: pts,
        filtered: ptsFiltered
    };
}

function polygonTester(ptsIn) {
    let pts = ptsIn.slice();
    let xmin = pts[0][0];
    let xmax = xmin;
    let ymin = pts[0][1];
    let ymax = ymin;
    let i;

    pts.push(pts[0]);
    for (i = 1; i < pts.length; i++) {
        xmin = Math.min(xmin, pts[i][0]);
        xmax = Math.max(xmax, pts[i][0]);
        ymin = Math.min(ymin, pts[i][1]);
        ymax = Math.max(ymax, pts[i][1]);
    }

    // do we have a rectangle? Handle this here, so we can use the same
    // tester for the rectangular case without sacrificing speed

    let isRect = false;
    let rectFirstEdgeTest;

    if (pts.length === 5) {
        if (pts[0][0] === pts[1][0]) {
            // vert, horz, vert, horz
            if (pts[2][0] === pts[3][0] && pts[0][1] === pts[3][1] && pts[1][1] === pts[2][1]) {
                isRect = true;
                rectFirstEdgeTest = function(pt) {
                    return pt[0] === pts[0][0];
                };
            }
        } else if (pts[0][1] === pts[1][1]) {
            // horz, vert, horz, vert
            if (pts[2][1] === pts[3][1] && pts[0][0] === pts[3][0] && pts[1][0] === pts[2][0]) {
                isRect = true;
                rectFirstEdgeTest = function(pt) {
                    return pt[1] === pts[0][1];
                };
            }
        }
    }

    function rectContains(pt, omitFirstEdge) {
        let x = pt[0];
        let y = pt[1];

        if (x < xmin || x > xmax || y < ymin || y > ymax) {
            // pt is outside the bounding box of polygon
            return false;
        }
        if (omitFirstEdge && rectFirstEdgeTest(pt)) return false;

        return true;
    }

    function contains(pt, omitFirstEdge) {
        let x = pt[0];
        let y = pt[1];

        if (x < xmin || x > xmax || y < ymin || y > ymax) {
            // pt is outside the bounding box of polygon
            return false;
        }

        let imax = pts.length;
        let x1 = pts[0][0];
        let y1 = pts[0][1];
        let crossings = 0;
        let i;
        let x0;
        let y0;
        let xmini;
        let ycross;

        for (i = 1; i < imax; i++) {
            // find all crossings of a vertical line upward from pt with
            // polygon segments
            // crossings exactly at xmax don't count, unless the point is
            // exactly on the segment, then it counts as inside.
            x0 = x1;
            y0 = y1;
            x1 = pts[i][0];
            y1 = pts[i][1];
            xmini = Math.min(x0, x1);

            if (x < xmini || x > Math.max(x0, x1) || y > Math.max(y0, y1)) {
                // outside the bounding box of this segment, it's only a crossing
                // if it's below the box.

                continue;
            } else if (y < Math.min(y0, y1)) {
                // don't count the left-most point of the segment as a crossing
                // because we don't want to double-count adjacent crossings
                // UNLESS the polygon turns past vertical at exactly this x
                // Note that this is repeated below, but we can't factor it out
                // because
                if (x !== xmini) crossings++;
            } else {
                // inside the bounding box, check the actual line intercept

                // vertical segment - we know already that the point is exactly
                // on the segment, so mark the crossing as exactly at the point.
                if (x1 === x0) ycross = y;
                // any other angle
                else ycross = y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);

                // exactly on the edge: counts as inside the polygon, unless it's the
                // first edge and we're omitting it.
                if (y === ycross) {
                    if (i === 1 && omitFirstEdge) return false;
                    return true;
                }

                if (y <= ycross && x !== xmini) crossings++;
            }
        }

        // if we've gotten this far, odd crossings means inside, even is outside
        return crossings % 2 === 1;
    }

    // detect if poly is degenerate
    let degenerate = true;
    let lastPt = pts[0];
    for (i = 1; i < pts.length; i++) {
        if (lastPt[0] !== pts[i][0] || lastPt[1] !== pts[i][1]) {
            degenerate = false;
            break;
        }
    }

    return {
        xmin: xmin,
        xmax: xmax,
        ymin: ymin,
        ymax: ymax,
        pts: pts,
        contains: isRect ? rectContains : contains,
        isRect: isRect,
        degenerate: degenerate
    };
}

function getPointIndicesFromPolygon(lassoPoints, dataPoints) {
    let zippedLassoPoints = [lassoPoints.x, lassoPoints.y][0].map((col, i) =>
        dataPoints.map(row => row[i])
    );
    let filteredPolygon = filterPolygon(zippedLassoPoints);

    let polygonTest = polygonTester(filteredPolygon.filtered);

    let zippedPoints = dataPoints[0].map((col, i) => dataPoints.map(row => row[i]));
    let pointIndices = [];

    for (let i = 0; i < zippedPoints.length; i++) {
        if (polygonTest.contains(zippedPoints[i], true)) pointIndices.push(i);
    }

    return pointIndices;
}

function ContourGraph(props) {
    const chart = useRef(null);

    // plug through props
    const cols = props.data.map(f => f.get("data")).toJS();
    const xAxis = props.data.get(0).get("feature");
    const yAxis = props.data.getIn([1, "feature"]);

    //const cols = utils.unzip(data.slice(1));
    // The plotly react element only changes when the revision is incremented.
    const [chartRevision, setChartRevision] = useState(0);

    // Initial chart settings. These need to be kept in state and updated as necessary
    const [chartState, setChartState] = useState({
        data: [
            {
                x: cols[0],
                y: cols[1],
                ncontours: 20,
                colorscale: "Hot",
                reversescale: true,
                showscale: false,
                type: "histogram2dcontour"
                // mode: "markers",
                // marker: { color: cols[0].map((val, idx) => DEFAULT_POINT_COLOR), size: 2 },
                // selected: { marker: { color: "#FF0000", size: 2 } },
                // visible: true
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 35, r: 0, t: 0, b: 25 }, // Axis tick labels are drawn in the margin space
            dragmode: "lasso",
            datarevision: chartRevision,
            hovermode: "closest",
            xaxis: {
                autotick: true,
                automargin: true,
                ticks: "outside",
                title: xAxis
            },
            yaxis: {
                autotick: true,
                automargin: true,
                ticks: "outside",
                title: yAxis
            }
        },
        config: {
            responsive: true,
            displaylogo: false,
            modeBarButtonsToRemove: [
                "sendDataToCloud",
                "hoverCompareCartesian",
                "toImage",
                "select2d",
                "autoScale2d",
                "toggleSpikelines"
            ]
        }
    });

    function updateChartRevision() {
        const revision = chartRevision + 1;
        setChartState({
            ...chartState,
            layout: { ...chartState.layout, datarevision: revision }
        });
        setChartRevision(revision);
    }

    return (
        <GraphWrapper chart={chart}>
            <Plot
                ref={chart}
                data={chartState.data}
                layout={chartState.layout}
                config={chartState.config}
                style={{ width: "100%", height: "100%" }}
                useResizeHandler
                onInitialized={figure => setChartState(figure)}
                onUpdate={figure => setChartState(figure)}
                /*onClick={e => {
                    if (e.event.button === 2) return;
                    props.setCurrentSelection([]);
                }}
                onSelected={e => {
                    //need to take the lasso points and calculate all of the scatter points within the bounding box
                    let pointIndices = getPointIndicesFromPolygon(e.lassoPoints, cols);
                    if (e) props.setCurrentSelection(pointIndices);
                }}*/
            />
        </GraphWrapper>
    );
}

export default props => {
    const win = useWindowManager(props, {
        width: 500,
        height: 500,
        resizeable: true,
        title: "Contour Graph"
    });

    const [currentSelection, setCurrentSelection] = useCurrentSelection();
    const [savedSelections, saveCurrentSelection] = useSavedSelections();
    const [globalChartState, setGlobalChartState] = useGlobalChartState();

    const features = usePinnedFeatures();

    if (features === null) {
        return <WindowCircularProgress />;
    }

    if (features.size === 2) {
        console.log(features.map(f => f.get("data")));
        win.setTitle(
            features
                .map(f => f.get("feature"))
                .toJS()
                .join(" vs ")
        );
        return (
            <ContourGraph
                currentSelection={currentSelection}
                setCurrentSelection={setCurrentSelection}
                savedSelections={savedSelections}
                saveCurrentSelection={saveCurrentSelection}
                globalChartState={globalChartState}
                data={features}
            />
        );
    } else {
        return (
            <WindowError>
                Please select exactly two features
                <br />
                in the features list to use this graph.
            </WindowError>
        );
    }
};
