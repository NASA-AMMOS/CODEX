import React, { useRef, useState, useEffect } from "react";
import { bindActionCreators } from "redux";
import * as selectionActions from "actions/selectionActions";
import { connect } from "react-redux";
import Popover from "@material-ui/core/Popover";
import CircularProgress from "@material-ui/core/CircularProgress";
import * as utils from "utils/utils";
import ReactResizeDetector from "react-resize-detector";
import * as d3 from "d3";
import rd3 from 'react-d3-library';
import "components/ExplainThis/ExplainThis.scss";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";

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
        d.children.forEach((d) => {
            if (!d.leaf) {
                d.hidden = signal;
                toggleRecursive(d, signal);
            }
        });
    }
}

// Node labels
function node_label(d) {
    return d.name.substring(0,d.name.length - 13);
}

function hasLeafChildren(d) {
    if (d.children != undefined && d.children != null) {
        let has = true;
        d.children.forEach((child) => {
            has = has && child.leaf;
        });

        return has;
    } 
    return false;
}

function childrenHidden(d) {
    if (d.leaf)
        return true;
    let hidden = true;

    d.children.forEach((d) => {
        hidden = hidden && d.hidden;
    });

    return hidden;
}

function calculateNumLeafNodes(treeData) {
    let num = 0;
    if (hasLeafChildren(treeData))
        num++;

    let left = treeData.children != undefined ? calculateNumLeafNodes(treeData.children[0]) : 0;
    let right = treeData.children != undefined ? calculateNumLeafNodes(treeData.children[1]) : 0;

    num += left + right;

    return num;
}

function textSize(text) {
    if (!d3) return;
    let container = d3.select('body').append('svg');
    container.append('text').attr({ x: -99999, y: -99999 }).text(text);
    let size = container.node().getBBox();
    container.remove();
    return { width: size.width, height: size.height };
}

function generateTree(treeData, svgRef){
//setup margins and size for the d3 window
    let margin = {top: 10, right: 20, bottom: 10, left: 60},
        i = 0,
        width = svgRef.clientWidth - margin.right - margin.left,
        height = svgRef.clientHeight - margin.top - margin.bottom,
        rect_width = 80,
        rect_height = 20,
        max_link_width = 28,
        min_link_width = 3,
        root;

    //might change this later to be dynamic based on the number of leaf nodes
    let maxDepth = 6;
    let numLeafs = calculateNumLeafNodes(treeData);
    let nodeSize = [
        height/(Math.pow(2, maxDepth)),
        width/(maxDepth)
    ];

    let color_map = d3.scale.linear()
        .domain([0, 0.5, 1])
        .range(["blue","lightgray", "red"]);

    /**
    * Mixes colors according to the relative frequency of classes.
    */
    function mix_colors(d) {
        let values = Object.values(d.target.proportions);
        let sum = d.target.proportions.class_0 + d.target.proportions.class_1;

        let col = d3.rgb(color_map(values[0]/sum));

        return col;
    } 

    let tree = d3.layout.tree()
        .nodeSize(nodeSize);

    let diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    let vis = d3.select(svgRef)
        .append("svg:g")
            .attr("transform", "translate(" + margin.left + "," + (height/2) + ")");

    let barHeight = 20;
    let gradientContainer = d3.select(svgRef)
        .append("svg:g")
        .attr("transform", "translate(" + (width/4) + "," + 10 + ")");

    gradientContainer.append('text')
        .text("Class 0")
        .attr("x", -10 - textSize("Class 0").width)
        .attr("y", 5 + barHeight/2);

    gradientContainer.append('text')
        .text("Class 1")
        .attr("x", width/2 + 10)
        .attr("y", 5 + barHeight/2);

    let linearGradient = gradientContainer.append("defs")
        .append("linearGradient")
        .attr("id", "linear-gradient");

    linearGradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", color_map(0));

    linearGradient.append("stop")
        .attr("offset", "50%")
        .attr("stop-color", color_map(0.5));

    linearGradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", color_map(1));

    let gradientRect = gradientContainer.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width/2)
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

        link_stoke_scale = d3.scale.linear()
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
        nodes.forEach(
            function(d) {
                let firstDepth = 30;
                let yscale = 120;

                if (d.depth == 0) {
                    d.y = 0;
                } else {
                    d.y = firstDepth + yscale * (d.depth - 1); 
                }
            }
        );

        // Update the nodes…
        let node = vis.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node.enter().append("svg:g")
            .attr("class", "node")
            .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("click", function(d) {if(!d.hidden){toggle(d); update(d); }});

        function getBB(selection) {
            selection.each(function(d){d.bbox = this.getBBox();});
        }

        nodeEnter.append("svg:text")
            .attr("dy", "6px")
            .attr("text-anchor", "middle")
            .text(node_label)
            .style("fill-opacity", 1e-6)
            .style("opacity", function(d) {return d.hidden ? 0 : 1;})
            .call(getBB);

        let rectPadding = 10;

        nodeEnter.insert("rect","text")
            .attr("width", function(d){return d.bbox.width + rectPadding;})
            .attr("height", function(d){return d.bbox.height;})
            .attr("x",function(d){return -d.bbox.width/2 - rectPadding/2;})
            .attr("y", function(d){return -d.bbox.height/2;})
            .attr("rx", function(d) { return d.type === "split" ? 2 : 0;})
            .attr("ry", function(d) { return d.type === "split" ? 2 : 0;})
            .style("margin", 20)
            .style("stroke", function(d) { return d.type === "split" ? "steelblue" : "olivedrab";})
            .style("fill", function(d) { return !hasLeafChildren(d) && childrenHidden(d) ? "lightsteelblue" : "#fff";})
            .style("opacity", function(d) {return d.leaf || !d.hidden ? 0 : 1;});

        // Transition nodes to their new position.
        let nodeUpdate = node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")";});

        nodeUpdate.select("rect")
            .style("fill", function(d) { return !hasLeafChildren(d) && childrenHidden(d) ? "lightsteelblue" : "#fff";})
            .style("opacity", function(d) {return d.hidden ? 0 : 1;});

        nodeUpdate.select("text")
            .style("fill-opacity", function(d) {return d.hidden ? 0 : 1;});

        // Transition exiting nodes to the parent's new position.
        let nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")";})
            .remove();

        nodeExit.select("rect")
            .attr("width", 1e-6)
            .attr("height", 1e-6);

        nodeExit.select("text")
            .style("fill-opacity", 1e-6);

        // Update the links
        let link = vis.selectAll("path.link")
            .data(tree.links(nodes), function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                let o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            })
            .transition()
            .duration(duration)
            .attr("d", diagonal)
            .style("stroke-width", function(d) {return link_stoke_scale(d.target.samples);})
            .style("stroke", stroke_callback)
            .style("opacity", function(d) {return d.target.hidden ? 0 : 1;});

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal)
            .style("stroke-width", function(d) {return link_stoke_scale(d.target.samples);})
            .style("stroke", stroke_callback)
            .style("fill","none")//this line is used to fix the rendering of the black background stuff
            .style("opacity", function(d) {return d.target.hidden ? 0 : 1;});

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                let o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
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

function FeatureList(props) {
    if (props.features == undefined) {
        return <div>Loading ...</div>;
    }
    
    return (
        <React.Fragment>
            <List className="feature-list">
                <ListItem> 
                    <h6 className="feature-list-header">Feature List</h6>
                </ListItem>
                {
                    props.features.map((feature, index) => {
                        return <ListItem key={index}> 
                            <span className="feature-list-item">{feature}</span>
                            <span className="importances-number"> / {props.importances[index]}% </span>
                            </ListItem>;
                    })
                }
            </List>
        </React.Fragment>
    );
}

function ExplainThisTree(props) {
    if (!props.treeData){
        return (
            <div className="chartLoading">
                <CircularProgress />
            </div>
        );
    }

    //declaring svgRef so that the callback in the jsx below can reach it
    let svgRef = null;

    //wraps the entire functionality in lifecycle methods
    useEffect(_ => {
        if (!svgRef)
            return;

        generateTree(props.treeData.json_tree, svgRef);
        
    }, []);

    return (
        <svg className="tree-container" 
            ref={(element) => {svgRef = element}}
        />
    );
}

function ExplainThis(props) {
    //make a data state object to hold the data in the request
    const [dataState, setDataState] = useState(undefined);
      
    //handles the request object asynchronous loading
    useEffect(_ => {
        //handle the loading of the data request promise
        props.request.req.then(data => {
            setDataState(data);
        });

        //cancels the request if the window is closed
        return function cleanup() {
            props.request.cancel();
        };

    }, []);

    //todo make this list several trees
    //get the selected features from state
    const rankedFeatures = !dataState ? undefined : dataState.tree_sweep[0].feature_rank;

    const treeData = !dataState ? undefined : dataState.tree_sweep[0];

    const importances = !dataState ? undefined : dataState.tree_sweep[0].feature_weights;

    return (
        <div className="explain-this-container">
            <FeatureList features={rankedFeatures} importances={importances}/>
            <ExplainThisTree
                treeData={treeData}
            />
        </div>
    );
}

function mapStateToProps(state) {
    return {
        featureList: state.data.get("featureList"),
    };
}

function mapDispatchToProps(dispatch) {
    return {};
}

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(ExplainThis);


