
'''
Author: Jack Lightholder
Date  : 5/17/19

Brief : CODEX workflows.  

Notes :

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import time
import h5py
import traceback
import numpy as np
from sklearn.neighbors import kneighbors_graph
from sklearn import cluster
from sklearn.model_selection import train_test_split


# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

# CODEX Support
import codex_return_code
import codex_math
import codex_time_log
import codex_doctest
import codex_hash
import codex_system
import codex_labels
from sklearn.tree import DecisionTreeClassifier

def get_proportion_tree_sums(clf, X_test, y_test):
    """
    This function returns a json tree representing the proportion of
    a given class flowing through a certain branch in the decision tree.
    This data is used to visualize color and thickness on the frontend.
    """

    node_indicator = clf.decision_path(X_test)
    #an array with the numer of times a sample passed through each node
    sum_array = node_indicator.toarray().sum(axis=0)
    indices = np.arange(len(node_indicator.toarray()))

    class_1_indices = indices[y_test[indices]==0]
    class_2_indices = indices[y_test[indices]==1]

    class_1_sum = node_indicator.toarray()[class_1_indices].sum(axis=0)
    class_2_sum = node_indicator.toarray()[class_2_indices].sum(axis=0)

    combined_sums = np.array(list(zip(class_1_sum, class_2_sum)))

    return combined_sums

def export_json_tree(clf, features, labels, proportion_tree_sums, node_index=0):
    """Structure of rules in a fit decision tree classifier

    Parameters
    ----------
    clf : DecisionTreeClassifier
        A tree that has already been fit.

    features, labels : lists of str
        The names of the features and labels, respectively.


    Note: From here: https://planspace.org/20151129-see_sklearn_trees_with_d3/
    """
    node = {}
    if clf.tree_.children_left[node_index] == -1:  # indicates leaf
        count_labels = zip(clf.tree_.value[node_index, 0], labels)
        node['name'] = ', '.join(('{} of {}'.format(int(count), label)
                                  for count, label in count_labels))
        node['samples'] = proportion_tree_sums[node_index,0].item() + proportion_tree_sums[node_index,1].item()
        node['proportions'] = {
            "class_0":proportion_tree_sums[node_index,0].item(),
            "class_1":proportion_tree_sums[node_index,1].item()
        } 
        node['leaf'] = True;
        node['hidden'] = True;
    else:
        feature = features[clf.tree_.feature[node_index]]
        threshold = clf.tree_.threshold[node_index]
        node['name'] = '{} > {}'.format(feature, threshold)
        left_index = clf.tree_.children_left[node_index]
        right_index = clf.tree_.children_right[node_index]
        node['samples'] = proportion_tree_sums[node_index,0].item() + proportion_tree_sums[node_index,1].item()
        node['proportions'] = {
            "class_0":proportion_tree_sums[node_index,0].item(),
            "class_1":proportion_tree_sums[node_index,1].item()
        } 
        node['leaf'] = False;
        node['hidden'] = False;
        node['children'] = [export_json_tree(clf, features, labels, proportion_tree_sums, left_index), 
                            export_json_tree(clf, features, labels, proportion_tree_sums, right_index)]
    """
    node['children'] = []
    if clf.tree_.children_left[left_index] != -1:
        node['children'].append(export_json_tree(clf, features, labels, proportion_tree_sums, left_index))
    if clf.tree_.children_left[right_index] != -1:
        node['children'].append(export_json_tree(clf, features, labels, proportion_tree_sums, right_index))
    """
    return node

def explain_this(inputHash, featureNames, subsetHashName, labelHash, result):
    '''
    Inputs:

    Outputs:

    Notes: Only works for binary classification.  0 class should be main data, 1 class should be isolated data to explain.

    Examples:

    >>> testData = codex_doctest.doctest_get_data()

    >>> result = explain_this(testData['inputHash'], testData['featureNames'], None, testData['classLabelHash'], {})

    '''
    
    startTime = time.time()
    result = {"WARNING":None}

    # TODO - labels are currently cached under features
    labelHash_dict = codex_hash.findHashArray("hash", labelHash, "feature")
    if labelHash_dict is None:
        codex_system.codex_log("label hash {hash} not found. Returning!".format(hash=labelHash))
        return {'algorithm': algorithm,
                'downsample': downsampled,
                'cross_val': cross_val,
                'scoring': scoring,
                'WARNING': "Label not found in database."}
    else:
        y = labelHash_dict['data']
        result['y'] = y.tolist()

    if(len(np.unique(y)) != 2):
        result['WARNING'] = "Too many classes.  explain_features currently only works for binary classification"
        return result

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("ERROR: explain_this: Hash not found. Returning.")
        return None

    data = returnHash['data']
    if data is None:
        return None

    if subsetHashName is not None:
        subsetHash = codex_hash.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False


    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: explain_this - subsetHash returned None.")
            return None


    if data.ndim < 2:
        codex_system.codex_log("ERROR: explain_this - insufficient data dimmensions")
        return None

    X_train, X_test, y_train, y_test = train_test_split(data, y, random_state=0)
    X_train = codex_math.codex_impute(X_train)
    result['data'] = X_train.tolist()
    result['tree_sweep'] = []

    max_depth = 6

    samples_, features_ = X_train.shape
    if(features_ < 6):
    	trees_ = features_
    else:
    	trees_ = 6
    for i in range(1, trees_):

        dictionary = {}
        clf = DecisionTreeClassifier(max_features=i, max_depth = max_depth)
        clf.fit(X_train,y_train)

        proportion_tree_sums = get_proportion_tree_sums(clf, X_test, y_test)

        dictionary['json_tree'] = export_json_tree(clf, featureNames, ["Main Data","Isolated Data"], proportion_tree_sums)
        dictionary["score"] = np.round(clf.score(X_train,y_train) * 100)
        dictionary["max_features"] = clf.max_features_

        feature_weights, feature_rank = zip(*sorted(zip(clf.feature_importances_, featureNames), reverse=True))
        feature_weights = np.asarray(feature_weights).astype(float)
        dictionary["feature_rank"] = feature_rank
        dictionary["feature_weights"] = (np.round(feature_weights * 100)).tolist()
        
        result["tree_sweep"].append(dictionary)

    return result



if __name__ == "__main__":

    codex_doctest.run_codex_doctest()



