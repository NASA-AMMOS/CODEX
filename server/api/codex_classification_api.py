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
from sklearn import model_selection
import random

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

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run adaBoostClassifier classification algorithm")
            result['message'] = "Failed to run adaBoostClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None
        
    elif algorithmName == 'BaggingClassifier':

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run BaggingClassifier classification algorithm")
            result['message'] = "Failed to run BaggingClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == 'BayesianGaussianMixture':

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run BayesianGaussianMixture classification algorithm")
            result['message'] = "Failed to run BayesianGaussianMixture classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == 'BernoulliNB':

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run BernoulliNB classification algorithm")
            result['message'] = "Failed to run BernoulliNB classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == 'CalibratedClassifierCV':

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run CalibratedClassifierCV classification algorithm")
            result['message'] = "Failed to run CalibratedClassifierCV classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == 'ComplementNB':

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run ComplementNB classification algorithm")
            result['message'] = "Failed to run ComplementNB classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "DecisionTreeClassifier":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run DecisionTreeClassifier classification algorithm")
            result['message'] = "Failed to run DecisionTreeClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "ExtraTreeClassifier":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run ExtraTreeClassifier classification algorithm")
            result['message'] = "Failed to run ExtraTreeClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "ExtraTreesClassifier":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run ExtraTreesClassifier classification algorithm")
            result['message'] = "Failed to run ExtraTreesClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "GaussianMixture":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run GaussianMixture classification algorithm")
            result['message'] = "Failed to run GaussianMixture classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "GaussianNB":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run GaussianNB classification algorithm")
            result['message'] = "Failed to run GaussianNB classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "GaussianProcessClassifier":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run GaussianProcessClassifier classification algorithm")
            result['message'] = "Failed to run GaussianProcessClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "GradientBoostingClassifier":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run GradientBoostingClassifier classification algorithm")
            result['message'] = "Failed to run GradientBoostingClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "KNeighborsClassifier":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run KNeighborsClassifier classification algorithm")
            result['message'] = "Failed to run KNeighborsClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "LabelPropagation":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run LabelPropagation classification algorithm")
            result['message'] = "Failed to run LabelPropagation classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "LabelSpreading":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run LabelSpreading classification algorithm")
            result['message'] = "Failed to run LabelSpreading classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "LinearDiscriminantAnalysis":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run LinearDiscriminantAnalysis classification algorithm")
            result['message'] = "Failed to run LinearDiscriminantAnalysis classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "LogisticRegression":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run LogisticRegression classification algorithm")
            result['message'] = "Failed to run LogisticRegression classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "LogisticRegressionCV":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run LogisticRegressionCV classification algorithm")
            result['message'] = "Failed to run LogisticRegressionCV classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "MLPClassifier":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run MLPClassifier classification algorithm")
            result['message'] = "Failed to run MLPClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "MultinomialNB":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run MultinomialNB classification algorithm")
            result['message'] = "Failed to run MultinomialNB classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "NuSVC":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run NuSVC classification algorithm")
            result['message'] = "Failed to run NuSVC classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "QuadraticDiscriminantAnalysis":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run QuadraticDiscriminantAnalysis classification algorithm")
            result['message'] = "Failed to run QuadraticDiscriminantAnalysis classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "RandomForestClassifier":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run RandomForestClassifier classification algorithm")
            result['message'] = "Failed to run RandomForestClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "SGDClassifier":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run SGDClassifier classification algorithm")
            result['message'] = "Failed to run SGDClassifier classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif algorithmName == "SVC":

        try:
            result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName)
        except BaseException:
            codex_system.codex_log(
                "Failed to run SVC classification algorithm")
            result['message'] = "Failed to run SVC classification algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    else:
        result['message'] = "Cannot find requested classification algorithm"

    return result

def run_codex_classification(inputHash, subsetHash, labelHash, downsampled, algorithm):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        downsampled (int)   - number of data points to use for quicklook
        algorithm (string)  - Name of the classifier to run.  Follows Sklearn naming conventions.
                                Available keys:  AdaBoostClassifier | BaggingClassifier | BayesianGaussianMixture | 
                                                 BernoulliNB | CalibratedClassifierCV | ComplementNB | DecisionTreeClassifier | 
                                                 ExtraTreesClassifier | ExtraTreeClassifier | GaussianMixture | GaussianNB | 
                                                 GaussianProcessClassifier | GradientBoostingClassifier | KNeighborsClassifier | 
                                                 LabelPropagation | LabelSpreading | LinearDiscriminantAnalysis |  LogisticRegression | 
                                                 LogisticRegressionCV | MLPClassifier | MultinomialNB | NuSVC | QuadraticDiscriminantAnalysis | 
                                                 RandomForestClassifier | SGDClassifier | SVC


    Outputs:
        dictionary:
            algorithm (str)          - Name of the classifier which was run.  Will be same as algorithm input argument
            data (numpy.ndarray)     - (samples, features) array of features to cluster
            clusters (numpy.ndarray) -  array containing cluster index for each sample
            k (int)                  - number of clusters found
            downsample (int)         - number of data points used in quicklook
            numClusters (int)        - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = run_codex_classification(inputHash, False, labelHash[0], False, "AdaBoostClassifier")
    
    '''
    startTime = time.time()
    result = {'algorithm': algorithm,
              'downsample': downsampled,
              'WARNING': "None"}


    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log("Classification: " + algorithm + ": Hash not found. Returning!")
        return None

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log(
                "ERROR: run_codex_classification - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)

    if data.ndim < 2:
        codex_system.codex_log("ERROR: run_codex_classification - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)
    result['X'] = X.tolist()
    samples = len(data)


    result['eta'] = codex_time_log.getComputeTimeEstimate("classification", algorithm, samples)


    labelHash_dict = codex_hash.findHashArray("hash", labelHash, "label")
    if labelHash_dict is None:
        codex_system.codex_log("label hash not found. Returning!")
        return {'algorithm': algorithm,
                'downsample': downsampled,
                'WARNING': "Label not found in database."}
    else:
        y = labelHash_dict['data']
        result['y'] = y.tolist()

    try:

        if(algorithm == "AdaBoostClassifier"):
            clf = AdaBoostClassifier()
        elif(algorithm == "BaggingClassifier"):
            clf = BaggingClassifier()
        elif(algorithm == "BayesianGaussianMixture"):
            clf = BayesianGaussianMixture()
        elif(algorithm == "BernoulliNB"):
            clf = BernoulliNB()
        elif(algorithm == "CalibratedClassifierCV"):
            clf = CalibratedClassifierCV()
        elif(algorithm == "ComplementNB"):
            clf = ComplementNB()
        elif(algorithm == "DecisionTreeClassifier"):
            clf = DecisionTreeClassifier()
        elif(algorithm == "ExtraTreeClassifier"):
            clf = ExtraTreeClassifier()
        elif(algorithm == "ExtraTreesClassifier"):
            clf = ExtraTreesClassifier()
        elif(algorithm == "GaussianMixture"):
            clf = GaussianMixture()
        elif(algorithm == "GaussianNB"):
            clf = GaussianNB()
        elif(algorithm == "GaussianProcessClassifier"):
            clf = GaussianProcessClassifier()
        elif(algorithm == "GradientBoostingClassifier"):
            clf = GradientBoostingClassifier()
        elif(algorithm == "KNeighborsClassifier"):
            clf = KNeighborsClassifier()
        elif(algorithm == "LabelPropagation"):
            clf = LabelPropagation()
        elif(algorithm == "LabelSpreading"):
            clf = LabelSpreading()
        elif(algorithm == "LinearDiscriminantAnalysis"):
            clf = LinearDiscriminantAnalysis()
        elif(algorithm == "LogisticRegression"):
            clf = LogisticRegression()
        elif(algorithm == "LogisticRegressionCV"):
            clf = LogisticRegressionCV()
        elif(algorithm == "MLPClassifier"):
            clf = MLPClassifier()
        elif(algorithm == "MultinomialNB"):
            clf = MultinomialNB()
        elif(algorithm == "NuSVC"):
            clf = NuSVC()
        elif(algorithm == "QuadraticDiscriminantAnalysis"):
            clf = QuadraticDiscriminantAnalysis()
        elif(algorithm == "RandomForestClassifier"):
            clf = RandomForestClassifier()
        elif(algorithm == "SGDClassifier"):
            clf = SGDClassifier()
        elif(algorithm == "SVC"):
            clf = SVC()
        else:
            return {'algorithm': algorithm,
                    'data': X.tolist(),
                    'labels': y.tolist(),
                    'downsample': downsampled,
                    'WARNING': algorithm + " not supported."}

    except:
        return {'algorithm': algorithm,
                'data': X.tolist(),
                'labels': y.tolist(),
                'downsample': downsampled,
                'WARNING': traceback.format_exc()}

    # TODO - eta needs to be multipled by number of folds
    scores = model_selection.cross_val_score(clf, X, y, cv=5)

    clf.fit(X, y)

    # TODO - The front end should specify a save name for the model
    model_name = algorithm +  "_" + str(random.random())
    model_dict = codex_hash.saveModel(model_name, clf, "classifier")
    if not model_dict:
        result['WARNING'] = "Model could not be saved."
    else:   
        result['model_name'] = model_dict['name']
        result['model_hash'] = model_dict['hash']

    if subsetHash is False:
        if downsampled is False:
            returnCodeString = "codex_regression_api.run_codex_classification('" + inputHash + "',False," + labelHash + ",False," + algorithm + ")\n"
        else:
            returnCodeString = "codex_regression_api.run_codex_classification('" + inputHash + "',False," + labelHash + "," + str(downsampled) + "," + algorithm + ")\n"
    else:
        if downsampled is False:
            returnCodeString = "codex_regression_api.run_codex_classification('" + inputHash + "','" + subsetHash + "'," + labelHash + ",False," + algorithm + ")\n"
        else:
            returnCodeString = "codex_regression_api.run_codex_classification('" + inputHash + "','" + subsetHash + "'," + labelHash + "," + str(downsampled) + "," + algorithm + ")\n"

    codex_return_code.logReturnCode(returnCodeString)
    
    
    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "classification",
        algorithm,
        computeTime,
        len(X),
        X.ndim)

    return result



if __name__ == "__main__":

    import doctest
    results = doctest.testmod(verbose=True, optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)








