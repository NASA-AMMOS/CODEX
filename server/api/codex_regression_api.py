'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Regression algorithms, formatted for CODEX

Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''

import os
import sys
# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

import codex_math
import codex_doctest
import codex_system
import codex_read_data_api
import codex_return_code
import codex_plot
import codex_time_log
import codex_hash
import sys
import random

import sklearn
import subprocess
import h5py
import time
import traceback
import matplotlib.pyplot as plt
import numpy as np
import numpy.polynomial.polynomial as poly
from sklearn.metrics import log_loss
from sklearn import model_selection
from sklearn.model_selection import GridSearchCV
from sklearn.model_selection import RandomizedSearchCV
from sklearn.metrics import confusion_matrix

from sklearn.linear_model import ARDRegression
from sklearn.ensemble import AdaBoostRegressor
from sklearn.ensemble import BaggingRegressor
from sklearn.linear_model import BayesianRidge
from sklearn.cross_decomposition import CCA
from sklearn.tree import DecisionTreeRegressor
from sklearn.linear_model import ElasticNet
from sklearn.linear_model import ElasticNetCV
from sklearn.tree import ExtraTreeRegressor
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.linear_model import HuberRegressor
from sklearn.neighbors import KNeighborsRegressor
from sklearn.kernel_ridge import KernelRidge
from sklearn.linear_model import Lars
from sklearn.linear_model import LarsCV
from sklearn.linear_model import Lasso
from sklearn.linear_model import LassoCV
from sklearn.linear_model import LassoLars
from sklearn.linear_model import LassoLarsCV
from sklearn.linear_model import LassoLarsIC
from sklearn.linear_model import LinearRegression
from sklearn.svm import LinearSVR
from sklearn.neural_network import MLPRegressor
from sklearn.linear_model import MultiTaskElasticNet
from sklearn.linear_model import MultiTaskElasticNetCV
from sklearn.linear_model import MultiTaskLasso
from sklearn.linear_model import MultiTaskLassoCV
from sklearn.svm import NuSVR
from sklearn.linear_model import OrthogonalMatchingPursuit
from sklearn.linear_model import OrthogonalMatchingPursuitCV
from sklearn.cross_decomposition import PLSCanonical
from sklearn.cross_decomposition import PLSRegression
from sklearn.linear_model import PassiveAggressiveRegressor
from sklearn.linear_model import RANSACRegressor
from sklearn.neighbors import RadiusNeighborsRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import Ridge
from sklearn.linear_model import RidgeCV
from sklearn.linear_model import SGDRegressor
from sklearn.svm import SVR
from sklearn.linear_model import TheilSenRegressor
from sklearn.compose import TransformedTargetRegressor


DEBUG = False


def ml_regression(
        inputHash,
        hashList,
        subsetHashName,
        labelHash,
        algorithmName,
        downsampled,
        parms,
        scoring,
        search_type,
        cross_val,
        result):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> testData = codex_doctest.doctest_get_data()

    # Standard use - linear regression
    >>> result = ml_regression(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "linear", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5, 'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, 'explained_variance', "grid", 3, {})

    # Standard use - lasso regression
    >>> result = ml_regression(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "lasso", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5,'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, 'explained_variance', "grid", 3, {})

    # Standard use - random forest regression
    >>> result = ml_regression(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "randomForest", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5,'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, 'explained_variance', "grid", 3, {})

    '''

    if(subsetHashName is not None):
        subsetHash = codex_hash.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    try:
        result =  run_codex_regression(inputHash, subsetHashName, labelHash, downsampled, algorithmName, parms, search_type, cross_val, scoring)
    except BaseException:
        codex_system.codex_log("Failed to run regression algorithm")
        result['message'] = "Failed to run regression algorithm"
        codex_system.codex_log(traceback.format_exc())
        return None

    return result

def run_codex_regression(inputHash, subsetHash, labelHash, downsampled, algorithm, parms, search_type, cross_val, scoring):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        downsampled (int)   - number of data points to use for quicklook
        algorithm (string)  - Name of the regressor to run.  Follows Sklearn naming conventions.
                                Available keys: ARDRegression | AdaBoostRegressor | BaggingRegressor | BayesianRidge | CCA
                                                DecisionTreeRegressor | ElasticNet | ElasticNetCV | ExtraTreeRegressor
                                                ExtraTreesRegressor | GaussianProcessRegressor | GradientBoostingRegressor
                                                HuberRegressor | KNeighborsRegressor | KernelRidge | Lars | LarsCV | Lasso
                                                LassoCV | LassoLars | LassoLarsCV | LassoLarsIC | LinearRegression | LinearSVR
                                                MLPRegressor | MultiTaskElasticNet | MultiTaskElasticNetCV | MultiTaskLasso
                                                MultiTaskLassoCV | NuSVR | OrthogonalMatchingPursuit | OrthogonalMatchingPursuitCV
                                                PLSCanonical | PLSRegression | PassiveAggressiveRegressor | RANSACRegressor
                                                RadiusNeighborsRegressor | RandomForestRegressor | Ridge | RidgeCV | SGDRegressor
                                                SVR | TheilSenRegressor | TransformedTargetRegressor


    Outputs:
        dictionary:
            algorithm (str)          - Name of the regressor which was run.  Will be same as algorithm input argument
            data (numpy.ndarray)     - (samples, features) array of features to cluster
            downsample (int)         - number of data points used in quicklook

    Notes:
        Scoring Metrics: https://scikit-learn.org/stable/modules/model_evaluation.html#scoring-parameter

    Examples:

    >>> testData = codex_doctest.doctest_get_data()

    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ARDRegression", {}, "grid", 3, 'fake_score')
    >>> print(result["WARNING"])
    fake_score not a valid scoring metric for regression.

    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ARDRegression", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "AdaBoostRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "BaggingRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "BayesianRidge", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "CCA", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "DecisionTreeRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ElasticNet", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ElasticNetCV", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ExtraTreeRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ExtraTreesRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "GaussianProcessRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "GradientBoostingRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "HuberRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "KNeighborsRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "KernelRidge", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "Lars", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LarsCV", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "Lasso", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LassoCV", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LassoLars", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LassoLarsCV", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LassoLarsIC", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LinearRegression", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LinearSVR", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "MLPRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "MultiTaskElasticNet", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "MultiTaskElasticNetCV", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "MultiTaskLasso", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "MultiTaskLassoCV", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "NuSVR", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "OrthogonalMatchingPursuit", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "OrthogonalMatchingPursuitCV", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "PLSCanonical", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "PLSRegression", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "PassiveAggressiveRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "RANSACRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "RadiusNeighborsRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "RandomForestRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "Ridge", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "RidgeCV", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "SGDRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "SVR", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "TheilSenRegressor", {}, "grid", 3, 'explained_variance')
    >>> result = run_codex_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "TransformedTargetRegressor", {}, "grid", 3, 'explained_variance')

    '''
    startTime = time.time()
    result = {'algorithm': algorithm,
              'downsample': downsampled,
              'cross_val': cross_val,
              'scoring': scoring,
              'WARNING': "None"}

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Regression: " + algorithm + ": Hash not found. Returning!")
        return None

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False  and subsetHash is not None:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: run_codex_regression - subsetHash returned None.")
            return None

    full_samples = len(data)
    if downsampled is not False:
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)

    if data.ndim < 2:
        codex_system.codex_log("ERROR: run_codex_regression - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)
    result['X'] = X.tolist()

    result['eta'] = codex_time_log.getComputeTimeEstimate("regression", algorithm, full_samples)

    accepted_scoring_metrics = ["explained_variance", "max_error", "neg_mean_absolute_error", "neg_mean_squared_error", "neg_mean_squared_log_error", "neg_median_absolute_error", "r2"]
    if scoring not in accepted_scoring_metrics:
        result["WARNING"] = "{scoring} not a valid scoring metric for regression.".format(scoring=scoring)
        return result

    # TODO - labels are currently cached under features
    labelHash_dict = codex_hash.findHashArray("hash", labelHash, "feature")
    if labelHash_dict is None:
        codex_system.codex_log("label hash not found. Returning!")
        return {'algorithm': algorithm,
                'downsample': downsampled,
                'cross_val': cross_val,
                'scoring': scoring,
                'WARNING': "Label not found in database."}
    else:
        y = labelHash_dict['data']
        result['y'] = y.tolist()

    try:
        if(algorithm == "ARDRegression"):

            if search_type == "random":
                regr = RandomizedSearchCV(ARDRegression(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(ARDRegression(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "AdaBoostRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(AdaBoostRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(AdaBoostRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "BaggingRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(BaggingRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(BaggingRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "BayesianRidge"):

            if search_type == "random":
                regr = RandomizedSearchCV(BayesianRidge(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(BayesianRidge(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "CCA"):

            if search_type == "random":
                regr = RandomizedSearchCV(CCA(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(CCA(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "DecisionTreeRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(DecisionTreeRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(DecisionTreeRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "ElasticNet"):

            if search_type == "random":
                regr = RandomizedSearchCV(ElasticNet(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(ElasticNet(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "ElasticNetCV"):

            if search_type == "random":
                regr = RandomizedSearchCV(ElasticNetCV(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(ElasticNetCV(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "ExtraTreeRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(ExtraTreeRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(ExtraTreeRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "ExtraTreesRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(ExtraTreesRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(ExtraTreesRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "GaussianProcessRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(GaussianProcessRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(GaussianProcessRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "GradientBoostingRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(GradientBoostingRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(GradientBoostingRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "HuberRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(HuberRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(HuberRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "KNeighborsRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(KNeighborsRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(KNeighborsRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "KernelRidge"):

            if search_type == "random":
                regr = RandomizedSearchCV(KernelRidge(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(KernelRidge(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "Lars"):

            if search_type == "random":
                regr = RandomizedSearchCV(Lars(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(Lars(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LarsCV"):

            if search_type == "random":
                regr = RandomizedSearchCV(LarsCV(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(LarsCV(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "Lasso"):

            if search_type == "random":
                regr = RandomizedSearchCV(Lasso(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(Lasso(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LassoCV"):

            if search_type == "random":
                regr = RandomizedSearchCV(LassoCV(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(LassoCV(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LassoLars"):

            if search_type == "random":
                regr = RandomizedSearchCV(LassoLars(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(LassoLars(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LassoLarsCV"):

            if search_type == "random":
                regr = RandomizedSearchCV(LassoLarsCV(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(LassoLarsCV(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LassoLarsIC"):

            if search_type == "random":
                regr = RandomizedSearchCV(LassoLarsIC(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(LassoLarsIC(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LinearRegression"):

            if search_type == "random":
                regr = RandomizedSearchCV(LinearRegression(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(LinearRegression(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LinearSVR"):

            if search_type == "random":
                regr = RandomizedSearchCV(LinearSVR(), parms, cv=cross_val, scoring=scoring)
            else:
                regr = GridSearchCV(LinearSVR(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "MLPRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(MLPRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr = GridSearchCV(MLPRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "MultiTaskElasticNet"):

            if(y.ndim < 2):
                return {'algorithm': algorithm,
                        'data': X.tolist(),
                        'labels': y.tolist(),
                        'downsample': downsampled,
                        'cross_val': cross_val,
                        'scoring': scoring,
                        'WARNING': algorithm + " requires >= 2 label vectors"}
            else:

                if search_type == "random":
                    regr = RandomizedSearchCV(MultiTaskElasticNet(), parms, cv=cross_val, scoring=scoring)
                else:
                    regr =  GridSearchCV(MultiTaskElasticNet(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "MultiTaskElasticNetCV"):

            if(y.ndim < 2):
                return {'algorithm': algorithm,
                        'data': X.tolist(),
                        'labels': y.tolist(),
                        'downsample': downsampled,
                        'cross_val': cross_val,
                        'scoring': scoring,
                        'WARNING': algorithm + " requires >= 2 label vectors"}
            else:

                if search_type == "random":
                    regr = RandomizedSearchCV(MultiTaskElasticNetCV(), parms, cv=cross_val, scoring=scoring)
                else:
                    regr =  GridSearchCV(MultiTaskElasticNetCV(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "MultiTaskLasso"):

            if(y.ndim < 2):
                return {'algorithm': algorithm,
                        'data': X.tolist(),
                        'labels': y.tolist(),
                        'downsample': downsampled,
                        'cross_val': cross_val,
                        'scoring': scoring,
                        'WARNING': algorithm + " requires >= 2 label vectors"}
            else:

                if search_type == "random":
                    regr = RandomizedSearchCV(MultiTaskLasso(), parms, cv=cross_val, scoring=scoring)
                else:
                    regr = GridSearchCV(MultiTaskLasso(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "MultiTaskLassoCV"):

            if(y.ndim < 2):
                return {'algorithm': algorithm,
                        'data': X.tolist(),
                        'labels': y.tolist(),
                        'downsample': downsampled,
                        'cross_val': cross_val,
                        'scoring': scoring,
                        'WARNING': algorithm + " requires >= 2 label vectors"}
            else:

                if search_type == "random":
                    regr = RandomizedSearchCV(MultiTaskLassoCV(), parms, cv=cross_val, scoring=scoring)
                else:
                    regr = GridSearchCV(MultiTaskLassoCV(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "NuSVR"):

            if search_type == "random":
                regr = RandomizedSearchCV(NuSVR(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(NuSVR(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "OrthogonalMatchingPursuit"):

            if search_type == "random":
                regr = RandomizedSearchCV(OrthogonalMatchingPursuit(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(OrthogonalMatchingPursuit(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "OrthogonalMatchingPursuitCV"):

            if search_type == "random":
                regr = RandomizedSearchCV(OrthogonalMatchingPursuitCV(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(OrthogonalMatchingPursuitCV(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "PLSCanonical"):

            if search_type == "random":
                regr = RandomizedSearchCV(PLSCanonical(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(PLSCanonical(), parms, cv=cross_val, scoring=scoring)


        elif(algorithm == "PLSRegression"):

            if search_type == "random":
                regr = RandomizedSearchCV(PLSRegression(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(PLSRegression(), parms, cv=cross_val, scoring=scoring)


        elif(algorithm == "PassiveAggressiveRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(PassiveAggressiveRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(PassiveAggressiveRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "RANSACRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(RANSACRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(RANSACRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "RadiusNeighborsRegressor"):

            # Handles the issues described here, until a front-end user-feedback solution is implemented
            #     https://github.com/scikit-learn/scikit-learn/issues/9629
            parms["outlier_label"] = y.min() - 1

            if search_type == "random":
                regr = RandomizedSearchCV(RadiusNeighborsRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(RadiusNeighborsRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "RandomForestRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(RandomForestRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(RandomForestRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "Ridge"):

            if search_type == "random":
                regr = RandomizedSearchCV(Ridge(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(Ridge(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "RidgeCV"):

            if search_type == "random":
                regr = RandomizedSearchCV(RidgeCV(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(RidgeCV(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "SGDRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(SGDRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(SGDRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "SVR"):

            if search_type == "random":
                regr = RandomizedSearchCV(SVR(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(SVR(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "TheilSenRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(TheilSenRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(TheilSenRegressor(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "TransformedTargetRegressor"):

            if search_type == "random":
                regr = RandomizedSearchCV(TransformedTargetRegressor(), parms, cv=cross_val, scoring=scoring)
            else:
                regr =  GridSearchCV(TransformedTargetRegressor(), parms, cv=cross_val, scoring=scoring)

        else:
            return {'algorithm': algorithm,
                    'data': X.tolist(),
                    'labels': y.tolist(),
                    'downsample': downsampled,
                    'cross_val': cross_val,
                    'scoring': scoring,
                    'WARNING': algorithm + " not supported."}

    except:
        return {'algorithm': algorithm,
                'data': X.tolist(),
                'labels': y.tolist(),
                'downsample': downsampled,
                'cross_val': cross_val,
                'scoring': scoring,
                'WARNING': traceback.format_exc()}

    regr.fit(X, y)
    y_pred = regr.predict(X)
    result["y_pred"] = y_pred.tolist()

    result["best_parms"] = regr.best_params_
    result["best_score"] = regr.best_score_

    # TODO - The front end should specify a save name for the model
    model_name = algorithm +  "_" + str(random.random())
    model_dict = codex_hash.saveModel(model_name, regr.best_estimator_, "regressor")
    if not model_dict:
        result['WARNING'] = "Model could not be saved."
    else:   
        result['model_name'] = model_dict['name']
        result['model_hash'] = model_dict['hash']


    returnCodeString = "codex_regression_api.run_codex_regression('{inputHash}','{subsetHash}',{labelHash},{downsampled},{algorithm})\n".format(inputHash=inputHash, subsetHash=subsetHash, labelHash=labelHash, downsampled=downsampled, algorithm=algorithm)
    codex_return_code.logReturnCode(returnCodeString)
    
    
    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "regression",
        algorithm,
        computeTime,
        len(X),
        X.ndim)

    result['message'] = "success"
    return result



if __name__ == "__main__":

    codex_doctest.run_codex_doctest()








