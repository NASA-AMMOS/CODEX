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

function generateTree(treeData, svgRef){

    //setup margins and size for the d3 window
    let margin = {top: 20, right: 120, bottom: 20, left: 180},
        width = svgRef.clietWidth - margin.right - margin.left,
        height = svgRef.clientHeight - margin.top - margin.bottom;

    let i = 0,
        duration = 750,
        root;

    //initialize d3 tree object
    let tree = d3.layout.tree()
        .size([height, width]);

    //setup diagonal projection
    let diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    let svg = d3.select(svgRef)
      .append("g")
       .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    //function to initialize tree from json
    function initializeTree(treeData) {
        root = treeData;
        root.x0 = height / 2;
        root.y0 = 0;

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
        nodes.forEach(function(d) { d.y = d.depth * 180; });

        // Update the nodes…
        let node = svg.selectAll("g.node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
          .on("click", click);

        nodeEnter.append("circle")
          .attr("r", 1e-6)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

        //todo fix this value shortening
        nodeEnter.append("text")
          .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
          .attr("dy", ".35em")
          .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
          .text(function(d) { return d.name.substring(0,d.name.length - 10); })
          .style("fill-opacity", 1e-6);

        // Transition nodes to their new position.
        let nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

        nodeUpdate.select("circle")
          .attr("r", 4.5)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });

        nodeUpdate.select("text")
          .style("fill-opacity", 1);

        // Transition exiting nodes to the parent's new position.
        let nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
          .remove();

        nodeExit.select("circle")
          .attr("r", 1e-6);

        nodeExit.select("text")
          .style("fill-opacity", 1e-6);

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

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
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
