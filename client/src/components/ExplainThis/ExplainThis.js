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


let jsonData = {"error": 42716.2954, "samples": 506, "value": [22.532806324110698], "label": "RM <= 6.94", "type": "split", "children": [{"error": 17317.3210, "samples": 430, "value": [19.93372093023257], "label": "LSTAT <= 14.40", "type": "split", "children": [{"error": 6632.2175, "samples": 255, "value": [23.349803921568636], "label": "DIS <= 1.38", "type": "split", "children": [{"error": 390.7280, "samples": 5, "value": [45.58], "label": "CRIM <= 10.59", "type": "split", "children": [{"error": 0.0000, "samples": 4, "value": [50.0], "label": "Leaf - 4", "type": "leaf"}, {"error": 0.0000, "samples": 1, "value": [27.9], "label": "Leaf - 5", "type": "leaf"}]}, {"error": 3721.1632, "samples": 250, "value": [22.90520000000001], "label": "RM <= 6.54", "type": "split", "children": [{"error": 1636.0675, "samples": 195, "value": [21.629743589743576], "label": "LSTAT <= 7.57", "type": "split", "children": [{"error": 129.6307, "samples": 43, "value": [23.969767441860473], "label": "TAX <= 222.50", "type": "split", "children": [{"error": 0.0000, "samples": 1, "value": [28.7], "label": "Leaf - 9", "type": "leaf"}, {"error": 106.7229, "samples": 42, "value": [23.85714285714286], "label": "Leaf - 10", "type": "leaf"}]}, {"error": 1204.3720, "samples": 152, "value": [20.967763157894723], "label": "TAX <= 208.00", "type": "split", "children": [{"error": 161.6000, "samples": 5, "value": [26.9], "label": "Leaf - 12", "type": "leaf"}, {"error": 860.8299, "samples": 147, "value": [20.765986394557814], "label": "Leaf - 13", "type": "leaf"}]}]}, {"error": 643.1691, "samples": 55, "value": [27.427272727272726], "label": "TAX <= 269.00", "type": "split", "children": [{"error": 91.4612, "samples": 17, "value": [30.24117647058823], "label": "PTRATIO <= 17.85", "type": "split", "children": [{"error": 26.9890, "samples": 10, "value": [31.71], "label": "Leaf - 16", "type": "leaf"}, {"error": 12.0771, "samples": 7, "value": [28.142857142857142], "label": "Leaf - 17", "type": "leaf"}]}, {"error": 356.8821, "samples": 38, "value": [26.16842105263158], "label": "NOX <= 0.53", "type": "split", "children": [{"error": 232.6986, "samples": 29, "value": [27.006896551724143], "label": "Leaf - 19", "type": "leaf"}, {"error": 38.1000, "samples": 9, "value": [23.466666666666665], "label": "Leaf - 20", "type": "leaf"}]}]}]}]}, {"error": 3373.2512, "samples": 175, "value": [14.955999999999996], "label": "NOX <= 0.61", "type": "split", "children": [{"error": 833.2624, "samples": 68, "value": [18.123529411764697], "label": "CRIM <= 0.55", "type": "split", "children": [{"error": 272.4123, "samples": 39, "value": [19.738461538461536], "label": "AGE <= 60.55", "type": "split", "children": [{"error": 22.5743, "samples": 7, "value": [22.071428571428573], "label": "NOX <= 0.46", "type": "split", "children": [{"error": 0.9800, "samples": 2, "value": [19.6], "label": "Leaf - 25", "type": "leaf"}, {"error": 4.4920, "samples": 5, "value": [23.060000000000002], "label": "Leaf - 26", "type": "leaf"}]}, {"error": 203.4047, "samples": 32, "value": [19.228125], "label": "LSTAT <= 24.69", "type": "split", "children": [{"error": 150.4386, "samples": 28, "value": [19.692857142857147], "label": "Leaf - 28", "type": "leaf"}, {"error": 4.5875, "samples": 4, "value": [15.975000000000001], "label": "Leaf - 29", "type": "leaf"}]}]}, {"error": 322.3524, "samples": 29, "value": [15.951724137931038], "label": "RM <= 6.84", "type": "split", "children": [{"error": 184.2268, "samples": 28, "value": [15.539285714285716], "label": "B <= 26.72", "type": "split", "children": [{"error": 1.1250, "samples": 2, "value": [10.95], "label": "Leaf - 32", "type": "leaf"}, {"error": 137.7385, "samples": 26, "value": [15.892307692307696], "label": "Leaf - 33", "type": "leaf"}]}, {"error": 0.0000, "samples": 1, "value": [27.5], "label": "Leaf - 34", "type": "leaf"}]}]}, {"error": 1424.1422, "samples": 107, "value": [12.942990654205609], "label": "LSTAT <= 19.65", "type": "split", "children": [{"error": 316.3804, "samples": 51, "value": [15.480392156862749], "label": "CRIM <= 12.22", "type": "split", "children": [{"error": 232.6349, "samples": 47, "value": [15.842553191489367], "label": "CRIM <= 5.77", "type": "split", "children": [{"error": 132.1443, "samples": 28, "value": [16.535714285714285], "label": "Leaf - 38", "type": "leaf"}, {"error": 67.2116, "samples": 19, "value": [14.821052631578949], "label": "Leaf - 39", "type": "leaf"}]}, {"error": 5.1475, "samples": 4, "value": [11.225], "label": "CRIM <= 14.17", "type": "split", "children": [{"error": 0.5000, "samples": 2, "value": [12.2], "label": "Leaf - 41", "type": "leaf"}, {"error": 0.8450, "samples": 2, "value": [10.25], "label": "Leaf - 42", "type": "leaf"}]}]}, {"error": 480.3621, "samples": 56, "value": [10.632142857142854], "label": "TAX <= 551.50", "type": "split", "children": [{"error": 23.5290, "samples": 10, "value": [14.41], "label": "DIS <= 1.38", "type": "split", "children": [{"error": 1.2800, "samples": 2, "value": [12.600000000000001], "label": "Leaf - 45", "type": "leaf"}, {"error": 14.0588, "samples": 8, "value": [14.8625], "label": "Leaf - 46", "type": "leaf"}]}, {"error": 283.0846, "samples": 46, "value": [9.81086956521739], "label": "DIS <= 1.41", "type": "split", "children": [{"error": 11.0971, "samples": 7, "value": [12.857142857142858], "label": "Leaf - 48", "type": "leaf"}, {"error": 195.3697, "samples": 39, "value": [9.264102564102567], "label": "Leaf - 49", "type": "leaf"}]}]}]}]}]}, {"error": 6059.4193, "samples": 76, "value": [37.23815789473684], "label": "RM <= 7.44", "type": "split", "children": [{"error": 1899.6122, "samples": 46, "value": [32.11304347826087], "label": "CRIM <= 7.39", "type": "split", "children": [{"error": 864.7674, "samples": 43, "value": [33.348837209302324], "label": "DIS <= 1.89", "type": "split", "children": [{"error": 37.8450, "samples": 2, "value": [45.65], "label": "INDUS <= 18.84", "type": "split", "children": [{"error": 0.0000, "samples": 1, "value": [50.0], "label": "Leaf - 54", "type": "leaf"}, {"error": 0.0000, "samples": 1, "value": [41.3], "label": "Leaf - 55", "type": "leaf"}]}, {"error": 509.5224, "samples": 41, "value": [32.74878048780488], "label": "NOX <= 0.49", "type": "split", "children": [{"error": 135.3867, "samples": 27, "value": [34.15555555555556], "label": "AGE <= 11.95", "type": "split", "children": [{"error": 0.1800, "samples": 2, "value": [29.3], "label": "Leaf - 58", "type": "leaf"}, {"error": 84.2816, "samples": 25, "value": [34.544000000000004], "label": "Leaf - 59", "type": "leaf"}]}, {"error": 217.6521, "samples": 14, "value": [30.03571428571428], "label": "RM <= 7.12", "type": "split", "children": [{"error": 49.6286, "samples": 7, "value": [26.914285714285715], "label": "Leaf - 61", "type": "leaf"}, {"error": 31.6171, "samples": 7, "value": [33.15714285714286], "label": "Leaf - 62", "type": "leaf"}]}]}]}, {"error": 27.9200, "samples": 3, "value": [14.4], "label": "RM <= 7.14", "type": "split", "children": [{"error": 0.0000, "samples": 1, "value": [10.4], "label": "Leaf - 64", "type": "leaf"}, {"error": 3.9200, "samples": 2, "value": [16.4], "label": "CRIM <= 13.93", "type": "split", "children": [{"error": 0.0000, "samples": 1, "value": [17.8], "label": "Leaf - 66", "type": "leaf"}, {"error": 0.0000, "samples": 1, "value": [15.0], "label": "Leaf - 67", "type": "leaf"}]}]}]}, {"error": 1098.8497, "samples": 30, "value": [45.09666666666668], "label": "B <= 361.92", "type": "split", "children": [{"error": 0.0000, "samples": 1, "value": [21.9], "label": "Leaf - 69", "type": "leaf"}, {"error": 542.2097, "samples": 29, "value": [45.896551724137936], "label": "PTRATIO <= 14.80", "type": "split", "children": [{"error": 112.3800, "samples": 14, "value": [48.300000000000004], "label": "RM <= 7.71", "type": "split", "children": [{"error": 37.8475, "samples": 4, "value": [44.725], "label": "CRIM <= 1.00", "type": "split", "children": [{"error": 0.7467, "samples": 3, "value": [42.96666666666667], "label": "Leaf - 73", "type": "leaf"}, {"error": 0.0000, "samples": 1, "value": [50.0], "label": "Leaf - 74", "type": "leaf"}]}, {"error": 2.9610, "samples": 10, "value": [49.730000000000004], "label": "LSTAT <= 3.75", "type": "split", "children": [{"error": 0.0000, "samples": 6, "value": [50.0], "label": "Leaf - 76", "type": "leaf"}, {"error": 1.8675, "samples": 4, "value": [49.325], "label": "Leaf - 77", "type": "leaf"}]}]}, {"error": 273.4773, "samples": 15, "value": [43.653333333333336], "label": "B <= 385.48", "type": "split", "children": [{"error": 16.4920, "samples": 5, "value": [47.160000000000004], "label": "CRIM <= 0.32", "type": "split", "children": [{"error": 1.8467, "samples": 3, "value": [45.833333333333336], "label": "Leaf - 80", "type": "leaf"}, {"error": 1.4450, "samples": 2, "value": [49.15], "label": "Leaf - 81", "type": "leaf"}]}, {"error": 164.7600, "samples": 10, "value": [41.9], "label": "CRIM <= 0.06", "type": "split", "children": [{"error": 19.7067, "samples": 3, "value": [46.46666666666667], "label": "Leaf - 83", "type": "leaf"}, {"error": 55.6771, "samples": 7, "value": [39.94285714285714], "label": "Leaf - 84", "type": "leaf"}]}]}]}]}]}]};

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
    return d.label;
  }
}

/**
 * Mixes colors according to the relative frequency of classes.
 */
function mix_colors(d) {

  var color_map = d3.scale.category10();
  var value = d.target.value;
  var sum = d3.sum(value);
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
    var n_labels = root.value.length;

    if (n_labels >= 2) {
      stroke_callback = mix_colors;
    } else if (n_labels === 1) {
      stroke_callback = mean_interpolation(root);
    }

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

  load_dataset(jsonData);
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

  /*
    //setup margins and size for the d3 window
    let margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = svgRef.clientWidth - margin.right - margin.left,
        height = svgRef.clientHeight - margin.top - margin.bottom;

    let i = 0,
        duration = 750,
        root;

    //initialize d3 tree object
    let tree = d3.layout.tree()
        .size([height, width]);

    //setup diagonal projection
    let diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.x, d.y]; });

    let svg = d3.select(svgRef)
      .append("g")
       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //function to initialize tree from json
    function initializeTree(treeData) {
        root = treeData;
        root.x0 = width/2;
        root.y0 = 100;

        function collapse(d) {
            if (d.children) {
              d._children = d.children;
              d._children.forEach(collapse);
              d.children = null;
            }
        }

        root.children.forEach(collapse);
        update(root);
    }

    //initialize the tree from the json
    initializeTree(treeData);

    function update(source) {
        // Compute the new tree layout.
        let nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);

        // Normalize for fixed-depth.
        nodes.forEach(function(d) { d.y = d.depth * 80 });

        // Update the nodes…
        let node = svg.selectAll("g.node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + source.x0 + "," + source.y0 + ")"; })
          .on("click", click);

        nodeEnter.append("circle")
          .attr("r", 10)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

        //todo fix this value shortening
        let text = nodeEnter.append("text")
          .attr("y", function(d) { return d.children || d._children ? 0 : 0; })
          .attr("dy", ".55em")
          .attr("text-anchor", "middle")//function(d) { return d.children || d._children ? "end" : "start"; })
          .text(function(d) { return d.name.substring(0,d.name.length - 10); })
          .call(getBB)

        function getBB(selection) {
          selection.each(function(d){d.bbox = this.getBBox();});
        }

        //background for the text
        nodeEnter.insert("rect","text")
          .attr("width", function(d){return d.bbox.width})
          .attr("height", function(d){return d.bbox.height})
          .attr("x",function(d){return -d.bbox.width/2})
          .attr("y", -6)
          .style("fill", "lightsteelblue");

        // Transition nodes to their new position.
        let nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });

        //draws the blue circles at the ends of branches
        nodeUpdate.select("circle")
          .attr("r", 8)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

        nodeUpdate.select("text")
          .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        let nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + source.x + "," + source.y + ")"; })
          .remove();

        nodeExit.select("circle")
          .attr("r", 1);

        nodeExit.select("text")
          .style("fill-opacity", 1);

        // Update the links…
        let link = svg.selectAll("path.link")
          .data(links, function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("path", "g")
          .attr("class", "link")
          .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
          });

        // Transition links to their new position.
        link.transition()
          .duration(duration)
          .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          })
          .remove();
    }

    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }

    */

