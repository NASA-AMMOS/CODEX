import React, { useRef, useState, useEffect} from "react";
import { bindActionCreators} from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect} from "react-redux";
import Popover from "@material-ui/core/Popover";
import CircularProgress from "@material-ui/core/CircularProgress";
import * as utils from "utils/utils";
import ReactResizeDetector from "react-resize-detector";
import * as d3 from "d3";
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
    if ((roundedNumber + "").length > 4) {
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
    let split = d.name.split(" ");
    let float = processFloatingPointNumber(parseFloat(split[2])); //truncate to two decimal places
    let featureName = split[0];
    let name =featureName.length > 8 ? featureName.substring(0,2) + "..." + featureName.substring(featureName.length - 2) : featureName;

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

function generateTree(treeData, svgRef) {

    let barHeight = 20;
    //setup margins and size for the d3 window
    let margin = { top: 0, right: 20, bottom: 10, left: 65 },
        i = 0,
        width = svgRef.clientWidth - margin.right - margin.left,
        height = svgRef.clientHeight - margin.top - margin.bottom,
        rect_width = 80,
        rect_height = 20,
        max_link_width = 20,
        min_link_width = 1,
        root;

    //might change this later to be dynamic based on the number of leaf nodes
    let maxDepth = 6;
    let numLeafs = calculateNumLeafNodes(treeData);
    let nodeSize = [8, width / maxDepth+3];

    let color_map = d3.scale
        .linear()
        .domain([0, 0.5, 1])
        .range(["blue", "lightgray", "red"]);

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
        .attr("transform", "translate(" + margin.left + "," + ((height / 2) - 20) + ")");

    let gradientContainer = d3
        .select(svgRef)
        .append("svg:g")
        .attr("transform", "translate(" + width / 4 + "," + 10 + ")");

    gradientContainer
        .append("text")
        .text("Class 0")
        .attr("x", -10 - textSize("Class 0").width)
        .attr("y", 5 + barHeight / 2);

    gradientContainer
        .append("text")
        .text("Class 1")
        .attr("x", width / 2 + 10)
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
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width / 2)
        .attr("height", barHeight)
        .style("stroke", "black")
        .style("stroke-width", 2)
        .style("fill", "url(#linear-gradient)");

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
            let firstDepth = 30;
            let yscale = 120;
                d.x+=50;
            if (hasLeafChildren(d) && d.depth == 1) {
                firstDepth = 150;
            } 
            if (d.depth == 0) {
                d.y = 0;
            } else {
                d.y = firstDepth + yscale * (d.depth - 1);
            }
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
            .text(function(d) { return d.name } );    

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

function createExplainThisRequest(filename, labelName, dataFeatures) {
    return {
        routine: "workflow",
        dataSelections: [],
        labelName: labelName,
        workflow: "explain_this",
        dataFeatures: dataFeatures,
        file: filename,
        cid: "8ksjk",
        identification: { id: "dev0" }
    };
}

function ChooseLabel(props) {
    return (
        <div className="label-chooser">
            <p className="feature-list-header">Choose Label</p>
            <FormControl className="labelDropdown">
                <InputLabel>Labels</InputLabel>
                <Select value={props.label} onChange={e => props.setLabel(e.target.value)}>
                    {props.selectedFeatures.map(f => (
                        <MenuItem key={f} value={f}>
                            {f}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </div>
    );
}


function TreeSweepScroller(props) {
    if (!props.tree_sweep)
        return <div className="tree-sweep-scroller"> Loading ... </div>;
    const [listClass, setListClass] = useState([]);

    const currentSelectionRef = useRef(null);
    const xVals = [...Array(props.tree_sweep.length).keys()]
    const chartOptions = {
        data: [
            {
                x: xVals,
                y: props.tree_sweep.map((tree) => {
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
               text: props.tree_sweep.map(
                    (r, idx) => `Score ${r.score} at depth ${idx + 1}`
                )
            }
        ],
        layout: {
            autosize: true,
            margin: { l: 20, r: 0, t: 40, b: 0 }, // Axis tick labels are drawn in the margin space
            hovermode: "closest", // Turning off hovermode seems to screw up click handling
            showlegend: false,
            xaxis: {
                automargin: true
            },
            yaxis: {
                automargin: true,
                range: [0, 100]
            },
            title : {
                text: "Score vs Tree Depth",
                font: {
                  family: "Roboto, Helvetica, Arial, sans-serif",
                  size: 18
                },
            }
        },
        config: {
            displaylogo: false,
            displayModeBar: false
        }
    };


    return (
        <React.Fragment>
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
        </React.Fragment>
    );
}

function FeatureList(props) {
    if (props.rankedFeatures == undefined) {
        return <div>Loading ...</div>;
    }

    return (
        <div className="feature-list">
            <div className="tree-sweep-scroller">
                <TreeSweepScroller 
                    setTreeIndex={props.setTreeIndex}
                    tree_sweep={props.tree_sweep}
                    treeIndex={props.treeIndex}/>
            </div>
            <List className="used-features">
                <ListItem>
                    <p className="feature-list-header">Used Features</p>
                </ListItem>
                {props.rankedFeatures.map((feature, index) => {
                    return (
                        <ListItem key={index}>
                            <span className="feature-list-item">{feature}</span>
                            <span className="importances-number">
                                {" "}
                                / {props.importances[index]}%{" "}
                            </span>
                        </ListItem>
                    );
                })}
            </List>
            <div className="right-pane">
                <ChooseLabel selectedFeatures={props.features} label={props.label} setLabel={props.setLabel}/>
                <div className="button-container">
                    <Button
                        className="run-button"
                        variant="contained"
                        color="primary"
                        onClick={_ => {
                                props.setTriggerFlag(!props.triggerFlag);
                            }
                        }
                    >
                        Run
                    </Button>
                </div>
            </div>
        </div>
    );
}

function ExplainThisTree(props) {
    //declaring svgRef so that the callback in the jsx below can reach it
    let svgRef = null;
    //wraps the entire functionality in lifecycle methods
    useEffect(_ => {
        if (!svgRef) return;
        d3.selectAll(".tree-container > *").remove();
        console.log(props.treeData)
        generateTree(props.treeData.json_tree, svgRef);
    }, [props.treeData]);

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

    const defaultLabelName = "labels";
    const [label, setLabel] = useState(defaultLabelName);
    const [treeIndex, setTreeIndex] = useState(0);
    const [triggerFlag, setTriggerFlag] = useState(true);

    //handles the request object asynchronous loading
    useEffect(_ => {
        //handle the loading of the data request promise
        // Get selected feature list from current state if none specified
        console.log("resetting tree")
        let selectedFeatures = props.featureList
            .filter(f => f.get("selected"))
            .map(f => f.get("name"))
            .toJS();

        //todo actually setup a form for selecting a feature that gets sent to
        //the user as a label
        const request = createExplainThisRequest(props.filename, label, selectedFeatures);

        const requestMade = utils.makeSimpleRequest(request);
        requestMade.req.then(data => {
            setDataState(data);
        });

        //cancels the request if the window is closed
        return function cleanup() {
            requestMade.cancel();
        };
    }, [label, triggerFlag]);

    if (!dataState) {
        return (
            <div className="chartLoading">
                <CircularProgress />
            </div>
        );
    } else if (!dataState.tree_sweep) {
        return (
            <div className="explain-this-container">
                <FeatureList 
                    features={props.featureList.map(f => f.get("name"))}
                    rankedFeatures={[]} 
                    importances={[]} 
                    label={label} 
                    setLabel={setLabel}
                    setTriggerFlag={setTriggerFlag}
                    triggerFlag={triggerFlag}
                />
                <div className="load-failure">
                    Choose a different feature as your label. 
                </div>
            </div>
        );
    } else {
        return (
            <div className="explain-this-container">
                <FeatureList 
                    features={props.featureList.map(f => f.get("name"))}
                    rankedFeatures={dataState.tree_sweep[treeIndex].feature_rank} 
                    importances={dataState.tree_sweep[treeIndex].feature_weights} 
                    label={label} 
                    setLabel={setLabel}
                    setTreeIndex={setTreeIndex}
                    tree_sweep={dataState.tree_sweep}
                    setTriggerFlag={setTriggerFlag}
                    triggerFlag={triggerFlag}
                    treeIndex={treeIndex}/>
                <ExplainThisTree 
                    treeData={dataState.tree_sweep[treeIndex]}/>
            </div>
        );
    }
}

function mapStateToProps(state) {
    return {
        featureList: state.data.get("featureList"),
        filename: state.data.get("filename")
    };
}

function mapDispatchToProps(dispatch) {
    return {};
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ExplainThis);
