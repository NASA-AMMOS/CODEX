import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";
import Popover from "@material-ui/core/Popover";
import CircularProgress from "@material-ui/core/CircularProgress";
import * as utils from "utils/utils";
import ReactResizeDetector from "react-resize-detector";
import * as d3 from "d3";
import * as d3SC from "d3-scale-chromatic";
import Plot from "react-plotly.js";
import Button from "@material-ui/core/Button";
import "components/ExplainThis/ExplainThis.scss";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Slider from "@material-ui/lab/Slider";
import { useSelectedFeatureNames, useFilename, useSavedSelections } from "hooks/DataHooks";
import { WindowError, WindowCircularProgress } from "components/WindowHelpers/WindowCenter";
import { useWindowManager } from "hooks/WindowHooks";

// Toggle children.
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
            if (!d.leaf) {
                d.hidden = signal;
                toggleRecursive(d, signal);
            }
        });
    }
}

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

// Node labels
function node_label(d) {
    //split on spaces
    //shorten the name
    //shorten the number
    //add them back together
    if (d.hidden || d.leaf) return "";
    let split = d.name.split(" ");
    let float = processFloatingPointNumber(parseFloat(split[2])); //truncate to two decimal places
    let featureName = split[0];
    let name =
        featureName.length > 8
            ? featureName.substring(0, 2) + "..." + featureName.substring(featureName.length - 2)
            : featureName;

    return name + split[1] + float;
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

function generateTree(treeData, selectionNames, svgRef) {
    let barHeight = 20;
    //setup margins and size for the d3 window
    let margin = { top: 0, right: 20, bottom: 10, left: 65 },
        i = 0,
        width = svgRef.clientWidth - margin.right - margin.left,
        height = svgRef.clientHeight - margin.top - margin.bottom,
        rect_width = 80,
        rect_height = 20,
        max_link_width = 20,
        min_link_width = 4,
        root;

    //might change this later to be dynamic based on the number of leaf nodes
    let maxDepth = 5;
    let numLeafs = calculateNumLeafNodes(treeData);
    let nodeSize = [8, width / maxDepth + 3];

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

    /**
     * Mixes colors according to the relative frequency of classes.
     */
    function mix_colors(d) {
        let values = Object.values(d.target.proportions);
        let sum = d.target.proportions.class_0 + d.target.proportions.class_1;

        let col = d3.rgb(color_map(values[0] / sum));

        return col;
    }

    let tree = d3.layout.tree().nodeSize(nodeSize);

    let diagonal = d3.svg.diagonal().projection(function(d) {
        return [d.y, d.x];
    });

    let vis = d3
        .select(svgRef)
        .append("svg:g")
        .attr("transform", "translate(" + margin.left + "," + (height / 2 - 60) + ")");

    //defines the gradient
    let gradientContainer = d3
        .select(svgRef)
        .append("svg:g")
        .attr("transform", "translate(" + width / 4 + "," + 10 + ")");

    gradientContainer
        .append("text")
        .text(selectionNames[0])
        .attr("x", width / 8 - 10 - 10 - textSize(selectionNames[0]).width)
        .attr("y", 5 + barHeight / 2);
    //janky constants needed to center the gradient container
    gradientContainer
        .append("text")
        .text(selectionNames[1])
        .attr("x", width / 8 - 10 + width / 2 + 10)
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
        .attr("x", width / 8 - 10)
        .attr("y", 0)
        .attr("width", width / 2)
        .attr("height", barHeight)
        .style("stroke", "black")
        .style("stroke-width", 2)
        .style("fill", "url(#linear-gradient)");

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
        .attr("x1", width + 55)
        .attr("y1", 100)
        .attr("x2", width + 55)
        .attr("y2", height - 200)
        .attr("stroke-width", 1)
        .attr("stroke", "black")
        .attr("marker-end", "url(#triangle)")
        .attr("marker-start", "url(#triangle2)");

    d3.select(svgRef)
        .append("text")
        .text("Greater")
        .attr("x", width + 25)
        .attr("y", 80);

    d3.select(svgRef)
        .append("text")
        .text("Lesser")
        .attr("x", width + 34)
        .attr("y", height - 175);

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
        let duration = d3.event && d3.event.altKey ? 5000 : 500;

        // Compute the new tree layout.
        let nodes = tree.nodes(root).reverse();

        // Normalize for fixed-depth.
        nodes.forEach(function(d) {
            d.y = d.depth * 120;
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
                return d.leaf ? 0 : d.bbox.width + rectPadding;
            })
            .attr("height", function(d) {
                return d.leaf ? 0 : d.bbox.height;
            })
            .attr("x", function(d) {
                return -d.bbox.width / 2 - rectPadding / 2;
            })
            .attr("y", function(d) {
                return -d.bbox.height / 2;
            })
            .attr("rx", function(d) {
                return d.type === "split" ? 2 : 0;
            })
            .attr("ry", function(d) {
                return d.type === "split" ? 2 : 0;
            })
            .style("margin", 20)
            .style("stroke", function(d) {
                return d.type === "split" ? "steelblue" : "olivedrab";
            })
            .style("fill", function(d) {
                return !hasLeafChildren(d) && childrenHidden(d) ? "lightsteelblue" : "#fff";
            })
            .style("opacity", function(d) {
                return d.leaf || !d.hidden ? 0 : 1;
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
            .style("fill", function(d) {
                return !hasLeafChildren(d) && childrenHidden(d) ? "lightsteelblue" : "#fff";
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

function createExplainThisRequest(filename, selections, dataFeatures) {
    return {
        routine: "workflow",
        dataSelections: selections,
        workflow: "explain_this",
        dataFeatures: dataFeatures,
        file: filename,
        cid: "8ksjk",
        identification: { id: "dev0" }
    };
}

function ChooseSelections(props) {
    return (
        <div className="selections-chooser">
            <p className="selection-chooser-header">Choose Two Selections</p>
            <FormControl className="selection-dropdown">
                <Select 
                    value={props.chosenSelections[0] != null ? props.chosenSelections[0] : ""} 
                    onChange={
                        e => {
                            props.setChosenSelections([e.target.value, props.chosenSelections[1]]);
                            props.setRunButtonPressed(false);
                            props.setDataState(undefined);
                        }
                    }
                >
                    {
                        (function() {
                            let arr = [];

                            for(let i = 0; i < props.selections.length; i++) {
                                if (props.selections[i].active && props.chosenSelections[1]!=i) {
                                    arr.push(
                                        <MenuItem key={props.selections[i].name} value={i}>
                                            {props.selections[i].name}
                                        </MenuItem>
                                    );
                                }
                            }
                            return arr;
                        })()
                    }
                </Select>
            </FormControl>
            <FormControl className="selection-dropdown">
                <Select 
                    value={props.chosenSelections[1] != null ? props.chosenSelections[1] : ""} 
                    onChange={
                        e => {
                            props.setChosenSelections([props.chosenSelections[0], e.target.value]);
                            props.setRunButtonPressed(false);
                            props.setDataState(undefined);
                        }
                    }
                >
                    {
                        (function() {
                            let arr = [];

                            for(let i = 0; i < props.selections.length; i++) {
                                if (props.selections[i].active && props.chosenSelections[0]!=i) {
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

function TreeSweepScroller(props) {
    if (!props.tree_sweep && props.runButtonPressed) {
        return <div className="tree-sweep-scroller-circular"> <CircularProgress/></div>;
    } else if (!props.tree_sweep) {
        return <div className="tree-sweep-scroller"> Choose selections and run </div>;
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
            margin: { l: 20, r: 10, t: 30, b: 0 }, // Axis tick labels are drawn in the margin space
            showlegend: false,
            xaxis: {
                automargin: true
            },
            yaxis: {
                automargin: true,
                range: [0, 105]
            },
            title: {
                text: "Score vs Tree Depth",
                font: {
                    family: "Roboto, Helvetica, Arial, sans-serif",
                    size: 16
                }
            }
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    };

    return (
        <div className="tree-sweep-scroller">
            <Plot
                className="tree-sweep-plot"
                data={chartOptions.data}
                layout={chartOptions.layout}
                config={chartOptions.config}
                useResizeHandler
                //divId={id}
                //onBeforeHover={e => console.log(e)}
            />
            <Slider
                className="tree-sweep-slider"
                value={props.treeIndex}
                min={0}
                max={props.tree_sweep.length - 1}
                step={1}
                onChange={(_, val) => {
                    props.setTreeIndex(val);
                    //scroll tree sweep list
                }}
            />
        </div>
    );
}

function FeatureImportanceGraph(props) {
    const chartOptions = {
        data: [
            {
                x: props.featureImportances.slice().reverse(),
                y: props.rankedFeatures.slice().reverse(),
                yaxis: "y",
                type: "bar",
                orientation: "h",
                hoverinfo: "x"
            }
        ],
        config: {
            displaylogo: false,
            displayModeBar: false
        },
        layout: {
            autosize: false,
            height: 100 + 15 * props.featureImportances.length,
            width: 200,
            margin: { l: 0, r: 0, t: 0, b: 0 }, // Axis tick labels are drawn in the margin space
            xaxis: {
                automargin: false,
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

function FeatureList(props) {
    if (props.rankedFeatures == undefined) {
        return <CircularProgress />;
    }

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

function ExplainThisTree(props) {
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

function ExplainThis(props) {
    //make a data state object to hold the data in the request
    const [dataState, setDataState] = useState(undefined);
    const [treeIndex, setTreeIndex] = useState(0);
    const [runButtonPressed, setRunButtonPressed] = useState(false);
    const [chosenSelections, setChosenSelections] = useState([null, null]);

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

    useEffect(
        _ => {
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
            const request = createExplainThisRequest(props.filename, [firstSelectionIndices, secondSelectionIndices], props.selectedFeatureNames);
            console.log(request);
            const requestMade = utils.makeSimpleRequest(request);
            requestMade.req.then(data => {
                setRunButtonPressed(false);
                
                const selectionNames = [props.selections[chosenSelections[0]].name, props.selections[chosenSelections[1]].name];
        
                setDataState({...data,selectionNames:selectionNames});
            });

            //cancels the request if the window is closed
            return function cleanup() {
                requestMade.cancel();
            };
        },
        [runButtonPressed]
    );

    if (!dataState && !runButtonPressed) {
        return (
            <div className="explain-this-container">
                <FeatureList
                    rankedFeatures={[]}
                    importances={[]}
                    setRunButtonPressed={setRunButtonPressed}
                    runButtonPressed={runButtonPressed}
                    selections={props.selections}
                    setChosenSelections={setChosenSelections}
                    chosenSelections={chosenSelections}
                />
                <div className="load-failure">Choose selections and run</div>
            </div>
        );
    } else if (!dataState) {
        return (
            <div className="explain-this-container">
                <FeatureList
                    rankedFeatures={[]}
                    importances={[]}
                    setRunButtonPressed={setRunButtonPressed}
                    runButtonPressed={runButtonPressed}
                    selections={props.selections}
                    setChosenSelections={setChosenSelections}
                    chosenSelections={chosenSelections}
                />
                <div className="load-failure">
                    <CircularProgress />
                </div>
            </div>
        );
    } else {
        return (
            <div className="explain-this-container">
                <FeatureList
                    rankedFeatures={dataState.tree_sweep[treeIndex].feature_rank}
                    importances={dataState.tree_sweep[treeIndex].feature_weights}
                    setTreeIndex={setTreeIndex}
                    tree_sweep={dataState.tree_sweep}
                    setRunButtonPressed={setRunButtonPressed}
                    runButtonPressed={runButtonPressed}
                    treeIndex={treeIndex}
                    selections={props.selections}
                    setChosenSelections={setChosenSelections}
                    chosenSelections={chosenSelections}
                    setDataState={setDataState}
                />
                <ExplainThisTree
                    treeData={dataState.tree_sweep[treeIndex]}
                    chosenSelections={chosenSelections}
                    selectionNames={dataState.selectionNames}
                />
            </div>
        );
    }
}

// wrapped data selector
export default props => {
    const win = useWindowManager(props, {
        width: 910,
        height: 530,
        resizeable: false,
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
        return (
            <WindowError>
                Please select exactly two features
                <br />
                in the features list to use this graph.
            </WindowError>
        );
    }
};
