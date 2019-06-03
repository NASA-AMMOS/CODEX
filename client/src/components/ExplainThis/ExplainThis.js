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

/**
 * Mixes colors according to the relative frequency of classes.
 */
function mix_colors(d) {

  var values = Object.values(d.target.proportions);
  var sum = d.target.proportions.class_0 + d.target.proportions.class_1;

  var color_map = d3.scale.linear()
    .domain([0, 1])
    .range(["blue", "red"]);

  var col = d3.rgb(color_map(values[0]/sum));
  console.log(col);

  return col;
} 

function generateTree(treeData, svgRef){
  //setup margins and size for the d3 window
  let margin = {top: 10, right: 20, bottom: 10, left: 60},
      i = 0,
      width = svgRef.clientWidth - margin.right - margin.left,
      height = svgRef.clientHeight - margin.top - margin.bottom,
      rect_width = 80,
      rect_height = 20,
      max_link_width = 20,
      min_link_width = 1.5,
      root;

  //might change this later to be dynamic based on the number of leaf nodes
  let maxDepth = 6;

  let nodeSize = [
    height/Math.pow(2, maxDepth),
    width/Math.pow(2, maxDepth)
  ];

  let tree = d3.layout.tree()
              .nodeSize(nodeSize);

  var diagonal = d3.svg.diagonal()
      .projection(function(d) { return [d.y, d.x]; });

  var vis = d3.select(svgRef)
    .append("svg:g")
      .attr("transform", "translate(" + margin.left + "," + (margin.top + height/2) + ")");

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

    // Initialize the display to show a few nodes.
    //root.children.forEach(toggleAll);

    update(root);
  }

  function update(source) {
    var duration = d3.event && d3.event.altKey ? 5000 : 500;

    // Compute the new tree layout.
    var nodes = tree.nodes(root).reverse();

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
    var node = vis.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Enter any new nodes at the parent's previous position.
    var nodeEnter = node.enter().append("svg:g")
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
        .style("opacity", function(d) {return d.hidden ? 0 : 1})
        .call(getBB);

    let rectPadding = 10;

    nodeEnter.insert("rect","text")
        .attr("width", function(d){return d.bbox.width + rectPadding})
        .attr("height", function(d){return d.bbox.height})
        .attr("x",function(d){return -d.bbox.width/2 - rectPadding/2})
        .attr("y", function(d){return -d.bbox.height/2})
        .attr("rx", function(d) { return d.type === "split" ? 2 : 0;})
        .attr("ry", function(d) { return d.type === "split" ? 2 : 0;})
        .style("margin", 20)
        .style("stroke", function(d) { return d.type === "split" ? "steelblue" : "olivedrab";})
        .style("fill", function(d) { return !hasLeafChildren(d) && childrenHidden(d) ? "lightsteelblue" : "#fff"; })
        .style("opacity", function(d) {return d.leaf || !d.hidden ? 0 : 1});

    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    nodeUpdate.select("rect")
        .style("fill", function(d) { return !hasLeafChildren(d) && childrenHidden(d) ? "lightsteelblue" : "#fff"; })
        .style("opacity", function(d) {return d.hidden ? 0 : 1});

    nodeUpdate.select("text")
        .style("fill-opacity", function(d) {return d.hidden ? 0 : 1});

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
        .style("stroke", stroke_callback)
        .style("opacity", function(d) {return d.target.hidden ? 0 : 1});

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", diagonal)
        .style("stroke-width", function(d) {return link_stoke_scale(d.target.samples);})
        .style("stroke", stroke_callback)
        .style("fill","none")//this line is used to fix the rendering of the black background stuff
        .style("opacity", function(d) {return d.target.hidden ? 0 : 1});

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
  load_dataset(treeData);
}

function FeatureList(props) {
  return (
    <React.Fragment>
      <List className="feature-list">
        <ListItem> 
          <h6 className="feature-list-header">Feature List</h6>
        </ListItem>
        {
          props.features.map((feature) => {
            return <ListItem> {feature} </ListItem>
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

	return (
		<div className="explain-this-container">
      <FeatureList features={selectedFeatures}/>
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


