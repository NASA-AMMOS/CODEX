'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Regression algorithms, formatted for CODEX

Notes : 

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sklearn, subprocess
import h5py
import time
import traceback
import matplotlib.pyplot as plt
import numpy as np
from sklearn import datasets, linear_model
import numpy.polynomial.polynomial as poly
from sklearn.datasets import make_blobs
from sklearn.ensemble import RandomForestClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import log_loss
from sklearn.model_selection import train_test_split

# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
import sys
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

# CODEX Support
import codex_hash, codex_time_log
import codex_plot, codex_return_code
import codex_read_data_api, codex_system
import codex_doctest, codex_math

DEBUG = False

def ml_regression(inputHash, hashList, subsetHashName, labelHash, algorithmName, downsampled, parms, result):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> (inputHash, hashList, template, labelHash) = codex_doctest.doctest_get_data()

    # Standard use - linear regression
    >>> result = ml_regression(inputHash, hashList, None, labelHash, "linear", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5, 'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, {})

    # Standard use - lasso regression
    >>> result = ml_regression(inputHash, hashList, None, labelHash, "lasso", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5,'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, {})

    # Standard use - random forest regression
    >>> result = ml_regression(inputHash, hashList, None, labelHash, "randomForest", False, {'test_size': 0.9, 'alpha': 1, 'fit_intercept': 0.5,'max_iter':0.5, 'tol':0.9, 'n_estimators':25, 'downsampled': 500}, {})

    '''

    if(subsetHashName != None):
        subsetHash = codex_hash.findHashArray("name", subsetHashName,"subset")
        if(subsetHash == None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    if(algorithmName == 'linear'):
        try:
            ts = float(parms['test_size'])
        except:
            codex_system.codex_log("test_size parameter not set")
            result['message'] = "test_size parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            # TODO - fix
            result = codex_regression_linear(inputHash,inputHash,subsetHash,ts, downsampled, False)
        except:
            codex_system.codex_log("Failed to run regression algorithm")
            result['message'] = "Failed to run regression algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

	
    elif(algorithmName == 'lasso'):
        try:
            ts = float(parms['test_size'])
        except:
            codex_system.codex_log("test_size parameter not set")
            result['message'] = "test_size parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            alpha = float(parms['alpha'])
        except:
            codex_system.codex_log("alpha parameter not set")
            result['message'] = "alpha parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            fit_intercept = float(parms['fit_intercept'])
        except:
            codex_system.codex_log("fit_intercept parameter not set")
            result['message'] = "fit_intercept parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            max_iter = float(parms['max_iter'])
        except:
            codex_system.codex_log("max_iter parameter not set")
            result['message'] = "max_iter parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            tol = float(parms['tol'])
        except:
            codex_system.codex_log("tol parameter not set")
            result['message'] = "tol parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            # TODO - fix
            result = codex_regression_lasso(inputHash, inputHash, subsetHash, ts, alpha, fit_intercept, max_iter, tol, downsampled, False)
        except:
            codex_system.codex_log("Failed to run regression algorithm")
            result['message'] = "Failed to run regression algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif(algorithmName == "randomForest"):

        try:
            ts = float(parms['test_size'])
        except:
            codex_system.codex_log("test_size parameter not set")
            result['message'] = "test_size parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            n_estimators = float(parms['n_estimators'])
        except:
            codex_system.codex_log("n_estimators parameter not set")
            result['message'] = "n_estimators parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            # TODO - fix
            result = codex_regression_randomForest(inputHash, labelHash, subsetHash, n_estimators, ts, downsampled, False)
        except:
            codex_system.codex_log("Failed to run regression random forest algorithm")
            result['message'] = "Failed to run regression algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    else:
        result['message'] = "Cannot find requested regression algorithm"

    return result


def codex_regression_linear(inputHash, targetHash, subsetHash, test_size, downsampled, showPlot):
    '''
    Inputs:
        inputHash (string)               - hash value corresponding to the data to cluster
        targetHash (string)              - hash value corresponding to the target array (y) to regress against
        subsetHash (string)              - hash value corresponding to the subselection (false if full feature)
        test_size (float [0,1])          - percentage of the data to use in the test set
        showPlot (bool)                  - visualize results in standalone matplot lib if True

    Outputs:
        Dictionary - 
            coefficient (float)          - parameter vector (w in the cost function formula)
            mean_sqaured_error (float)   - mean squared error of the regression.  Algorithm: np.mean((regr.predict(X_test) - Y_test) ** 2)
            intercept (float)            - independent term in decision function.
            variance_score (float)       - R^2 score of self.predict(X) wrt. y.
            coefficient_array (np.array) - predicted value array

    Examples:

    >>> (hashList, inputHash, templateHash, labelHash) = codex_doctest.doctest_get_data()

    >>> codex_regression_linear(None, None, False, 0.33, False, False)
    Input hash not found. Returning!

    >>> codex_regression_linear(hashList, None, False, 0.33, False, False)
    Target hash not found. Returning!

    >>> codex_regression_linear(hashList, inputHash, inputHash, 0.33, False, False)
    Target hash not found. Returning!

    >>> (hashList,inputHash,templateHash, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_regression_linear(hashList, templateHash, False, 0.33, False, False)

    >>> (hashList,inputHash,templateHash, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_regression_linear(hashList, templateHash, False, 0.33, False, False)

    '''
    startTime = time.time()

    returnDataHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnDataHash is None):
        print("Input hash not found. Returning!")
        return

    data = returnDataHash['data']

    returnTargetHash = codex_hash.findHashArray("hash", targetHash, "feature")
    if(returnTargetHash is None):
        print("Target hash not found. Returning!")
        return

    targets = returnTargetHash['data']

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            print("ERROR: codex_regression_linear - subsetHash returned None for features.")
            return None

        targets = codex_hash.applySubsetMask(targets, subsetHash)
        if(targets is None):
            print("ERROR: codex_regression_linear - subsetHash returned None for targets.")
            return None

    try:
        samples, num_features = data.shape
    except:
        num_features = 1
        data = data.reshape(data.shape[0], -1)
	
    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "kmeans", samples)


    combined_data_labels = np.column_stack([targets,data])
    combined_data_labels = codex_math.codex_impute(combined_data_labels)
    targets = combined_data_labels[:,0]
    data = combined_data_labels[:,1:]

    X_train, X_test, Y_train, Y_test = train_test_split(data, targets, test_size=test_size, random_state=5)

    regr = linear_model.LinearRegression()
    regr.fit(X_train, Y_train)

    coefficient = regr.coef_
    intercept = regr.intercept_
    mean_squared_error = np.mean((regr.predict(X_test) - Y_test) ** 2)
    variance_score = regr.score(X_test, Y_test)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("regression", "linear", computeTime, len(data), data.ndim)

    if(showPlot == True):
        if(num_features == 1):
            codex_plot.plot_regression(regr, X_test, Y_test)
        else:
            print("WARNING: Plotting does not currently handle multiple linear regression.")
	
    if(subsetHash is False):
        returnCodeString = "codex_regression_api.codex_regression_linear('"+inputHash+"','"+targetHash+"',False,"+str(test_size)+",True)"
    else:
        returnCodeString = "codex_regression_api.codex_regression_linear('"+inputHash+"','"+targetHash+"','"+str(subsetHash)+"',"+str(test_size)+",True)" 
    codex_return_code.logReturnCode(returnCodeString)

    output = {'coefficient': coefficient.tolist(), 'mean_squared_error': mean_squared_error, 'intercept': intercept.tolist(), 'variance_score': variance_score, 'coefficient_array': regr.predict(X_test).tolist()}
	
    return output


def codex_regression_lasso(inputHash, targetHash, subsetHash, test_size, alpha, fit_intercept, max_iter, tol, downsampled, showPlot):
    '''
    Inputs:
        inputHash (string)               - hash value corresponding to the data to cluster
        targetHash (string)              - hash value corresponding to the target array (y) to regress against
        subsetHash (string)              - hash value corresponding to the subselection (false if full feature)
        test_size (float [0,1])          - percentage of the data to use in the test set
        alpha
        fit_intercept
        max_iter
        tol
        showPlot (bool)                  - visualize results in standalone matplot lib if True

    Outputs:
        Dictionary - 
            coefficient (float)          - parameter vector (w in the cost function formula)
            mean_sqaured_error (float)   - mean squared error of the regression.  Algorithm: np.mean((regr.predict(X_test) - Y_test) ** 2)
            intercept (float)            - independent term in decision function.
            variance_score (float)       - R^2 score of self.predict(X) wrt. y.
            coefficient_array (np.array) - predicted value array

    Examples:

    >>> (hashList,inputHash,templateHash, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_regression_lasso(hashList, templateHash, False, 0.33, 0.1, True, 1000, 0.0001, False, False)

    '''
    startTime = time.time()
    eta = None

    returnDataHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnDataHash is None):
        print("input hash not found. Returning!")
        return
    data = returnDataHash['data']

    try:
        samples, num_features = data.shape
    except:
        num_features = 1
        data = data.reshape(data.shape[0], -1)

    returnTargetHash = codex_hash.findHashArray("hash", targetHash, "feature")
    if(returnTargetHash is None):
        print("Target hash not found. Returning!")
        return
    targets = returnTargetHash['data']

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "kmeans", samples)


    combined_data_labels = np.column_stack([targets,data])
    combined_data_labels = codex_math.codex_impute(combined_data_labels)
    targets = combined_data_labels[:,0]
    data = combined_data_labels[:,1:]

    X_train, X_test, Y_train, Y_test = train_test_split(data, targets, test_size=test_size, random_state=5)

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        targets = codex_hash.applySubsetMask(targets, subsetHash)

    clf = linear_model.Lasso(alpha=alpha, fit_intercept=fit_intercept, max_iter=max_iter, selection='cyclic', tol=tol)
    clf.fit(X_train, Y_train)

    coefficient = clf.coef_
    intercept = clf.intercept_
    mean_squared_error = np.mean((clf.predict(X_test) - Y_test) ** 2)
    variance_score = clf.score(X_test, Y_test)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("regression", "lasso", computeTime, len(data), data.ndim)

    if(showPlot == True):
        if(num_features == 1):
            codex_plot.plot_regression(clf, X_test, Y_test)
        else:
            print("WARNING: Plotting does not currently handle multiple linear regression.")
	
    if(subsetHash is False):
        returnCodeString = "codex_regression_api.codex_regression_lasso('"+inputHash+"','"+targetHash+"',False,"+str(test_size)+","+str(alpha)+","+str(fit_intercept)+","+str(max_iter)+","+str(tol)+",True)"
    else:
        returnCodeString = "codex_regression_api.codex_regression_lasso('"+inputHash+"','"+targetHash+"','"+str(subsetHash)+"',"+str(test_size)+str(alpha)+","+str(fit_intercept)+","+str(max_iter)+","+str(tol)+",True)"
    codex_return_code.logReturnCode(returnCodeString)

    output = {'coefficient': coefficient,'mean_squared_error': mean_squared_error, 'intercept': intercept, 'variance_score': variance_score, 'coefficient_array': clf.predict(X_test)}
	
    return output

def codex_polynomial_regression(data, targets, degrees, downsampled, show):
    '''
    Inuputs:

    Outputs:

    Examples:

    '''

    #X = [[0.44, 0.68], [0.99, 0.23]]
    #vector = [109.85, 155.72]
    #predict= [0.49, 0.18]

    #poly = PolynomialFeatures(degree=2)
    #X_ = poly.fit_transform(X)
    #predict_ = poly.fit_transform(predict)

    #clf = linear_model.LinearRegression()
    #clf.fit(X_, vector)
    #print clf.predict(predict_)

    startTime = time.time()
    eta = None

    X_train, X_test, Y_train, Y_test = sklearn.cross_validation.train_test_split(data, targets, test_size=0.33, random_state=5)

    x_new = np.linspace([0], x[-1], num=len(x)*10)

    coefs = poly.polyfit(x, y, int(degrees))
    ffit = poly.polyval(x_new, coefs)


def codex_regression_randomForest(inputHash, targetHash, subsetHash, n_estimators, test_size, downsampled, showPlot):
    '''
    Inuputs:

    Outputs:

    Examples:

    '''

    startTime = time.time()
    eta = None

    returnDataHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnDataHash is None):
        print("input hash not found. Returning!")
        return
    data = returnDataHash['data']

    try:
        samples, num_features = data.shape
    except:
        num_features = 1
        data = data.reshape(data.shape[0], -1)

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "kmeans", samples)


    returnTargetHash = codex_hash.findHashArray("hash", targetHash, "label")
    if(returnTargetHash is None):
        print("Target hash not found. Returning!")
        return

    targets = returnTargetHash['data']

    combined_data_labels = np.column_stack([targets,data])
    combined_data_labels = codex_math.codex_impute(combined_data_labels)
    targets = combined_data_labels[:,0]
    data = combined_data_labels[:,1:]

    X_train, X_test, y_train, y_test = train_test_split(data, targets, test_size=test_size, random_state=5)

    clf = RandomForestClassifier(n_estimators=int(n_estimators))
    '''
    clf.fit(X_train, y_train)
    clf_probs = clf.predict_proba(X_test)
    score = log_loss(y_test, clf_probs)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("regression", "lasso", computeTime, len(data), data.ndim)
    
    if(showPlot == True):
        if(num_features == 1):
            codex_plot.plot_regression(clf, X_test, Y_test)
        else:
            print("WARNING: Plotting does not currently handle multiple linear regression.")
    
    if(subsetHash is False):
        returnCodeString = "codex_regression_api.codex_regression_lasso('"+inputHash+"','"+targetHash+"',False,"+str(test_size)+","+str(alpha)+","+str(fit_intercept)+","+str(max_iter)+","+str(tol)+",True)"
    else:
        returnCodeString = "codex_regression_api.codex_regression_lasso('"+inputHash+"','"+targetHash+"','"+str(subsetHash)+"',"+str(test_size)+str(alpha)+","+str(fit_intercept)+","+str(max_iter)+","+str(tol)+",True)"
    codex_return_code.logReturnCode(returnCodeString)

    output = {'coefficient': coefficient,'mean_squared_error': mean_squared_error, 'intercept': intercept, 'variance_score': variance_score, 'coefficient_array': clf.predict(X_test)}
    '''
    output = {}
    return output


if __name__ == "__main__":

    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)



