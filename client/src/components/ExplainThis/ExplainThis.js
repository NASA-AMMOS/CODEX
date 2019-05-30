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

/**
 * A linear interpolator for value[0].
 *
 * Useful for link coloring in regression trees.
 */
function mean_interpolation(root) {

  var max = 1e-9,
      min = 1e9;

  function recurse(node) {
    if (node.value[0] > max) {
      max = node.value[0];
    }

    if (node.value[0] < min) {
      min = node.value[0];
    }

    if (node.children) {
      node.children.forEach(recurse);
    }
  }
  recurse(root);

  var scale = d3.scale.linear().domain([min, max])
                               .range(["#2166AC","#B2182B"]);

  function interpolator(d) {
    return scale(d.target.value[0]);
  }

  return interpolator;
}

// Toggle children.
function toggle(d) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }
}

// Node labels
function node_label(d) {
  if (d.type === "leaf") {
    // leaf
    var formatter = d3.format(".2f");
    var vals = [];
    d.value.forEach(function(v) {
        vals.push(formatter(v));
    });
    return "[" + vals.join(", ") + "]";
  } else {
    // split node
    return d.name.substring(0,d.name.length - 13);
  }
}

/**
 * Mixes colors according to the relative frequency of classes.
 */
function mix_colors(d) {

  var color_map = d3.scale.category10();
  var value = Object.values(d.target.proportions);
  var sum = d.target.proportions.class_0 + d.target.proportions.class_1;
  var col = d3.rgb(0, 0, 0);
  value.forEach(function(val, i) {
    var label_color = d3.rgb(color_map(i));
    var mix_coef = val / sum;
    col.r += mix_coef * label_color.r;
    col.g += mix_coef * label_color.g;
    col.b += mix_coef * label_color.b;
  });
  return col;
} 

function generateTree(treeData, svgRef){
  //setup margins and size for the d3 window
  let margin = {top: 20, right: 20, bottom: 20, left: 60},
      width = svgRef.clientWidth - margin.right - margin.left,
      height = svgRef.clientHeight - margin.top - margin.bottom,
      i = 0,
      rect_width = 80,
      rect_height = 20,
      max_link_width = 20,
      min_link_width = 1.5,
      char_to_pxl = 10,
      root;

  var tree = d3.layout.tree()
      .size([height, width]);

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

  var vis = d3.select(svgRef)
      .attr("width", width + margin.right + margin.left)
      .attr("height", height + margin.top + margin.bottom)
    .append("svg:g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  // global scale for link width
  var link_stoke_scale = d3.scale.linear();

  // stroke style of link - either color or function
  var stroke_callback = "#ccc";

  function load_dataset(json) {
    root = json;
    root.x0 = 0;
    root.y0 = 0;

    var n_samples = root.samples;

    stroke_callback = mix_colors;

    link_stoke_scale = d3.scale.linear()
                               .domain([0, n_samples])
                               .range([min_link_width, max_link_width]);

    function toggleAll(d) {
      if (d && d.children) {
        d.children.forEach(toggleAll);
        toggle(d);
      }
    }

    // Initialize the display to show a few nodes.
    root.children.forEach(toggleAll);

    update(root);
  }

  function update(source) {
    var duration = d3.event && d3.event.altKey ? 5000 : 500;

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse();

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 120; });

    // Update the nodes…
    var node = vis.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
        .attr("class", "node")
        .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
        .on("click", function(d) { toggle(d); update(d); });

    function getBB(selection) {
      selection.each(function(d){d.bbox = this.getBBox();});
    }

    nodeEnter.append("svg:text")
        .attr("dy", "6px")
        .attr("text-anchor", "middle")
        .text(node_label)
        .style("fill-opacity", 1e-6)
        .call(getBB);

    let rectPadding = 10;

    nodeEnter.insert("rect","text")
        .attr("width", function(d){return d.bbox.width + rectPadding})
        .attr("height", function(d){return d.bbox.height})
        .attr("x",function(d){return -d.bbox.width/2 - rectPadding/2})
        .attr("y", function(d){return -d.bbox.height/2})
        .attr("rx", function(d) { return d.type === "split" ? 2 : 0;})
        .attr("ry", function(d) { return d.type === "split" ? 2 : 0;})
        .style("stroke", function(d) { return d.type === "split" ? "steelblue" : "olivedrab";})
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("rect")
        .attr("width", function(d){ return d.bbox.width + rectPadding})
        .attr("height", function(d){return d.bbox.height})
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

    nodeUpdate.select("text")
        .style("fill-opacity", 1);

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("rect")
        .attr("width", 1e-6)
        .attr("height", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links
    var link = vis.selectAll("path.link")
        .data(tree.links(nodes), function(d) { return d.target.id; });

    // Enter any new links at the parent's previous position.
    link.enter().insert("svg:path", "g")
        .attr("class", "link")
        .attr("d", function(d) {
          var o = {x: source.x0, y: source.y0};
          return diagonal({source: o, target: o});
        })
        .transition()
        .duration(duration)
        .attr("d", diagonal)
        .style("stroke-width", function(d) {return link_stoke_scale(d.target.samples);})
        .style("stroke", stroke_callback);

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal)
        .style("stroke-width", function(d) {return link_stoke_scale(d.target.samples);})
        .style("stroke", stroke_callback)
        .style("fill","none");//this line is used to fix the rendering of the black background stuff

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
          var o = {x: source.x, y: source.y};
          return diagonal({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
      d.x0 = d.x;
      d.y0 = d.y;
    });
  }
  console.log(treeData);
  load_dataset(treeData);
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

        let treeData = props.treeData.json_tree;

        generateTree(treeData, svgRef);

    },[]);
    

    return (
        <svg ref={(element) => {svgRef = element}}
             height="100%"
             width="100%"
        >
        </svg>
    );
}

function ExplainThis(props) {
    //make a data state object to hold the data in the request
    const [dataState, setDataState] = useState(undefined);
        
    //get the selected features from state
    const selectedFeatures = props.featureList
        .filter(f => f.get("selected"))
        .map(f => f.get("name"))
        .toJS();

    //wraps the promise loading in a lifecycle handler
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

    //only pulling the tree right now
	return (
		<div className="explain-this-container">
			<ExplainThisTree
        treeData={!dataState ? undefined : dataState.tree_sweep[0]}
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
