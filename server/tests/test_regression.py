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

#inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, session
def test_regression(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    #result = regression(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "ARDRegression",               False, {}, 'fake_score', "grid", 3, {}, ch).run()

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "ARDRegression",               False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "AdaBoostRegressor",           False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "BaggingRegressor",            False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "BayesianRidge",               False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "CCA",                         False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "DecisionTreeRegressor",       False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "ElasticNet",                  False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "ExtraTreeRegressor",          False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "ExtraTreesRegressor",         False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "GaussianProcessRegressor",    False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "GradientBoostingRegressor",   False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "HuberRegressor",              False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "KNeighborsRegressor",         False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "KernelRidge",                 False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "Lars",                        False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "Lasso",                       False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "LassoLars",                   False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "LinearRegression",            False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "LinearSVR",                   False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "MLPRegressor",                False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "NuSVR",                       False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "OrthogonalMatchingPursuit",   False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "PLSCanonical",                False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "PLSRegression",               False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "PassiveAggressiveRegressor",  False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "RANSACRegressor",             False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "RandomForestRegressor",       False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "Ridge",                       False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "SGDRegressor",                False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "SVR",                         False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "TheilSenRegressor",           False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'

    result = regression(testData['inputHash'], None, testData['featureNames'], testData['hashList'], testData['regrLabelHash'], False, "TransformedTargetRegressor",  False, [{}], 'explained_variance', "grid", 3, {}, ch).run()
    assert result['message'] == 'success'
