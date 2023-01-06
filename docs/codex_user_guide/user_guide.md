# Using CODEX

CODEX is a web-based application to quickly visualize high-dimensional datasets. It currently accepts the following formats of input data:
- CSV where each row is a data point (approximately a time-point), and each column is a Feature (data attribute)

Currently the application does not take other data formats. It also does not currently interpret time or text data in any way. Text fields are converted to an enumeration—for example, if you have three different text values like red, orange, and blue, those will be converted to 1, 2, and 3 in the data. That way they can be plotted on a chart.

## About the Implementation

CODEX is built on top of SciKit Learn, which is the engine for much of the analysis. Other technical architecture is described in the [subcomponent breakdown](../subcomponent_breakdown.md) document.

## Installing CODEX

Installation instructions are in the main [README document](../../README.md) at the top level of the code repository. See https://github.com/NASA-AMMOS/CODEX/

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

## Quick Visual Overview
![Visual Overview](user_guide_images/codex-overview.png)

## Analyzing Data

When you select Features or Selections using the checkboxes next to them, options in the Graphs, Algorithms, and Workflows menus will activate. If your current set of selected Features and Selections is not valid for a partiuclar menu option, you can determine how to make it available by mousing over the item which will trigger a message letting you know the input requirements for a particular action.

### Graphs: Plotting Data

To plot data in a Graph, choose 1 or more Feature and then choose which Graph to draw from the dropdown menu. If your current number of selected Features is not valid for a graph you'd like to draw, there is help guidance when you mouse over an option.

![Plotting data](user_guide_images/4-plotting-data.png)

To create a selection, draw a lasso around it. This will highlight the same data points across the other graphs. You can save the selection to the Selections list by pressing the Save Selection button in the lower-left, or by pressing shift-s (S).

![Selecting data](user_guide_images/select-lasso-draw.png)

![Saving a selection](user_guide_images/select-lasso-display.png)

![Display of saved selection](user_guide_images/selection-saved.png)

### Algorithms: Analyzing Data

To run an Algorithm, choose some Features. `Correlation` uses a single Feature and input and the other Algorithms use 2+ Features as inputs. Built-in Help will help you make choices within the tools.

| Algorithm | Input Features | Outputs | Summary |
| --- | --- | --- | --- |
| Clustering | 2+  | 1+ Selections (optionally also Features) | Use various clustering algorithms to compute high-dimensional similarity of rows using multiple Features; can visualize clusters in a scatter plot using princple component analysis (PCA) [https://scikit-learn.org/stable/modules/clustering.html] | 
| Dimensionality Reduction	| 2+		| One Feature	| Use Principle Component Analysis or Independent Component Analysis to reduce 2+ Features into 1 Feature that retains properties of the higher-dimensional information. The single Feature can then be plotted etc. [https://scikit-learn.org/stable/modules/unsupervised_reduction.html] |
| Normalization	| 1+		| One Feature per input Feature normalized or standardized	| Processes Feature data to prepare it for downstream algorithms. Normalization will rescale values within -1 to 1. Standardization will rescale values to have zero mean. [https://scikit-learn.org/stable/modules/preprocessing.html] |
| Peak Detection	| 1		| One Selection per peak-detection algorithm	| Find peaks and troughs in data based on various methods. [https://docs.scipy.org/doc/scipy/reference/generated/scipy.signal.find_peaks.html] |
| Regression	| 3+ (one used as target)		| Four visualizations	| One Feature is used as a target and the other Features are used by each method (Decision Tree, Random Forest, K Neighbors, or Linear) to estimate the target value. Target vs estimate is visualized along with some statistics. [https://scikit-learn.org/stable/modules/tree.html#regression] |
| Template Scan	| 2+		| One Selection	| Highlight Positive and Negative patterns on 1+ Feature and find that pattern in a holdout Feature. Save the matched locations in the holdout Feature as a Selection. [https://towardsdatascience.com/dynamic-time-warping-3933f25fcdd] |
| Correlation	| 2+		| Feature Group	| Select Features by clicking the y-axis labels and then press Add Selected to Group to create a Feature Group with those Features (or add them to an existing group). [https://en.wikipedia.org/wiki/Correlation_coefficient] |

Below is an example of how to trigger the `Clustering` Algorithm.

![Clustering](user_guide_images/5-algorithms-clustering.png)

### Workflows: Higher-level Analysis

To run a Workflow, choose some Selections. `Explain This` uses at least two Selections plus some Features. The Table tool does not require any Features or Selections to be chosen ahead of time.

#### Explain This
Explain This is a Workflow intended to help understand the difference between two groups of data-points (two Selections). To use it, choose two Selections and some Features, chose Workflows > Explain This, then press Run in the bottom-left of the Explain This window. The Features in the left panel and the two Selections in the dropdowns (just above Run) are used for the analysis. You can choose a different set of Features in the left panel and press Run again to analyze with a different set of Features.

The analysis uses each Selection and the input Features to train a decision-tree classifier to distinguish between data-points in your first Selection vs. the second Selection.

The output of the analysis includes:
1. A decision tree indicating how your chosen Features can be used to differentiate between the two Selections (groups of data points).
2. A plot showing Score vs Tree Depth which indicates how complex a decision tree is needed to explain the differences between your two Selections. You can drag the slider under the plot to change how complex a tree is drawn.
3. A bar chart showing relative Feature Importance to the effectiveness of the classifier.
4. If you press the Summary button, you will see pseudocode describing the decision-tree.

Below is an example of how to use the `Explain This` Workflow.

![Explain This](user_guide_images/6-explain-this.png)