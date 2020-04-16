import "./ExplainThis.scss";

import Button from "@material-ui/core/Button";
import CircularProgress from "@material-ui/core/CircularProgress";
import FormControl from "@material-ui/core/FormControl";
import HelpOutline from "@material-ui/icons/HelpOutline";
import IconButton from "@material-ui/core/IconButton";
import MenuItem from "@material-ui/core/MenuItem";
import Plot from "react-plotly.js";
import React, { useRef, useState, useEffect } from "react";
import Select from "@material-ui/core/Select";
import Slider from "@material-ui/lab/Slider";
import * as d3SC from "d3-scale-chromatic";

import * as d3 from "d3";

import { WindowError } from "..//WindowHelpers/WindowCenter";
import { WindowTogglableCover } from "..//WindowHelpers/WindowLayout";
import { useSelectedFeatureNames, useFilename, useSavedSelections } from "../../hooks/DataHooks";
import { useWindowManager } from "../../hooks/WindowHooks";
import HelpContent from "../Help/HelpContent";
import * as utils from "../../utils/utils";

// this section of code is mostly d3 and stuff that directly facilitates the tree rendering

//general helper functions go here
function createExplainThisRequest(filename, selections, dataFeatures) {
    return {
        routine: "workflow",
        dataSelections: selections,
        workflow: "explain_this",
        dataFeatures: dataFeatures,
        sessionkey: utils.getGlobalSessionKey(),
        file: filename,
        cid: "8ksjk",
        identification: { id: "dev0" }
    };
}

/*
    Function that handles truncatng longer numbers so they fit
    into the node boxes
*/
function processFloatingPointNumber(number) {
    let roundedNumber = Math.round(number * Math.pow(10, 2)) / Math.pow(10, 2);
    let newNumber = "";
    //see if has decimal
    if ((roundedNumber + "").length > 6) {
        //convert to scientific notation
        newNumber = roundedNumber.toExponential(1);
    } else {
        newNumber = roundedNumber;
    }

    return newNumber;
}

//this section of the code handles the manipulation of the tree
//Toggle children.
function toggle(d) {
    //decide base
    if (d.children && childrenHidden(d)) {
        toggleRecursive(d, false);
    } else if (d.children && !childrenHidden(d)) {
        toggleRecursive(d, true);
    }
}

//recursively turns everything off
function toggleRecursive(d, signal) {
    if (d.children) {
        d.children.forEach(d => {
            d.hidden = signal;
            toggleRecursive(d, signal);
        });
    }
}

function hasLeafChildren(d) {
    if (d.children != undefined && d.children != null) {
        let has = true;
        d.children.forEach(child => {
            has = has && child.leaf;
        });

        return has;
    }
    return false;
}

function childrenHidden(d) {
    if (d.leaf) return true;
    let hidden = true;

    d.children.forEach(d => {
        hidden = hidden && d.hidden;
    });

    return hidden;
}

function calculateNumLeafNodes(treeData) {
    let num = 0;
    if (hasLeafChildren(treeData)) num++;

    let left = treeData.children != undefined ? calculateNumLeafNodes(treeData.children[0]) : 0;
    let right = treeData.children != undefined ? calculateNumLeafNodes(treeData.children[1]) : 0;

    num += left + right;

    return num;
}

function textSize(text) {
    if (!d3) return;
    let container = d3.select("body").append("svg");
    container
        .append("text")
        .attr({ x: -99999, y: -99999 })
        .text(text);
    let size = container.node().getBBox();
    container.remove();
    return { width: size.width, height: size.height };
}

//this section of code is for svg helper functions

/*
    This is where the color gradient is defined
*/

/*let color_map = d3.scale
    .linear()
    .domain([0, 1])
    .range(["blue",  "red"]);
*/
/*
let color_map = d3.scale
    .linear()
    .domain([0, 1])
    .interpolate(d3.interpolateHcl)
    .range(["hsl(0, 90%, 92%)", "hsl(240, 27%, 21%)"]);
*/

let color_map = d3SC.interpolatePlasma;

/*
    This function handles drawing the arrow on the right side of the
    screen
*/
function drawScaleArrow(svgRef, width, height) {
    //make the arrow on the right side of the screen
    d3.select(svgRef)
        .append("svg:g")
        .append("svg:defs")
        .append("svg:marker")
        .attr("id", "triangle")
        .attr("refX", 6)
        .attr("refY", 6)
        .attr("markerWidth", 30)
        .attr("markerHeight", 30)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 0 0 12 6 0 12 3 6")
        .style("fill", "black");

    d3.select(svgRef)
        .append("svg:g")
        .append("svg:defs")
        .append("svg:marker")
        .attr("id", "triangle2")
        .attr("refX", 6)
        .attr("refY", 6)
        .attr("markerWidth", 30)
        .attr("markerHeight", 30)
        .attr("markerUnits", "userSpaceOnUse")
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M 12 12 0 6 12 0 9 6")
        .style("fill", "black");

    //line
    d3.select(svgRef)
        .append("line")
        .attr("x1", width + 45)
        .attr("y1", 100)
        .attr("x2", width + 45)
        .attr("y2", height - 200)
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("marker-end", "url(#triangle)")
        .attr("marker-start", "url(#triangle2)");

    d3.select(svgRef)
        .append("text")
        .text("Greater")
        .attr("x", width + 20)
        .attr("y", 80);

    d3.select(svgRef)
        .append("text")
        .text("Lesser")
        .attr("x", width + 29)
        .attr("y", height - 175);
}

function drawColorGradient(svgRef, width, height, selectionNames) {
    const barHeight = 20;
    //defines the gradient
    let gradientContainer = d3
        .select(svgRef)
        .append("svg:g")
        .attr("transform", "translate(" + width / 4 + "," + 10 + ")");

    gradientContainer
        .append("text")
        .text(selectionNames[1])
        .attr("x", width / 8 - textSize(selectionNames[1]).width)
        .attr("y", 5 + barHeight / 2);
    //janky constants needed to center the gradient container
    gradientContainer
        .append("text")
        .text(selectionNames[0])
        .attr("x", width / 8 + width / 2 + 20)
        .attr("y", 5 + barHeight / 2);

    let linearGradient = gradientContainer
        .append("defs")
        .append("linearGradient")
        .attr("id", "linear-gradient");

    linearGradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color_map(0));

    linearGradient
        .append("stop")
        .attr("offset", "50%")
        .attr("stop-color", color_map(0.5));

    linearGradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color_map(1));

    let gradientRect = gradientContainer
        .append("rect")
        .attr("x", width / 8 + 10)
        .attr("y", 0)
        .attr("width", width / 2)
        .attr("height", barHeight)
        .style("stroke", "black")
        .style("stroke-width", 2)
        .style("fill", "url(#linear-gradient)");
}

function generateTree(treeData, selectionNames, svgRef) {
    //setup margins and size for the d3 window
    let margin = { top: 0, right: 20, bottom: 10, left: 85 },
        i = 0,
        width = svgRef.clientWidth - margin.right - margin.left,
        height = svgRef.clientHeight - margin.top - margin.bottom,
        rect_width = 80,
        rect_height = 20,
        max_link_width = 20,
        min_link_width = 4,
        root;

    //might change this later to be dynamic based on the number of leaf nodes
    let maxDepth = 4;

    /**
     * Mixes colors according to the relative frequency of classes.
     */
    function mix_colors(d) {
        let values = Object.values(d.target.proportions);
        let sum = d.target.proportions.class_0 + d.target.proportions.class_1;

        let col = d3.rgb(color_map(values[0] / sum));

        return col;
    }

    // Node labels
    function node_label(d) {
        if (d.hidden) return "";

        if (d.leaf) {
            return selectionNames[d.class];
        }
        let split = d.name.split(" ");
        let float = processFloatingPointNumber(parseFloat(split[2])); //truncate to two decimal places
        let featureName = split[0];
        let name =
            featureName.length > 12
                ? featureName.substring(0, 4) +
                  "..." +
                  featureName.substring(featureName.length - 4)
                : featureName;

        return name + split[1] + float;
    }

    let tree = d3.layout.tree().size([height - 140, width]);
    //.nodeSize(nodeSize);

    let diagonal = d3.svg.diagonal().projection(function(d) {
        return [d.y, d.x];
    });

    let vis = d3
        .select(svgRef)
        .append("svg:g")
        .attr("transform", "translate(" + margin.left + "," + 40 + ")");

    drawColorGradient(svgRef, width, height, selectionNames);

    drawScaleArrow(svgRef, width, height);

    // global scale for link width
    let link_stoke_scale = d3.scale.linear();

    // stroke style of link - either color or function
    let stroke_callback = "#ccc";

    function load_dataset(json) {
        root = json;
        root.x0 = 0;
        root.y0 = 0;

        let n_samples = root.samples;

        stroke_callback = mix_colors;

        link_stoke_scale = d3.scale
            .linear()
            .domain([0, n_samples])
            .range([min_link_width, max_link_width]);

        // Initialize the display to show a few nodes.
        //root.children.forEach(toggleAll);

        update(root);
    }

    function update(source) {
        let duration = 600;

        // Compute the new tree layout.
        let nodes = tree.nodes(root).reverse();

        //This section of code is used to determine the
        //height and width of the links
        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
            d.y = d.depth * 110;
        });

        // Update the nodes…
        let node = vis.selectAll("g.node").data(nodes, function(d) {
            return d.id || (d.id = ++i);
        });

        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node
            .enter()
            .append("svg:g")
            .attr("class", "node")
            .attr("transform", function(d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", function(d) {
                if (!d.hidden) {
                    toggle(d);
                    update(d);
                }
            });

        function getBB(selection) {
            selection.each(function(d) {
                d.bbox = this.getBBox();
            });
        }

        nodeEnter
            .append("svg:text")
            .attr("dy", "6px")
            .attr("text-anchor", "middle")
            .text(node_label)
            .style("fill-opacity", 1e-6)
            .style("opacity", function(d) {
                return d.hidden ? 0 : 1;
            })
            .call(getBB)
            .append("svg:title")
            .text(function(d) {
                return d.name;
            });

        let rectPadding = 10;

        nodeEnter
            .insert("rect", "text")
            .attr("width", function(d) {
                return d.bbox.width + rectPadding;
            })
            .attr("height", function(d) {
                return d.bbox.height;
            })
            .attr("x", function(d) {
                return -d.bbox.width / 2 - rectPadding / 2;
            })
            .attr("y", function(d) {
                return -d.bbox.height / 2;
            })
            .attr("rx", function(d) {
                return 2;
            })
            .attr("ry", function(d) {
                return 2;
            })
            .style("fill", function(d) {
                return !d.leaf && childrenHidden(d) ? "steelblue" : "#fff";
            })
            .style("stroke", function(d) {
                return d.type === "split" ? "steelblue" : "#bbbbbb";
            })
            .style("opacity", function(d) {
                return !d.hidden ? 0 : 1;
            });

        // Transition nodes to their new position.
        let nodeUpdate = node
            .transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        nodeUpdate
            .select("rect")
            .style("stroke", function(d) {
                if (d.leaf) {
                    //is a leaf
                    //color based on which label is chosen for this leaf
                    if (d.class == 1) {
                        return color_map(0);
                    } else {
                        return color_map(1);
                    }
                } else {
                    return "#bbbbbb";
                }
            })
            .style("stroke-width", function(d) {
                return d.leaf ? 4 : 1;
            })
            .style("opacity", function(d) {
                return d.hidden ? 0 : 1;
            });

        nodeUpdate.select("text").style("fill-opacity", function(d) {
            return d.hidden ? 0 : 1;
        });

        // Transition exiting nodes to the parent's new position.
        let nodeExit = node
            .exit()
            .transition()
            .duration(duration)
            .attr("transform", function(d) {
                return "translate(" + source.y + "," + source.x + ")";
            })
            .remove();

        nodeExit
            .select("rect")
            .attr("width", 1e-6)
            .attr("height", 1e-6);

        nodeExit.select("text").style("fill-opacity", 1e-6);

        // Update the links
        let link = vis.selectAll("path.link").data(tree.links(nodes), function(d) {
            return d.target.id;
        });

        // Enter any new links at the parent's previous position.
        link.enter()
            .insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                let o = { x: source.x0, y: source.y0 };
                return diagonal({ source: o, target: o });
            })
            .transition()
            .duration(duration)
            .attr("d", diagonal)
            .style("stroke-width", function(d) {
                return link_stoke_scale(d.target.samples);
            })
            .style("stroke", stroke_callback)
            .style("opacity", function(d) {
                return d.target.hidden ? 0 : 1;
            });

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal)
            .style("stroke-width", function(d) {
                return link_stoke_scale(d.target.samples);
            })
            .style("stroke", stroke_callback)
            .style("fill", "none") //this line is used to fix the rendering of the black background stuff
            .style("opacity", function(d) {
                return d.target.hidden ? 0 : 1;
            });

        // Transition exiting nodes to the parent's new position.
        link.exit()
            .transition()
            .duration(duration)
            .attr("d", function(d) {
                let o = { x: source.x, y: source.y };
                return diagonal({ source: o, target: o });
            })
            .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }
    load_dataset(treeData);
}

// ------------ this is where actual components start ------------

/*
    The component that allows the user to select two selections
    to explain
*/
function ChooseSelections(props) {
    return (
        <div className="selections-chooser">
            <p className="selection-chooser-header">Choose Two Selections</p>
            <FormControl className="selection-dropdown">
                <Select
                    value={props.chosenSelections[0] != null ? props.chosenSelections[0] : ""}
                    onChange={e => {
                        props.setChosenSelections([e.target.value, props.chosenSelections[1]]);
                        props.setRunButtonPressed(false);
                        props.setDataState(undefined);
                    }}
                >
                    {(function() {
                        let arr = [];

                        for (let i = 0; i < props.selections.length; i++) {
                            if (props.selections[i].active && props.chosenSelections[1] != i) {
                                arr.push(
                                    <MenuItem key={props.selections[i].name} value={i}>
                                        {props.selections[i].name}
                                    </MenuItem>
                                );
                            }
                        }
                        return arr;
                    })()}
                </Select>
            </FormControl>
            <FormControl className="selection-dropdown">
                <Select
                    value={props.chosenSelections[1] != null ? props.chosenSelections[1] : ""}
                    onChange={e => {
                        props.setChosenSelections([props.chosenSelections[0], e.target.value]);
                        props.setRunButtonPressed(false);
                        props.setDataState(undefined);
                    }}
                >
                    {(function() {
                        let arr = [];

                        for (let i = 0; i < props.selections.length; i++) {
                            if (props.selections[i].active && props.chosenSelections[0] != i) {
                                arr.push(
                                    <MenuItem key={props.selections[i].name} value={i}>
                                        {props.selections[i].name}
                                    </MenuItem>
                                );
                            }
                        }

                        return arr;
                    })()}
                </Select>
            </FormControl>
        </div>
    );
}

/*
    The graph that displays the scores of the trees at various
    depths and allows a user to scroll between them.
*/
function TreeSweepScroller(props) {
    if (!props.tree_sweep) {
        return (
            <div className="tree-sweep-scroller">
                <div className="tree-sweep-scroller-title"> Score vs Tree Depth </div>
            </div>
        );
    }

    const [listClass, setListClass] = useState([]);

    const currentSelectionRef = useRef(null);
    const xVals = [...Array(props.tree_sweep.length).keys()];
    const chartOptions = {
        data: [
            {
                x: xVals,
                y: props.tree_sweep.map(tree => {
                    return tree.score;
                }),
                type: "scatter",
                mode: "lines+markers",
                //visible: true,
                marker: {
                    color: xVals.map(val => (val === props.treeIndex ? "#F5173E" : "#3386E6")),
                    size: 6
                },
                hoverinfo: "text",
                text: props.tree_sweep.map((r, idx) => `Score ${r.score} at depth ${idx + 1}`)
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 20, r: 10, t: 0, b: 20 }, // Axis tick labels are drawn in the margin space
            showlegend: false,
            xaxis: {
                automargin: true,
                fixedrange: true
            },
            yaxis: {
                automargin: true,
                range: [0, 105],
                fixedrange: true
            }
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    };

    return (
        <div className="tree-sweep-scroller">
            <div className="tree-sweep-scroller-title"> Score vs Tree Depth </div>
            <Plot
                className="tree-sweep-plot"
                data={chartOptions.data}
                layout={chartOptions.layout}
                config={chartOptions.config}
                useResizeHandler
            />
            <Slider
                className="tree-sweep-slider"
                value={props.treeIndex}
                min={0}
                max={props.tree_sweep.length - 1}
                step={1}
                onChange={(_, val) => {
                    props.setTreeIndex(val);
                }}
            />
        </div>
    );
}

/*
    Comnponent that handles drawing the histogram that displays
    feature importances.
*/
function FeatureImportanceGraph(props) {
    if (props.featureImportances === undefined || props.rankedFeatures === undefined) {
        return (
            <React.Fragment>
                <div className="feature-importance-graph-title">Feature Importances</div>
                <div className="feature-importance-graph" />
            </React.Fragment>
        );
    }

    console.log(props.rankedFeatures);
    const chartOptions = {
        data: [
            {
                x: props.featureImportances.slice().reverse(),
                y: props.rankedFeatures.slice().reverse(),
                yaxis: "y",
                type: "bar",
                orientation: "h",
                hoverinfo: "x",
                textposition: "auto"
            }
        ],
        config: {
            displaylogo: false,
            displayModeBar: false
        },
        layout: {
            autosize: false,
            height: 100 + 30 * props.featureImportances.length,
            width: 200,
            margin: { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            xaxis: {
                automargin: false,
                fixedrange: true,
                range: [0, 100]
            },
            yaxis: {
                automargin: true,
                fixedrange: true
            }
        }
    };

    return (
        <React.Fragment>
            <div className="feature-importance-graph-title">Feature Importances</div>
            <Plot
                className="feature-importance-graph"
                data={chartOptions.data}
                layout={chartOptions.layout}
                config={chartOptions.config}
            />
        </React.Fragment>
    );
}

/*
    This is the component that holds all of the forms and 
    graphs on the left side of the component.
*/
function LeftSidePanel(props) {
    return (
        <div className="feature-list">
            <TreeSweepScroller
                setTreeIndex={props.setTreeIndex}
                tree_sweep={props.tree_sweep}
                treeIndex={props.treeIndex}
                runButtonPressed={props.runButtonPressed}
            />
            <FeatureImportanceGraph
                rankedFeatures={props.rankedFeatures}
                featureImportances={props.importances}
            />
            <ChooseSelections
                selections={props.selections}
                setChosenSelections={props.setChosenSelections}
                chosenSelections={props.chosenSelections}
                setRunButtonPressed={props.setRunButtonPressed}
                setDataState={props.setDataState}
            />
            <Button
                className="run-button"
                variant="contained"
                color="primary"
                onClick={_ => {
                    props.setRunButtonPressed(true);
                }}
            >
                Run
            </Button>
        </div>
    );
}

function TreeSummary(props) {
    if (props.treeData == undefined) {
        return <div className="tree-summary">No tree is defined</div>;
    }

    function generateSummaryFromData(data, depth) {
        //recursively construct a python esque description of the tree

        let description = "";
        if (data.children != undefined) {
            const left =
                data.children[0] != undefined
                    ? generateSummaryFromData(data.children[0], depth + 1)
                    : "";
            const right =
                data.children[1] != undefined
                    ? generateSummaryFromData(data.children[1], depth + 1)
                    : "";

            return (
                <React.Fragment>
                    <div style={{ marginLeft: 10 * depth }}> {"if " + data.name + " :"} </div>
                    <div style={{ marginLeft: 10 * depth }}> {left} </div>
                    <div style={{ marginLeft: 10 * depth }}> {"else:"} </div>
                    <div style={{ marginLeft: 10 * depth }}> {right} </div>
                </React.Fragment>
            );
        } else {
            //leaf node
            return (
                <div style={{ marginLeft: 10 * depth }}> {props.selectionNames[data.class]} </div>
            );
        }
    }

    return (
        <div className="tree-summary">{generateSummaryFromData(props.treeData.json_tree, 0)}</div>
    );
}

/*
    This component holds the actual tree diagram for explain this.
*/
function ExplainThisTreeDiagram(props) {
    //handle the null cases
    if (!props.treeData && !props.runButtonPressed) {
        return <div className="load-failure">Choose selections and run</div>;
    } else if (!props.treeData) {
        return (
            <div className="load-failure">
                <CircularProgress />
            </div>
        );
    }

    //declaring svgRef so that the callback in the jsx below can reach it
    let svgRef = null;
    //wraps the entire functionality in lifecycle methods
    useEffect(
        _ => {
            if (!svgRef) return;
            d3.selectAll(".tree-container > *").remove();
            //process the json tree
            //the tree needs to be flipped

            generateTree(props.treeData.json_tree, props.selectionNames, svgRef);
        },
        [props.treeData]
    );

    return (
        <svg
            className="tree-container"
            ref={element => {
                svgRef = element;
            }}
        />
    );
}

/*
    This is the parent component of this file. 
    It handles the rendering of the explain this tree
    and visualizing all of the data associated with it.
*/
function ExplainThis(props) {
    //make a data state object to hold the data in the request
    const [dataState, setDataState] = useState(undefined);
    //holds the index of the current tree as determined by the tree scroller
    const [treeIndex, setTreeIndex] = useState(0);
    const [runButtonPressed, setRunButtonPressed] = useState(false);
    const [chosenSelections, setChosenSelections] = useState([null, null]);
    const [helpActive, setHelpActive] = useState(false);
    const [summaryActive, setSummaryActive] = useState(false);

    //this code handles automatically inputting two selections into the dropdown lists
    //if they exist
    useEffect(
        _ => {
            let newChosenSelections = [...chosenSelections];
            if (newChosenSelections[0] != null && !props.selections[newChosenSelections[0]].active)
                newChosenSelections[0] = null;
            if (newChosenSelections[1] != null && !props.selections[newChosenSelections[1]].active)
                newChosenSelections[1] = null;

            if (newChosenSelections[0] === null) {
                props.selections.forEach((selection, idx) => {
                    if (selection.active && idx != newChosenSelections[1])
                        newChosenSelections[0] = idx;
                });
            }

            if (newChosenSelections[1] === null) {
                props.selections.forEach((selection, idx) => {
                    if (selection.active && idx != newChosenSelections[0])
                        newChosenSelections[1] = idx;
                });
            }
            setChosenSelections(newChosenSelections);
        },
        [props.selections]
    );

    /*
        Code that handles running the explain this workflow after the 
        run button has been pressed
    */
    useEffect(
        _ => {
            //code to handle pulling the data from the selections chosen in the dropdown lists
            if (chosenSelections[0] == null || chosenSelections[1] == null || !runButtonPressed) {
                return;
            }

            //get indices from selection names
            let firstSelectionIndices = [];
            let secondSelectionIndices = [];
            for (let i = 0; i < props.selections.length; i++) {
                if (i === chosenSelections[0]) {
                    firstSelectionIndices = props.selections[i].rowIndices;
                } else if (i === chosenSelections[1]) {
                    secondSelectionIndices = props.selections[i].rowIndices;
                }
            }

            //clear current data
            setDataState(undefined);
            //handle the loading of the data request promise
            const request = createExplainThisRequest(
                props.filename,
                [firstSelectionIndices, secondSelectionIndices],
                props.selectedFeatureNames
            );
            const requestMade = utils.makeSimpleRequest(request);
            requestMade.req.then(data => {
                setRunButtonPressed(false);

                const selectionNames = [
                    props.selections[chosenSelections[0]].name,
                    props.selections[chosenSelections[1]].name
                ];
                setDataState({ ...data, selectionNames: selectionNames });
            });

            //cancels the request if the window is closed
            return function cleanup() {
                requestMade.cancel();
            };
        },
        [runButtonPressed]
    );

    return (
        <div className="explain-this-container">
            <LeftSidePanel
                rankedFeatures={
                    dataState != undefined
                        ? dataState.tree_sweep[treeIndex].feature_rank
                        : undefined
                }
                importances={
                    dataState != undefined
                        ? dataState.tree_sweep[treeIndex].feature_weights
                        : undefined
                }
                setTreeIndex={setTreeIndex}
                tree_sweep={dataState != undefined ? dataState.tree_sweep : undefined}
                setRunButtonPressed={setRunButtonPressed}
                runButtonPressed={runButtonPressed}
                treeIndex={treeIndex}
                selections={props.selections}
                setChosenSelections={setChosenSelections}
                chosenSelections={chosenSelections}
                setDataState={setDataState}
            />
            <ExplainThisTreeDiagram
                runButtonPressed={runButtonPressed}
                treeData={dataState != undefined ? dataState.tree_sweep[treeIndex] : undefined}
                chosenSelections={chosenSelections}
                selectionNames={dataState != undefined ? dataState.selectionNames : undefined}
            />
            <div className="help-button">
                <IconButton hidden={helpActive} onClick={() => setHelpActive(true)}>
                    <HelpOutline />
                </IconButton>
            </div>
            <Button
                className="summary-button"
                variant="contained"
                color="primary"
                onClick={_ => {
                    setSummaryActive(true);
                }}
            >
                Summary
            </Button>
            {(function() {
                /*
                        Code to render the cover for either the help screen or the summary screen
                        selectively
                    */
                if (helpActive) {
                    return (
                        <WindowTogglableCover
                            open={helpActive}
                            onClose={() => setHelpActive(false)}
                            title={"Explain This"}
                        >
                            <HelpContent guidancePath={"explain_this_page:general_explain_this"} />
                        </WindowTogglableCover>
                    );
                } else if (summaryActive) {
                    return (
                        <WindowTogglableCover
                            open={summaryActive}
                            onClose={() => setSummaryActive(false)}
                            title={"Explain This Summary"}
                        >
                            <TreeSummary
                                treeData={
                                    dataState != undefined
                                        ? dataState.tree_sweep[treeIndex]
                                        : undefined
                                }
                                selectionNames={
                                    dataState != undefined ? dataState.selectionNames : undefined
                                }
                            />
                        </WindowTogglableCover>
                    );
                }
            })()}
        </div>
    );
}

// wrapped data selector
export default props => {
    const win = useWindowManager(props, {
        width: 910,
        height: 530,
        isResizable: false,
        title: "Explain This"
    });

    const [selectedFeatureNames, setSelectedFeatures] = useSelectedFeatureNames();
    const [selections, setSelections] = useSavedSelections();
    const filename = useFilename();

    if (selectedFeatureNames.size >= 1) {
        return (
            <ExplainThis
                selectedFeatureNames={selectedFeatureNames}
                filename={filename}
                selections={selections}
            />
        );
    } else {
        return <WindowError>Please select at least one feature.</WindowError>;
    }
};
