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
from sklearn.model_selection import GridSearchCV
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

    try:
        result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName, parms)
    except BaseException:
        codex_system.codex_log(
            "Failed to run classification algorithm")
        result['message'] = "Failed to run classification algorithm"
        codex_system.codex_log(traceback.format_exc())
        return None

    return result

def run_codex_classification(inputHash, subsetHash, labelHash, downsampled, algorithm,  parms):
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
            downsample (int)         - number of data points used in quicklook


    Examples:

        >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    
        >>> result = run_codex_classification(inputHash, False, labelHash[0], False, "AdaBoostClassifier", {"n_estimators":[10]})
        >>> print(result["WARNING"])
        None
    '''
    startTime = time.time()
    result = {'algorithm': algorithm,
              'downsample': downsampled,
              'WARNING': "None"}

    cv_count = 5 # TODO - start getting from front end

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

        unique, counts = np.unique(y, return_counts=True)
        count_dict = dict(zip(unique, counts))
        if any(v < cv_count for v in count_dict.values()):
            return {'algorithm': algorithm,
                    'downsample': downsampled,
                    'WARNING': "Label class has less samples than cross val score"}         

    try:

        if(algorithm == "AdaBoostClassifier"):
            #clf = AdaBoostClassifier(n_estimators=parms["n_estimators"])
            clf =  GridSearchCV(AdaBoostClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "BaggingClassifier"):
            #clf = BaggingClassifier(n_estimators=parms["n_estimators"])
            clf =  GridSearchCV(BaggingClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "BayesianGaussianMixture"):
            #clf = BayesianGaussianMixture(n_components=parms["n_components"])
            clf =  GridSearchCV(BayesianGaussianMixture(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "BernoulliNB"):
            #clf = BernoulliNB(alpha=parms["alpha"])
            clf =  GridSearchCV(BernoulliNB(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "CalibratedClassifierCV"):
            #clf = CalibratedClassifierCV(method=parms["method"])
            clf =  GridSearchCV(CalibratedClassifierCV(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "ComplementNB"):
            #clf = ComplementNB(alpha=parms["alpha"])
            clf =  GridSearchCV(ComplementNB(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "DecisionTreeClassifier"):
            #clf = DecisionTreeClassifier(max_depth=parms["max_depth"])
            clf =  GridSearchCV(DecisionTreeClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "ExtraTreeClassifier"):
            #clf = ExtraTreeClassifier(max_depth=parms["max_depth"])
            clf =  GridSearchCV(ExtraTreeClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "ExtraTreesClassifier"):
            #clf = ExtraTreesClassifier(n_estimators=parms["n_estimators"])
            clf =  GridSearchCV(ExtraTreesClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "GaussianMixture"):
            #clf = GaussianMixture(n_components=parms["n_components"])
            clf =  GridSearchCV(GaussianMixture(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "GaussianNB"):
            #clf = GaussianNB(var_smoothing=parms["var_smoothing"])
            clf =  GridSearchCV(GaussianNB(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "GaussianProcessClassifier"):
            #clf = GaussianProcessClassifier(n_restarts_optimizer=parms["n_restarts_optimizer"])
            clf =  GridSearchCV(GaussianProcessClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "GradientBoostingClassifier"):
            #clf = GradientBoostingClassifier(n_estimators=parms["n_estimators"])
            clf =  GridSearchCV(GradientBoostingClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "KNeighborsClassifier"):
            #clf = KNeighborsClassifier(n_neighbors=parms["n_neighbors"])
            clf =  GridSearchCV(KNeighborsClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "LabelPropagation"):
            #clf = LabelPropagation(n_neighbors=parms["n_neighbors"])
            clf =  GridSearchCV(LabelPropagation(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "LabelSpreading"):
            #clf = LabelSpreading(n_neighbors=parms["n_neighbors"])
            clf =  GridSearchCV(LabelSpreading(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "LinearDiscriminantAnalysis"):
            #clf = LinearDiscriminantAnalysis(n_components=parms["n_components"])
            clf =  GridSearchCV(LinearDiscriminantAnalysis(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "LogisticRegression"):
            #clf = LogisticRegression(max_iter=parms["max_iter"])
            clf =  GridSearchCV(LogisticRegression(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "LogisticRegressionCV"):
            #clf = LogisticRegressionCV(max_iter=parms["max_iter"])
            clf =  GridSearchCV(LogisticRegressionCV(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "MLPClassifier"):
            #clf = MLPClassifier(max_iter=parms["max_iter"])
            clf =  GridSearchCV(MLPClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "MultinomialNB"):
            #clf = MultinomialNB(alpha=parms["alpha"])
            clf =  GridSearchCV(MultinomialNB(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "NuSVC"):
            #clf = NuSVC(max_iter=parms["max_iter"])
            clf =  GridSearchCV(NuSVC(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "QuadraticDiscriminantAnalysis"):
            #clf = QuadraticDiscriminantAnalysis(tol=parms["tol"])
            clf =  GridSearchCV(QuadraticDiscriminantAnalysis(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "RandomForestClassifier"):
            #clf = RandomForestClassifier(n_estimators=parms["n_estimators"])
            clf =  GridSearchCV(RandomForestClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "SGDClassifier"):
            #clf = SGDClassifier(alpha=parms["alpha"])
            clf =  GridSearchCV(SGDClassifier(), parms, cv=cv_count, scoring='precision')
        elif(algorithm == "SVC"):
            #clf = SVC(max_iter=parms["max_iter"])
            clf =  GridSearchCV(SVC(), parms, cv=cv_count, scoring='precision')
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
    scores = model_selection.cross_val_score(clf, X, y, cv=cv_count)

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


