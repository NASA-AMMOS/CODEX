
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

def export_json_tree(clf, features, labels, node_index=0):
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
    else:
        feature = features[clf.tree_.feature[node_index]]
        threshold = clf.tree_.threshold[node_index]
        node['name'] = '{} > {}'.format(feature, threshold)
        left_index = clf.tree_.children_left[node_index]
        right_index = clf.tree_.children_right[node_index]
        node['children'] = [export_json_tree(clf, features, labels, right_index),
                            export_json_tree(clf, features, labels, left_index)]
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

    X = data
    X = codex_math.codex_impute(X)
    result['data'] = X.tolist()
    result['tree_sweep'] = []

    samples_, features_ = X.shape
    for i in range(1, features_ + 1):

        dictionary = {}
        clf = DecisionTreeClassifier(max_features=i)
        clf.fit(X,y)

        dictionary['json_tree'] = export_json_tree(clf, featureNames, ["Main Data","Isolated Data"])
        dictionary["score"] = np.round(clf.score(X,y) * 100)
        dictionary["max_features"] = clf.max_features_

        feature_weights, feature_rank = zip(*sorted(zip(clf.feature_importances_, featureNames), reverse=True))
        feature_weights = np.asarray(feature_weights).astype(float)
        dictionary["feature_rank"] = feature_rank
        dictionary["feature_weights"] = (np.round(feature_weights * 100)).tolist()

        result["tree_sweep"].append(dictionary)

    return result



if __name__ == "__main__":

    codex_doctest.run_codex_doctest()



