'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.hash       import DOCTEST_SESSION
from api.sub.hash       import get_cache
from api.regression     import *
from fixtures           import testData

def test_ml_regression(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    # Standard use - linear regression
    result = ml_regression(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "linear", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5, 'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, 'explained_variance', "grid", 3, {}, session=ch)

    # Standard use - lasso regression
    result = ml_regression(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "lasso", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5,'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, 'explained_variance', "grid", 3, {}, session=ch)

    # Standard use - random forest regression
    result = ml_regression(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "randomForest", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5,'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, 'explained_variance', "grid", 3, {}, session=ch)


def test_run_regression(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ARDRegression", {}, "grid", 3, 'fake_score', session=ch)
    #print(result["WARNING"])
    #fake_score not a valid scoring metric for regression.

    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ARDRegression", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "AdaBoostRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "BaggingRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "BayesianRidge", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "CCA", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "DecisionTreeRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ElasticNet", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ElasticNetCV", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ExtraTreeRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "ExtraTreesRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "GaussianProcessRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "GradientBoostingRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "HuberRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "KNeighborsRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "KernelRidge", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "Lars", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LarsCV", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "Lasso", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LassoCV", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LassoLars", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LassoLarsCV", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LassoLarsIC", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LinearRegression", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "LinearSVR", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "MLPRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "MultiTaskElasticNet", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "MultiTaskElasticNetCV", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "MultiTaskLasso", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "MultiTaskLassoCV", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "NuSVR", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "OrthogonalMatchingPursuit", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "OrthogonalMatchingPursuitCV", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "PLSCanonical", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "PLSRegression", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "PassiveAggressiveRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "RANSACRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "RadiusNeighborsRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "RandomForestRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "Ridge", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "RidgeCV", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "SGDRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "SVR", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "TheilSenRegressor", {}, "grid", 3, 'explained_variance', session=ch)
    result = run_regression(testData['inputHash'], False, testData['regrLabelHash'], False, "TransformedTargetRegressor", {}, "grid", 3, 'explained_variance', session=ch)

