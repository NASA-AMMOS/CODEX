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
    #>>> result = ml_regression(inputHash, hashList, None, labelHash, "linear", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5, 'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, {})

    # Standard use - lasso regression
    #>>> result = ml_regression(inputHash, hashList, None, labelHash, "lasso", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5,'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, {})

    # Standard use - random forest regression
    #>>> result = ml_regression(inputHash, hashList, None, labelHash, "randomForest", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5,'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, {})

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
    
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "ARDRegression", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "AdaBoostRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "BaggingRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "BayesianRidge", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "CCA", {})

        >>> result = run_codex_regression(inputHash, False, labelHash[0], False, "DecisionTreeRegressor", {})

        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "ElasticNet", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "ElasticNetCV", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "ExtraTreeRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "ExtraTreesRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "GaussianProcessRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "GradientBoostingRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "HuberRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "KNeighborsRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "KernelRidge", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "Lars", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "LarsCV", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "Lasso", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "LassoCV", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "LassoLars", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "LassoLarsCV", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "LassoLarsIC", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "LinearRegression", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "LinearSVR", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "MLPRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "MultiTaskElasticNet", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "MultiTaskElasticNetCV", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "MultiTaskLasso", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "MultiTaskLassoCV", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "NuSVR", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "OrthogonalMatchingPursuit", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "OrthogonalMatchingPursuitCV", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "PLSCanonical", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "PLSRegression", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "PassiveAggressiveRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "RANSACRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "RadiusNeighborsRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "RandomForestRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "Ridge", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "RidgeCV", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "SGDRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "SVR", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "TheilSenRegressor", {})
        #>>> result = run_codex_regression(inputHash, False, labelHash[0], False, "TransformedTargetRegressor", {})

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

    labelHash_dict = codex_hash.findHashArray("hash", labelHash, "label")
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
            return {'algorithm': algorithm,
                    'downsample': downsampled,
                    'cross_val': cross_val,
                    'WARNING': "Label class has less samples than cross val score"}  

    try:
        if(algorithm == "ARDRegression"):
            regr =  GridSearchCV(ARDRegression(), parms, cv=cross_val, scoring='precision')
        elif(algorithm == "AdaBoostRegressor"):
            regr = AdaBoostRegressor(n_estimators=parms["n_estimators"])
        elif(algorithm == "BaggingRegressor"):
            regr = BaggingRegressor(n_estimators=parms["n_estimators"])
        elif(algorithm == "BayesianRidge"):
            regr = BayesianRidge(n_estimators=parms["n_estimators"])
        elif(algorithm == "CCA"):
            regr = CCA(max_iter=parms["max_iter"])
        elif(algorithm == "DecisionTreeRegressor"):
            regr = DecisionTreeRegressor(max_depth=parms["max_depth"])
        elif(algorithm == "ElasticNet"):
            regr = ElasticNet(max_iter=parms["max_iter"])
        elif(algorithm == "ElasticNetCV"):
            regr = ElasticNetCV(max_iter=parms["max_iter"])
        elif(algorithm == "ExtraTreeRegressor"):
            regr = ExtraTreeRegressor(max_features=parms["max_features"])
        elif(algorithm == "ExtraTreesRegressor"):
            regr = ExtraTreesRegressor(max_features=parms["max_features"])
        elif(algorithm == "GaussianProcessRegressor"):
            regr = GaussianProcessRegressor(n_restarts_optimizer=parms["n_restarts_optimizer"])
        elif(algorithm == "GradientBoostingRegressor"):
            regr = GradientBoostingRegressor(max_depth=parms["max_depth"])
        elif(algorithm == "HuberRegressor"):
            regr = HuberRegressor(max_iter=parms["max_iter"])
        elif(algorithm == "KNeighborsRegressor"):
            regr = KNeighborsRegressor()
        elif(algorithm == "KernelRidge"):
            regr = KernelRidge()
        elif(algorithm == "Lars"):
            regr = Lars()
        elif(algorithm == "LarsCV"):
            regr = LarsCV()
        elif(algorithm == "Lasso"):
            regr = Lasso()
        elif(algorithm == "LassoCV"):
            regr = LassoCV()
        elif(algorithm == "LassoLars"):
            regr = LassoLars()
        elif(algorithm == "LassoLarsCV"):
            regr = LassoLarsCV()
        elif(algorithm == "LassoLarsIC"):
            regr = LassoLarsIC()
        elif(algorithm == "LinearRegression"):
            regr = LinearRegression()
        elif(algorithm == "LinearSVR"):
            regr = LinearSVR()
        elif(algorithm == "MLPRegressor"):
            regr = MLPRegressor()
        elif(algorithm == "MultiTaskElasticNet"):
            regr = MultiTaskElasticNet()
        elif(algorithm == "MultiTaskElasticNetCV"):
            regr = MultiTaskElasticNetCV()
        elif(algorithm == "MultiTaskLasso"):
            regr = MultiTaskLasso()
        elif(algorithm == "MultiTaskLassoCV"):
            regr = MultiTaskLassoCV()
        elif(algorithm == "NuSVR"):
            regr = NuSVR()
        elif(algorithm == "OrthogonalMatchingPursuit"):
            regr = OrthogonalMatchingPursuit()
        elif(algorithm == "OrthogonalMatchingPursuitCV"):
            regr = OrthogonalMatchingPursuitCV()
        elif(algorithm == "PLSCanonical"):
            regr = PLSCanonical()
        elif(algorithm == "PLSRegression"):
            regr = PLSRegression()
        elif(algorithm == "PassiveAggressiveRegressor"):
            regr = PassiveAggressiveRegressor()
        elif(algorithm == "RANSACRegressor"):
            regr = RANSACRegressor()
        elif(algorithm == "RadiusNeighborsRegressor"):
            regr = RadiusNeighborsRegressor()
        elif(algorithm == "RandomForestRegressor"):
            regr = RandomForestRegressor()
        elif(algorithm == "Ridge"):
            regr = Ridge()
        elif(algorithm == "RidgeCV"):
            regr = RidgeCV()
        elif(algorithm == "SGDRegressor"):
            regr = SGDRegressor()
        elif(algorithm == "SVR"):
            regr = SVR()
        elif(algorithm == "TheilSenRegressor"):
            regr = TheilSenRegressor()
        elif(algorithm == "TransformedTargetRegressor"):
            regr = TransformedTargetRegressor()
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

    clf.fit(X,y)
    y_pred = clf.predict(X)
    cm = confusion_matrix(y, y_pred)
    cm = cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]
    result['cm_data'] = cm.tolist()
    result['classes'] = np.unique(y).tolist()

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

