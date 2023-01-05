# Using CODEX

CODEX is a web-based application to quickly visualize high-dimensional datasets. It currently accepts the following formats of input data:
- CSV where each row is a data point (approximately a time-point), and each column is a Feature (data attribute)

Currently the application does not take other data formats. It also does not currently interpret time or text data in any way. Text fields are converted to an enumeration—for example, if you have three different text values like red, orange, and blue, those will be converted to 1, 2, and 3 in the data. That way they can be plotted on a chart.

## About the Implementation

CODEX is built on top of SciKit Learn, which is the engine for much of the analysis. Other technical architecture is described in the [subcomponent breakdown](../subcomponent_breakdown.md) document.

## Getting Started

When you first go to the CODEX web site, whether locally or on a server, you will be presented with an empty page that has an UPLOAD button in the upper-left. Press that button and choose a CSV file to upload.

![1 CODEX start](user_guide_images/1-codex-start.png)

The web application will then process the input file and put the column-headers into the Features list on the top left side.

![2 CODEX Upload](user_guide_images/2-file-uploaded.png)

## Features and Selections

Input to the various type of analysis is done via Features and Selections.

![3 Features and Selections](user_guide_images/3-features-selections.png)

Features are the attributes of the data and come from the column-headers in the original input file. Features can be organized into Features Groups by right-clicking on a Feature or by the Correlation Algorithm. This lets you select or de-select several related Features at once. Features that are in a group are "pointers" to the independent features and not copies; they can be in multiple Feature Groups

Selections are arbitrary groups of rows, and are created within the CODEX web application. There are several ways to create Selections:
- drawing around points in a plot, such as in a scatterplot
- as an output of analysis by an Algorithm, e.g. each cluster created by a Clustering Algorithm will be stored in a Selection
- by Editing existing Selections, such as combining two existing Selections or finding the overlap between two Selections

## Analyzing Data

When you select Features or Selections using the checkboxes next to them 

### Graphs: Plotting Data

### Algorithms: Analyzing Data

### Workflows: Higher-level Analysis


