'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : classification algorithms, formatted for CODEX

Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''

# Enviornment variable for setting CODEX root directory.
import os
import sys
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

import time
import h5py
import traceback
import numpy as np
from sklearn.neighbors import kneighbors_graph

from sklearn.ensemble import AdaBoostClassifier
from sklearn.ensemble import BaggingClassifier
from sklearn.mixture import BayesianGaussianMixture
from sklearn.naive_bayes import BernoulliNB
from sklearn.calibration import CalibratedClassifierCV
from sklearn.naive_bayes import ComplementNB
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import ExtraTreesClassifier
from sklearn.tree import ExtraTreeClassifier
from sklearn.mixture import GaussianMixture
from sklearn.naive_bayes import GaussianNB
from sklearn.gaussian_process import GaussianProcessClassifier
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.semi_supervised import LabelPropagation
from sklearn.semi_supervised import LabelSpreading
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis
from sklearn.linear_model import LogisticRegression
from sklearn.linear_model import LogisticRegressionCV
from sklearn.neural_network import MLPClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.svm import NuSVC
from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import SGDClassifier
from sklearn.svm import SVC

import codex_return_code
import codex_math
import codex_time_log
import codex_doctest
import codex_plot
import codex_read_data_api
import codex_downsample
import codex_hash
import codex_dimmension_reduction_api
import codex_system
import codex_labels

DEBUG = False


def ml_classification(
        inputHash,
        hashList,
        subsetHashName,
        labelHash,
        algorithmName,
        downsampled,
        parms,
        result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''

    if len(hashList) < 2:
        codex_system.codex_log("Classification requires >= 2 features.")
        return None

    if subsetHashName is not None:
        subsetHash = codex_hash.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    if algorithmName == 'AdaBoostClassifier':
        '''
        try:
            k = int(parms['k'])
        except BaseException:
            codex_system.codex_log("K parameter not set")
            result['message'] = "K parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None
        '''

        try:
            result = codex_classification_adaBoostClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run adaBoostClassifier classification algorithm")
            result['message'] = "Failed to run adaBoostClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None
        
    elif algorithmName == 'BaggingClassifier':

        try:
            result = codex_classification_BaggingClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run BaggingClassifier classification algorithm")
            result['message'] = "Failed to run BaggingClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == 'BayesianGaussianMixture':

        try:
            result = codex_classification_BayesianGaussianMixture(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run BayesianGaussianMixture classification algorithm")
            result['message'] = "Failed to run BayesianGaussianMixture classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == 'BernoulliNB':

        try:
            result = codex_classification_BernoulliNB(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run BernoulliNB classification algorithm")
            result['message'] = "Failed to run BernoulliNB classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == 'CalibratedClassifierCV':

        try:
            result = codex_classification_CalibratedClassifierCV(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run CalibratedClassifierCV classification algorithm")
            result['message'] = "Failed to run CalibratedClassifierCV classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == 'ComplementNB':

        try:
            result = codex_classification_ComplementNB(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run ComplementNB classification algorithm")
            result['message'] = "Failed to run ComplementNB classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "DecisionTreeClassifier":

        try:
            result = codex_classification_DecisionTreeClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run DecisionTreeClassifier classification algorithm")
            result['message'] = "Failed to run DecisionTreeClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "ExtraTreeClassifier":

        try:
            result = codex_classification_ExtraTreeClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run ExtraTreeClassifier classification algorithm")
            result['message'] = "Failed to run ExtraTreeClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "ExtraTreesClassifier":

        try:
            result = codex_classification_ExtraTreesClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run ExtraTreesClassifier classification algorithm")
            result['message'] = "Failed to run ExtraTreesClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "GaussianMixture":

        try:
            result = codex_classification_GaussianMixture(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run GaussianMixture classification algorithm")
            result['message'] = "Failed to run GaussianMixture classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "GaussianNB":

        try:
            result = codex_classification_GaussianNB(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run GaussianNB classification algorithm")
            result['message'] = "Failed to run GaussianNB classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "GaussianProcessClassifier":

        try:
            result = codex_classification_GaussianProcessClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run GaussianProcessClassifier classification algorithm")
            result['message'] = "Failed to run GaussianProcessClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "GradientBoostingClassifier":

        try:
            result = codex_classification_GradientBoostingClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run GradientBoostingClassifier classification algorithm")
            result['message'] = "Failed to run GradientBoostingClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "KNeighborsClassifier":

        try:
            result = codex_classification_KNeighborsClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run KNeighborsClassifier classification algorithm")
            result['message'] = "Failed to run KNeighborsClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "LabelPropagation":

        try:
            result = codex_classification_LabelPropagation(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run LabelPropagation classification algorithm")
            result['message'] = "Failed to run LabelPropagation classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "LabelSpreading":

        try:
            result = codex_classification_LabelSpreading(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run LabelSpreading classification algorithm")
            result['message'] = "Failed to run LabelSpreading classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "LinearDiscriminantAnalysis":

        try:
            result = codex_classification_LinearDiscriminantAnalysis(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run LinearDiscriminantAnalysis classification algorithm")
            result['message'] = "Failed to run LinearDiscriminantAnalysis classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "LogisticRegression":

        try:
            result = codex_classification_LogisticRegression(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run LogisticRegression classification algorithm")
            result['message'] = "Failed to run LogisticRegression classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "LogisticRegressionCV":

        try:
            result = codex_classification_LogisticRegressionCV(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run LogisticRegressionCV classification algorithm")
            result['message'] = "Failed to run LogisticRegressionCV classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "MLPClassifier":

        try:
            result = codex_classification_MLPClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run MLPClassifier classification algorithm")
            result['message'] = "Failed to run MLPClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "MultinomialNB":

        try:
            result = codex_classification_MultinomialNB(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run MultinomialNB classification algorithm")
            result['message'] = "Failed to run MultinomialNB classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "NuSVC":

        try:
            result = codex_classification_NuSVC(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run NuSVC classification algorithm")
            result['message'] = "Failed to run NuSVC classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "QuadraticDiscriminantAnalysis":

        try:
            result = codex_classification_QuadraticDiscriminantAnalysis(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run QuadraticDiscriminantAnalysis classification algorithm")
            result['message'] = "Failed to run QuadraticDiscriminantAnalysis classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "RandomForestClassifier":

        try:
            result = codex_classification_RandomForestClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run RandomForestClassifier classification algorithm")
            result['message'] = "Failed to run RandomForestClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "SGDClassifier":

        try:
            result = codex_classification_SGDClassifier(inputHash, subsetHashName, labelHash, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run SGDClassifier classification algorithm")
            result['message'] = "Failed to run SGDClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "SVC":

        try:
            result = codex_classification_SVC(inputHash, hashList, subsetHashName, labelHash, False, downsampled)
        except BaseException:
            codex_system.codex_log(
                "Failed to run SVC classification algorithm")
            result['message'] = "Failed to run SVC classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    else:
        result['message'] = "Cannot find requested classification algorithm"

    return result


def codex_classification_adaBoostClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)       - "adaBoostClassifier"
            data (numpy.ndarray)     - (samples, features) array of features to cluster
            clusters (numpy.ndarray) -  array containing cluster index for each sample
            k (int)                  - number of clusters found
            downsample (int)         - number of data points used in quicklook
            numClusters (int)        - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_adaBoostClassifier(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log(
            "Classification: adaBoostClassifier: Hash not found. Returning!")
        return None

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log(
                "ERROR: codex_classification_adaBoostClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "AdaBoostClassifier", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_adaBoostClassifier - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = AdaBoostClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "AdaBoostClassifier",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_adaBoostClassifier('" + inputHash + "',False," + str(
            k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_adaBoostClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'adaBoostClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_BaggingClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)     - hash value corresponding to the data to cluster
        subsetHash (string)    - hash value corresponding to the subselection (false if full feature)
        quantile (float) [0,1] - Estimation of parise distances used in calculating bandwidth used in RBF kernel
        downsampled (int)      - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string) - "BaggingClassifier"
            data (numpy.ndarray) - (samples, features) array of features to cluster
            clusters (numpy.ndarray) -  array containing cluster index for each sample
            quantile (float) - Estimation of parise distances used in calculating bandwidth used in RBF kernel
            downsample (int) - number of data points used in quicklook
            numClusters (int)        - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_BaggingClassifier(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log(
                "ERROR: codex_classification_BaggingClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "BaggingClassifier", samples)


    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = BaggingClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "BaggingClassifier",
        computeTime,
        len(data),
        data.ndim)


    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_BaggingClassifier('" + inputHash + "',False," + str(
            quantile) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_BaggingClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            quantile) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'BaggingClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_BayesianGaussianMixture(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)       - hash value corresponding to the data to cluster
        subsetHash (string)      - hash value corresponding to the subselection (false if full feature)
        downsampled (int)        - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)         - "BayesianGaussianMixture"
            data (np.ndarray)          - (samples, features) array of features to cluster
            clusters (np.ndarray)      - Array containing cluster index for each sample
            damping (float)            - Damping factor
            downsample (int)           - number of data points used in quicklook
            numClusters (int)        - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_BayesianGaussianMixture(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_BayesianGaussianMixture - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "BayesianGaussianMixture", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_BayesianGaussianMixture - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']

    algorithm = BayesianGaussianMixture()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "BayesianGaussianMixture",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_BayesianGaussianMixture('" + inputHash + "',False," + str(
            damping) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_BayesianGaussianMixture('" + inputHash + "','" + subsetHash + "'," + str(
            damping) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'BayesianGaussianMixture',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_BernoulliNB(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)    - "BernoulliNB"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook
            numClusters (int)     - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_BernoulliNB(inputHash, False, labelHash, False)

    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_BernoulliNB - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "BernoulliNB", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_BernoulliNB - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']

    algorithm = BernoulliNB()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "BernoulliNB",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_BernoulliNB('" + inputHash + "',False," + str(
            k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_BernoulliNB('" + inputHash + "','" + subsetHash + "'," + str(
            k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''
    output = {'eta': eta,
              'algorithm': 'BernoulliNB',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_CalibratedClassifierCV(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)     - "CalibratedClassifierCV"
            data (np.ndarray)      - (samples, features) array of features to cluster
            downsample (int)       - number of data points used in quicklook
            numClusters (int)      - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_CalibratedClassifierCV(inputHash, False, labelHash, False)
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_CalibratedClassifierCV - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "CalibratedClassifierCV", samples)

    if data.ndim < 2:
        print("ERROR: codex_classification_CalibratedClassifierCV - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = CalibratedClassifierCV()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "CalibratedClassifierCV",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_CalibratedClassifierCV('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_CalibratedClassifierCV('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'CalibratedClassifierCV',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_ComplementNB(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)    - "ComplementNB"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook
            numClusters (int)     - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_ComplementNB(inputHash, False, labelHash, False)

    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_ComplementNB - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "ComplementNB", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_ComplementNB - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']

    algorithm = ComplementNB()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "ComplementNB",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_ComplementNB('" + inputHash + "',False," + str(
            k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_ComplementNB('" + inputHash + "','" + subsetHash + "'," + str(
            k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': "ComplementNB",
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_DecisionTreeClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        eps (float)         - The maximum distance between two samples for them to be considered as in the same neighborhood
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)    - "DecisionTreeClassifier"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook
            numClusters (int)     - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_DecisionTreeClassifier(inputHash, False, labelHash, False)
        
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_DecisionTreeClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "DecisionTreeClassifier", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_DecisionTreeClassifier - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = DecisionTreeClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "DecisionTreeClassifier",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_DecisionTreeClassifier('" + inputHash + "',False," + str(
            eps) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_DecisionTreeClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            eps) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'DecisionTreeClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_ExtraTreeClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "ExtraTreeClassifier"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook
            numClusters (int)     - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_ExtraTreeClassifier(inputHash, False, labelHash, False)
        
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_ExtraTreeClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "ExtraTreeClassifier", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_ExtraTreeClassifier - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = ExtraTreeClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "ExtraTreeClassifier",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_ExtraTreeClassifier('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_ExtraTreeClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'ExtraTreeClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_ExtraTreesClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        n_neighbors (int)   - The number of connected components in the graph defined by the connectivity matrix.        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)    - "ExtraTreesClassifier"
            data (np.ndarray)     - (samples, features) array of features to cluster
            clusters (np.ndarray) -  array containing cluster index for each sample
            n_neighbors (int)     - The number of connected components in the graph defined by the connectivity matrix.
            downsample (int)      - number of data points used in quicklook
            numClusters (int)     - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_ExtraTreesClassifier(inputHash, False, labelHash, False)
        
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_ExtraTreesClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "ExtraTreesClassifier", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_ExtraTreesClassifier - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']

    algorithm = ExtraTreesClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "ExtraTreesClassifier",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_ExtraTreesClassifier('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_ExtraTreesClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'ExtraTreesClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_GaussianMixture(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "GaussianMixture"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_GaussianMixture(inputHash, False, labelHash, False)
        
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classifcation_GaussianMixture - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "GaussianMixture", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_GaussianMixture - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = GaussianMixture()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "GaussianMixture",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_GaussianMixture('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_GaussianMixture('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'GaussianMixture',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_GaussianNB(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "GaussianNB"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook
            numClusters (int)     - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_GaussianNB(inputHash, False, labelHash, False)
        
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_GaussianNB - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "GaussianNB", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_GaussianNB - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = GaussianNB()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "GaussianNB",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_GaussianNB('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_GaussianNB('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'GaussianNB',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_GaussianProcessClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        n_neighbors (int)   - The number of connected components in the graph defined by the connectivity matrix.        
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)    - "GaussianProcessClassifier"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_GaussianProcessClassifier(inputHash, False, labelHash, False)
        
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_GaussianProcessClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "GaussianProcessClassifier", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_GaussianProcessClassifier - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = GaussianProcessClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "GaussianProcessClassifier",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_GaussianProcessClassifier('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_GaussianProcessClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'GaussianProcessClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_GradientBoostingClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "GradientBoostingClassifier"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook
 
    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_GradientBoostingClassifier(inputHash, False, labelHash, False)
        
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_GradientBoostingClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "GradientBoostingClassifier", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_GradientBoostingClassifier - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = GradientBoostingClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "GradientBoostingClassifier",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_GradientBoostingClassifier('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_GradientBoostingClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'GradientBoostingClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_KNeighborsClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "KNeighborsClassifier"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_KNeighborsClassifier(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_KNeighborsClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "KNeighborsClassifier", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_KNeighborsClassifier - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = KNeighborsClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "KNeighborsClassifier",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_KNeighborsClassifier('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_KNeighborsClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'KNeighborsClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_LabelPropagation(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "LabelPropagation"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_LabelPropagation(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_LabelPropagation - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "LabelPropagation", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_LabelPropagation - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = LabelPropagation()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "LabelPropagation",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_LabelPropagation('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_LabelPropagation('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'LabelPropagation',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_LabelSpreading(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "LabelSpreading"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_LabelSpreading(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_LabelSpreading - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "LabelSpreading", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_LabelSpreading - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = LabelSpreading()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "LabelSpreading",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_LabelSpreading('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_LabelSpreading('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'LabelSpreading',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_LinearDiscriminantAnalysis(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "LinearDiscriminantAnalysis"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_LinearDiscriminantAnalysis(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_LinearDiscriminantAnalysis - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "LinearDiscriminantAnalysis", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_LinearDiscriminantAnalysis - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = LinearDiscriminantAnalysis()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "LinearDiscriminantAnalysis",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_LinearDiscriminantAnalysis('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_LinearDiscriminantAnalysis('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'LinearDiscriminantAnalysis',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_LogisticRegression(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "LogisticRegression"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_LogisticRegression(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_LogisticRegression - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "LogisticRegression", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_LogisticRegression - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = LogisticRegression()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "LogisticRegression",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_LogisticRegression('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_LogisticRegression('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'LogisticRegression',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_LogisticRegressionCV(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "LogisticRegressionCV"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_LogisticRegressionCV(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_LogisticRegressionCV - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "LogisticRegressionCV", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_LogisticRegressionCV - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = LogisticRegressionCV()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "LogisticRegressionCV",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_LogisticRegressionCV('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_LogisticRegressionCV('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'LogisticRegressionCV',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_MLPClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "MLPClassifier"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_MLPClassifier(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_MLPClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "MLPClassifier", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_MLPClassifier - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = MLPClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "MLPClassifier",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_MLPClassifier('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_MLPClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'MLPClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_MultinomialNB(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "MultinomialNB"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_MultinomialNB(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_MultinomialNB - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "MultinomialNB", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_MultinomialNB - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = MultinomialNB()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "MultinomialNB",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_MultinomialNB('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_MultinomialNB('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'MultinomialNB',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_NuSVC(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "NuSVC"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_NuSVC(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_NuSVC - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "NuSVC", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_NuSVC - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    try:
        algorithm = NuSVC()
        algorithm.fit(X, y)
    except:
        return {'algorithm': 'NuSVC',
                'data': X.tolist(),
                "WARNING":sys.exc_info()}

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "NuSVC",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_NuSVC('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_NuSVC('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'NuSVC',
              'data': X.tolist(),
              'downsample': downsampled,
              'WARNING': "None"}

    return output

def codex_classification_QuadraticDiscriminantAnalysis(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "QuadraticDiscriminantAnalysis"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_QuadraticDiscriminantAnalysis(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_QuadraticDiscriminantAnalysis - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "QuadraticDiscriminantAnalysis", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_QuadraticDiscriminantAnalysis - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = QuadraticDiscriminantAnalysis()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "QuadraticDiscriminantAnalysis",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_QuadraticDiscriminantAnalysis('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_QuadraticDiscriminantAnalysis('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'QuadraticDiscriminantAnalysis',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_RandomForestClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "RandomForestClassifier"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_RandomForestClassifier(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_RandomForestClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "RandomForestClassifier", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_RandomForestClassifier - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = RandomForestClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "RandomForestClassifier",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_RandomForestClassifier('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_RandomForestClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'RandomForestClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_SGDClassifier(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "SGDClassifier"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_SGDClassifier(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_SGDClassifier - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "SGDClassifier", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_SGDClassifier - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = SGDClassifier()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "SGDClassifier",
        computeTime,
        len(data),
        data.ndim)

    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_SGDClassifier('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_SGDClassifier('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'SGDClassifier',
              'data': X.tolist(),
              'downsample': downsampled}

    return output

def codex_classification_SVC(inputHash, subsetHash, labelHash, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary:
            algorithm (string)    - "SVC"
            data (np.ndarray)     - (samples, features) array of features to cluster
            downsample (int)      - number of data points used in quicklook

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = codex_classification_SVC(inputHash, False, labelHash, False)
    
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if data is None:
            codex_system.codex_log(
                "ERROR: codex_classification_SVC - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate(
            "classification", "SVC", samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: codex_classification_SVC - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    labelHash = codex_hash.findHashArray("hash", labelHash[0], "label")
    if labelHash is None:
        codex_system.codex_log("label hash not found. Returning!")
        return
    else:
        y = labelHash['data']


    algorithm = SVC()
    algorithm.fit(X, y)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        "SVC",
        computeTime,
        len(data),
        data.ndim)


    '''
    if subsetHash is False:
        returnCodeString = "codex_classification_api.codex_classification_SVC('" + inputHash + "',False," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_classification_api.codex_classification_SVC('" + inputHash + "','" + subsetHash + "'," + str(
            n_neighbors) + "," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''

    output = {'eta': eta,
              'algorithm': 'SVC',
              'data': X.tolist(),
              'downsample': downsampled}

    return output


if __name__ == "__main__":

    import doctest
    results = doctest.testmod(verbose=True, optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)
    #(inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
    #result = codex_classification_NuSVC(inputHash, False, labelHash, False)
    







