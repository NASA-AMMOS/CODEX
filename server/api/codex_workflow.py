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
np.set_printoptions(threshold=sys.maxsize)
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
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import RandomizedSearchCV

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

def explain_this(inputHash, featureNames, dataSelections, result):
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

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("ERROR: explain_this: Hash not found. Returning.")
        return None

    data = returnHash['data']
    if data is None:
        return None

    if data.ndim < 2:
        codex_system.codex_log("ERROR: explain_this - insufficient data dimmensions")
        return None

    X,y = create_data_from_indices(dataSelections, data)
    
    result['tree_sweep'] = []

    samples_, features_ = X.shape
    
    max_depth = 6
    for i in range(2, max_depth):

        dictionary = {}
        clf = DecisionTreeClassifier(max_features=features_, max_depth = i)
        clf.fit(X,y)

        proportion_tree_sums = get_proportion_tree_sums(clf, X, y)

        feature_weights, feature_rank = zip(*sorted(zip(clf.feature_importances_, featureNames), reverse=True))

        dictionary['json_tree'] = export_json_tree(clf, featureNames[::-1], ["Main Data","Isolated Data"], proportion_tree_sums)
        dictionary["score"] = np.round(clf.score(X,y) * 100)
        dictionary["max_features"] = clf.max_features_
        
        feature_weights = np.asarray(feature_weights).astype(float)
        dictionary["feature_rank"] = feature_rank
        dictionary["feature_weights"] = (np.round(feature_weights * 100)).tolist()
        
        result["tree_sweep"].append(dictionary)

    return result

"""
    Function that takes the dataSelections and the actual feature data 
    and turns the selection data into a mask form and packages it with
    the feature data for training
"""
def create_data_from_indices(data_selections, data):

    #this is a single dimensional array that contains
    #numbers corrresponding to the data's class
    num_selections = 0
    for arr in data_selections:
        num_selections+=len(arr)

    label_mask = np.empty(num_selections)
    trimmed_data = np.empty((num_selections, np.shape(data)[1]))

    index = 0

    for selection_array_index,class_selection in enumerate(data_selections):
        for data_index in class_selection:
            label_mask[index] = selection_array_index #this is the label
            trimmed_data[index] = data[data_index]
            index+=1

    #return the mask for the data nexto the data
    return trimmed_data, label_mask

"""
    Convers a label mask [1,2,1,1,3] for data to an array
    of class indices arrays [[0,1,2,3,4], [5,6,7,9,11], [8,10,12,13,14]]
"""
def convert_labels_to_class_indices(label_mask, num_classes):
    indices = []
    for i in range(num_classes):
        indices.append([])

    for i, class_value in enumerate(label_mask):
        indices[int(np.round(class_value))].append(i)

    return indices

"""
    This function takes in the data for the fmlt model and then
    trains a random forest on it. 
    It perfomrms k fold cross validation and hyper parameter tuning 
    on the data as well to minimize overfitting. 
"""
def train_fmlt_model(data):
    #data is of the format (data,labels)
    #construct the grid search parameter grid
    # Number of trees in random forest
    n_estimators = [int(x) for x in np.linspace(start = 5, stop = 50, num = 10)]
    # Number of features to consider at every split
    max_features = ['auto', 'sqrt']
    # Maximum number of levels in tree
    max_depth = [int(x) for x in np.linspace(2, 20, num = 10)]
    max_depth.append(None)
    # Minimum number of samples required to split a node
    min_samples_split = [2, 5, 10]
    # Minimum number of samples required at each leaf node
    min_samples_leaf = [1, 2, 4]
    # Method of selecting samples for training each tree
    bootstrap = [True, False]
    # Create the random grid
    random_grid = {'n_estimators': n_estimators,
                   'max_features': max_features,
                   'max_depth': max_depth,
                   'min_samples_split': min_samples_split,
                   'min_samples_leaf': min_samples_leaf,
                   'bootstrap': bootstrap}

    rf = RandomForestClassifier()

    rf_random = RandomizedSearchCV(estimator = rf,
                                param_distributions = random_grid,
                                n_iter = 100, cv = 3,
                                verbose=2,
                                random_state=42,
                                n_jobs = -1)

    train_data, train_labels = data

    rf_random.fit(train_data, train_labels)

    return rf_random

"""
    This function handles getting the data for, trianing, and evaluating
    the find more like this model

    dataSelections is assumed to be an all encompassing set from the front end
    where every data value has a class label. if this is not done explicitly by the user it 
    should be done automatically somewhere along the line
"""
def find_more_like_this(inputHash, featureList, dataSelections, result):
    startTime = time.time()
    result = {"WARNING":None}

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("ERROR: find_more_like_this: Hash not found. Returning.")
        return None

    data = returnHash['data']
    if data is None:
        return None

    #data selections is a dictionary with keys corresponding to class names
    #and values corresponding to indices
    dataSelectionsValues = list(dataSelections.values())
    #first create a mask from the dataSelections indices
    formatted_data = create_data_from_indices(dataSelectionsValues, data)
    #run the trian model script
    clf = train_fmlt_model(formatted_data)
    
    #evaluate the trained model on the whole dataset
    output_predictions_mask = clf.predict(data)

    #convert mask to selection form so the front
    output_selection_array = convert_labels_to_class_indices(output_predictions_mask, np.shape(dataSelectionsValues)[0])
    
    class_names = list(dataSelections.keys())    

    #convert the output to a dictionary
    output_dictionary = {}
    for i,arr in enumerate(output_selection_array):
        codex_system.codex_log(str(i))
        output_dictionary[class_names[i]] = arr
    #end can create a selection corresponding to it

    result["like_this"] = output_dictionary

    return result


if __name__ == "__main__":

    codex_doctest.run_codex_doctest()
