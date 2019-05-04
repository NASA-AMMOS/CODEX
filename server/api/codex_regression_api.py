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
        cross_val,
        result):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> (inputHash, hashList, template, labelHash) = codex_doctest.doctest_get_data()

    # Standard use - linear regression
    >>> result = ml_regression(inputHash, hashList, None, labelHash, "linear", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5, 'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, 3, {})

    # Standard use - lasso regression
    >>> result = ml_regression(inputHash, hashList, None, labelHash, "lasso", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5,'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, 3, {})

    # Standard use - random forest regression
    >>> result = ml_regression(inputHash, hashList, None, labelHash, "randomForest", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5,'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, 3, {})

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
        result =  run_codex_regression(inputHash, subsetHashName, labelHash, downsampled, algorithmName, parms, cross_val)
    except BaseException:
        codex_system.codex_log("Failed to run regression algorithm")
        result['message'] = "Failed to run regression algorithm"
        codex_system.codex_log(traceback.format_exc())
        return None

    return result

def run_codex_regression(inputHash, subsetHash, labelHash, downsampled, algorithm, parms, cross_val):
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
            clusters (numpy.ndarray) -  array containing cluster index for each sample
            k (int)                  - number of clusters found
            downsample (int)         - number of data points used in quicklook
            numClusters (int)        - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "ARDRegression", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "AdaBoostRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "BaggingRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "BayesianRidge", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "CCA", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "DecisionTreeRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "ElasticNet", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "ElasticNetCV", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "ExtraTreeRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "ExtraTreesRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "GaussianProcessRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "GradientBoostingRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "HuberRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "KNeighborsRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "KernelRidge", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "Lars", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "LarsCV", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "Lasso", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "LassoCV", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "LassoLars", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "LassoLarsCV", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "LassoLarsIC", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "LinearRegression", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "LinearSVR", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "MLPRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "MultiTaskElasticNet", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "MultiTaskElasticNetCV", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "MultiTaskLasso", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "MultiTaskLassoCV", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "NuSVR", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "OrthogonalMatchingPursuit", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "OrthogonalMatchingPursuitCV", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "PLSCanonical", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "PLSRegression", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "PassiveAggressiveRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "RANSACRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "RadiusNeighborsRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "RandomForestRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "Ridge", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "RidgeCV", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "SGDRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "SVR", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "TheilSenRegressor", {}, 3)
        >>> result = run_codex_regression(inputHash, False, labelHash, False, "TransformedTargetRegressor", {}, 3)

    '''
    startTime = time.time()
    result = {'algorithm': algorithm,
              'downsample': downsampled,
              'cross_val': cross_val,
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
            codex_system.codex_log(
                "ERROR: run_codex_regression - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)

    if data.ndim < 2:
        codex_system.codex_log("ERROR: run_codex_regression - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)
    result['X'] = X.tolist()
    samples = len(data)


    result['eta'] = codex_time_log.getComputeTimeEstimate("regression", algorithm, samples)

    # TODO - labels are currently cached under features
    labelHash_dict = codex_hash.findHashArray("hash", labelHash, "feature")
    if labelHash_dict is None:
        codex_system.codex_log("label hash not found. Returning!")
        return {'algorithm': algorithm,
                'downsample': downsampled,
                'cross_val': cross_val,
                'WARNING': "Label not found in database."}
    else:
        y = labelHash_dict['data']
        result['y'] = y.tolist()

        unique, counts = np.unique(y, return_counts=True)
        count_dict = dict(zip(unique, counts))
        if any(v < cross_val for v in count_dict.values()):
            count_dict = dict(zip(unique.astype(str), counts.astype(str)))
            return {'algorithm': algorithm,
                    'downsample': downsampled,
                    'cross_val': cross_val,
                    'counts': json.dumps(count_dict),
                    'WARNING': "Label class has less samples than cross val score"}  

    scoring = 'r2' # TODO - implement all scoring metrics here: https://scikit-learn.org/stable/modules/model_evaluation.html#scoring-parameter
    try:
        if(algorithm == "ARDRegression"):
            regr =  GridSearchCV(ARDRegression(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "AdaBoostRegressor"):
            regr =  GridSearchCV(AdaBoostRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "BaggingRegressor"):
            regr =  GridSearchCV(BaggingRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "BayesianRidge"):
            regr =  GridSearchCV(BayesianRidge(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "CCA"):
            regr =  GridSearchCV(CCA(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "DecisionTreeRegressor"):
            regr =  GridSearchCV(DecisionTreeRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "ElasticNet"):
            regr =  GridSearchCV(ElasticNet(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "ElasticNetCV"):
            regr =  GridSearchCV(ElasticNetCV(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "ExtraTreeRegressor"):
            regr =  GridSearchCV(ExtraTreeRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "ExtraTreesRegressor"):
            regr =  GridSearchCV(ExtraTreesRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "GaussianProcessRegressor"):
            regr =  GridSearchCV(GaussianProcessRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "GradientBoostingRegressor"):
            regr =  GridSearchCV(GradientBoostingRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "HuberRegressor"):
            regr =  GridSearchCV(HuberRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "KNeighborsRegressor"):
            regr =  GridSearchCV(KNeighborsRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "KernelRidge"):
            regr =  GridSearchCV(KernelRidge(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "Lars"):
            regr =  GridSearchCV(Lars(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "LarsCV"):
            regr =  GridSearchCV(LarsCV(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "Lasso"):
            regr =  GridSearchCV(Lasso(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "LassoCV"):
            regr =  GridSearchCV(LassoCV(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "LassoLars"):
            regr =  GridSearchCV(LassoLars(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "LassoLarsCV"):
            regr =  GridSearchCV(LassoLarsCV(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "LassoLarsIC"):
            regr =  GridSearchCV(LassoLarsIC(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "LinearRegression"):
            regr =  GridSearchCV(LinearRegression(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "LinearSVR"):
            regr =  GridSearchCV(LinearSVR(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "MLPRegressor"):
            regr =  GridSearchCV(MLPRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "MultiTaskElasticNet"):
            regr =  GridSearchCV(MultiTaskElasticNet(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "MultiTaskElasticNetCV"):
            regr =  GridSearchCV(MultiTaskElasticNetCV(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "MultiTaskLasso"):
            regr =  GridSearchCV(MultiTaskLasso(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "MultiTaskLassoCV"):
            regr =  GridSearchCV(MultiTaskLassoCV(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "NuSVR"):
            regr =  GridSearchCV(NuSVR(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "OrthogonalMatchingPursuit"):
            regr =  GridSearchCV(OrthogonalMatchingPursuit(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "OrthogonalMatchingPursuitCV"):
            regr =  GridSearchCV(OrthogonalMatchingPursuitCV(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "PLSCanonical"):
            regr =  GridSearchCV(PLSCanonical(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "PLSRegression"):
            regr =  GridSearchCV(PLSRegression(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "PassiveAggressiveRegressor"):
            regr =  GridSearchCV(PassiveAggressiveRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "RANSACRegressor"):
            regr =  GridSearchCV(RANSACRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "RadiusNeighborsRegressor"):
            regr =  GridSearchCV(RadiusNeighborsRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "RandomForestRegressor"):
            regr =  GridSearchCV(RandomForestRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "Ridge"):
            regr =  GridSearchCV(Ridge(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "RidgeCV"):
            regr =  GridSearchCV(RidgeCV(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "SGDRegressor"):
            regr =  GridSearchCV(SGDRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "SVR"):
            regr =  GridSearchCV(SVR(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "TheilSenRegressor"):
            regr =  GridSearchCV(TheilSenRegressor(), parms, cv=cross_val, scoring=scoring)
        elif(algorithm == "TransformedTargetRegressor"):
            regr =  GridSearchCV(TransformedTargetRegressor(), parms, cv=cross_val, scoring=scoring)
        else:
            return {'algorithm': algorithm,
                    'data': X.tolist(),
                    'labels': y.tolist(),
                    'downsample': downsampled,
                    'cross_val': cross_val,
                    'WARNING': algorithm + " not supported."}

    except:
        return {'algorithm': algorithm,
                'data': X.tolist(),
                'labels': y.tolist(),
                'downsample': downsampled,
                'cross_val': cross_val,
                'WARNING': traceback.format_exc()}

    regr.fit(X,y)
    y_pred = regr.predict(X)

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

    if subsetHash is False:
        if downsampled is False:
            returnCodeString = "codex_regression_api.run_codex_regression('" + inputHash + "',False," + labelHash + ",False," + algorithm + ")\n"
        else:
            returnCodeString = "codex_regression_api.run_codex_regression('" + inputHash + "',False," + labelHash + "," + str(downsampled) + "," + algorithm + ")\n"
    else:
        if downsampled is False:
            returnCodeString = "codex_regression_api.run_codex_regression('" + inputHash + "','" + subsetHash + "'," + labelHash + ",False," + algorithm + ")\n"
        else:
            returnCodeString = "codex_regression_api.run_codex_regression('" + inputHash + "','" + subsetHash + "'," + labelHash + "," + str(downsampled) + "," + algorithm + ")\n"

    codex_return_code.logReturnCode(returnCodeString)
    
    
    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "regression",
        algorithm,
        computeTime,
        len(X),
        X.ndim)

    return result



if __name__ == "__main__":

    import doctest
    results = doctest.testmod(verbose=True, optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)

