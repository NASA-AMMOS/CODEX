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
import logging

import numpy as np
np.set_printoptions(threshold=sys.maxsize)

from sklearn.neighbors       import kneighbors_graph
from sklearn.model_selection import train_test_split
from sklearn                 import cluster
from sklearn.tree            import DecisionTreeClassifier
from sklearn.ensemble        import RandomForestClassifier
from sklearn.model_selection import RandomizedSearchCV

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_hash   import get_cache

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
        node['class'] = clf.classes_[np.argmax(clf.tree_.value[node_index])]
        node['proportions'] = {
            "class_0":proportion_tree_sums[node_index,0].item(),
            "class_1":proportion_tree_sums[node_index,1].item()
        } 
        node['leaf'] = True;
        node['hidden'] = False;
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

"""
    Rotate the json tree recursively
"""
def rotate_tree(json_tree):

    if (not json_tree["leaf"]):
        #recurse on children 
        rotate_tree(json_tree["children"][0])
        rotate_tree(json_tree["children"][1])

        temp = json_tree["children"][0]
        json_tree["children"][0] = json_tree["children"][1]
        json_tree["children"][1] = temp

    return json_tree


def explain_this(inputHash, featureNames, dataSelections, result, session=None):
    '''
    Inputs:

    Outputs:

    Notes: Only works for binary classification.  0 class should be main data, 1 class should be isolated data to explain.

    Examples:

    >>> from api.sub.codex_hash import DOCTEST_SESSION
    >>> from api.sub.codex_hash import get_cache
    >>> from api.sub.codex_doctest import doctest_get_data
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = doctest_get_data(session=codex_hash)

    
    '''
    codex_hash = get_cache(session)

    startTime = time.time()
    result = {"WARNING":None}

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        warning("ERROR: explain_this: Hash not found. Returning.")
        return None

    data = returnHash['data']
    if data is None:
        return None

    if data.ndim < 2:
        warning("ERROR: explain_this - insufficient data dimmensions")
        return None

    X,y = create_data_from_indices(dataSelections, data)

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
    
    result['tree_sweep'] = []

    samples_, features_ = X.shape
    
    max_depth = 5
    for i in range(1, max_depth):
        #train and fit the model
        parameters = {
            'criterion' :['gini', 'entropy'],
            'splitter' : ['best', 'random'],
            'min_samples_split': range(2, 10),
            'min_samples_leaf': range(1, 10),
            'max_features': range(1, features_)
        }

        clf = DecisionTreeClassifier(max_depth = i)

        random_search = RandomizedSearchCV(estimator = clf,
                                param_distributions = parameters,
                                n_iter = 100, cv = 3,
                                verbose=2,
                                random_state=42,
                                n_jobs = -1)

        
        random_search.fit(X_train,y_train)

        best_tree = random_search.best_estimator_

        #generate the interpretation of the model
        dictionary = {}

        proportion_tree_sums = get_proportion_tree_sums(best_tree, X_test, y_test)

        feature_weights, feature_rank = zip(*sorted(zip(best_tree.feature_importances_, featureNames), reverse=True))

        json_tree = export_json_tree(best_tree, featureNames[::-1], ["Main Data","Isolated Data"], proportion_tree_sums)
        #rotate the tree here
        rotated_tree = rotate_tree(json_tree)

        dictionary['json_tree'] = rotated_tree

        dictionary["score"] = np.round(best_tree.score(X_test,y_test) * 100)
        dictionary["max_features"] = best_tree.max_features_
        
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
        #if (class_value!=-1):
        indices[class_value].append(i)

    return indices

"""
    This function takes in the data for the general classifier model and then
    trains a random forest on it. 
    It perfomrms k fold cross validation and hyper parameter tuning 
    on the data as well to minimize overfitting. 
"""
def train_general_classifier_model(data):
    #data is of the format (data,labels)
    #construct the grid search parameter grid
    # Number of trees in random forest
    #parameter search
    n_estimators = np.arange(3, 30)
    # Number of features to consider at every split
    max_features = ['auto', 'sqrt']
    # Maximum number of levels in tree
    max_depth = np.arange(2, 20)
    # Minimum number of samples required to split a node
    min_samples_split = np.arange(2, 10)
    # Minimum number of samples required at each leaf node
    min_samples_leaf = np.arange(1, 10)
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
    the general_classifier model

    dataSelections is assumed to be an all encompassing set from the front end
    where every data value has a class label. if this is not done explicitly by the user it 
    should be done automatically somewhere along the line
"""
def general_classifier(inputHash, featureList, dataSelections, similarityThreshold, result):
    startTime = time.time()
    result = {"WARNING":None}

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        warning("ERROR: general_classifier: Hash not found. Returning.")
        return None

    data = returnHash['data']
    if data is None:
        return None

    #first create a mask from the dataSelections indices
    formatted_data = create_data_from_indices(dataSelections, data)

    info(str(formatted_data))
    #run the trian model script
    clf = train_general_classifier_model(formatted_data)
    
    #evaluate the trained model on the whole dataset
    output_predictions_probabilities = clf.predict_proba(data)

    info(str(output_predictions_probabilities))
    info(str(clf.predict_proba(data)))
    #convert probability array to mask
    output_predictions_mask = []
    for probs in output_predictions_probabilities:
        argmax = np.argmax(probs)
        output_predictions_mask.append(argmax)

    """for probs in output_predictions_probabilities:
        argmax = np.argmax(probs)
        if (argmax > similarityThreshold):
            output_predictions_mask.append(argmax)
        else:
            output_predictions_mask.append(-1)
    """
    #convert mask to selection form so the front
    output_selection_array = convert_labels_to_class_indices(output_predictions_mask, np.shape(dataSelections)[0])
    
    #end can create a selection corresponding to it
    #todo change this name
    result["like_this"] = output_selection_array

    return result

def find_more_like_this(inputHash, featureList, dataSelections, similarityThreshold, result, session=None):
    
    codex_hash = get_cache(session)

    startTime = time.time()
    result = {"WARNING":None}

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        warning("ERROR: general_classifier: Hash not found. Returning.")
        return None

    data = returnHash['data']
    if data is None:
        return None

    #handles the data and training for the positive-unlabeled learning bagging classifier
    #get the formatted data 
    dataSelectionsValues = list(dataSelections)
    #get a full mask of all data [0, 1, 0 ... 0, 0, 1] of length(num data)
    data_mask = np.zeros(np.shape(data)[0])
    for index in dataSelectionsValues:
        data_mask[index] = 1
    #get the data corresponding to all positive examples
    positive_data = []
    for index in dataSelectionsValues:
        positive_data.append(data[index])



    #train the classifier with the formatted data as the positive examples and 
    #a random sample from the other data with replacement as the negatives
    #this is done several times and the models are bagged
    votes = np.zeros(np.shape(data)[0])

    #parameter search
    n_estimators = np.arange(3, 15)
    # Number of features to consider at every split
    max_features = ['auto', 'sqrt']
    # Maximum number of levels in tree
    max_depth = np.arange(2, 5)
    # Minimum number of samples required to split a node
    min_samples_split = np.arange(2, 10)
    # Minimum number of samples required at each leaf node
    min_samples_leaf = np.arange(1, 10)
    # Method of selecting samples for training each tree
    bootstrap = [True, False]
    # Create the random grid
    random_grid = {'n_estimators': n_estimators,
                   'max_features': max_features,
                   'max_depth': max_depth,
                   'min_samples_split': min_samples_split,
                   'min_samples_leaf': min_samples_leaf,
                   'bootstrap': bootstrap}

    num_classifiers = 1
    for i in range(num_classifiers):
        #each iteration train a classifier on the positive data
        #and a random subsample of the other data as negative examples
        #choose the same number of negative as positive examples you have
        negative_data_indices = np.random.choice(
            [index for index in range(len(data)) if data_mask[index] == 0],
            replace = True,
            size = len(positive_data)
        )

        negative_data = [data[index] for index in negative_data_indices]

        X = positive_data + negative_data

        #create labels now
        Y = np.zeros(len(X))
        #make ones for po
        for i in range(len(positive_data)):
            Y[i] = 1

        rf = RandomForestClassifier()

        rf_random = RandomizedSearchCV(estimator = rf,
                                param_distributions = random_grid,
                                n_iter = 30, cv = 3,
                                verbose=2,
                                random_state=42,
                                n_jobs = -1)

        rf_random.fit(X, Y)

        prediction = rf_random.predict(data)

        #make predictions and add them to votes
        votes += prediction

    votes = votes / num_classifiers

    #return all points labeled with a positive being when half or more of the bagged
    #classifiers vote on a given piece of data
    like_this_indices = [index for index, value in enumerate(votes) if value > similarityThreshold]
    #also include all of the positive inputs in the like_this_indices array

    result["like_this"] = like_this_indices

    return result

if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()
