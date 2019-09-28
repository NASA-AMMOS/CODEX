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
import time
import inspect
import traceback
import random
import json
import logging

import numpy as np

from sklearn                        import model_selection
from sklearn.model_selection        import GridSearchCV
from sklearn.model_selection        import RandomizedSearchCV
from sklearn.metrics                import confusion_matrix
from sklearn.ensemble               import AdaBoostClassifier
from sklearn.ensemble               import BaggingClassifier
from sklearn.mixture                import BayesianGaussianMixture
from sklearn.naive_bayes            import BernoulliNB
from sklearn.calibration            import CalibratedClassifierCV
from sklearn.naive_bayes            import ComplementNB
from sklearn.tree                   import DecisionTreeClassifier
from sklearn.ensemble               import ExtraTreesClassifier
from sklearn.tree                   import ExtraTreeClassifier
from sklearn.mixture                import GaussianMixture
from sklearn.naive_bayes            import GaussianNB
from sklearn.gaussian_process       import GaussianProcessClassifier
from sklearn.ensemble               import GradientBoostingClassifier
from sklearn.neighbors              import KNeighborsClassifier
from sklearn.semi_supervised        import LabelPropagation
from sklearn.semi_supervised        import LabelSpreading
from sklearn.discriminant_analysis  import LinearDiscriminantAnalysis
from sklearn.linear_model           import LogisticRegression
from sklearn.linear_model           import LogisticRegressionCV
from sklearn.neural_network         import MLPClassifier
from sklearn.naive_bayes            import MultinomialNB
from sklearn.svm                    import NuSVC
from sklearn.discriminant_analysis  import QuadraticDiscriminantAnalysis
from sklearn.ensemble               import RandomForestClassifier
from sklearn.linear_model           import SGDClassifier
from sklearn.svm                    import SVC

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.sub.return_code       import logReturnCode
from api.sub.codex_math        import impute
from api.sub.time_log          import logTime
from api.sub.time_log          import getComputeTimeEstimate
from api.sub.downsample        import downsample
from api.sub.hash              import get_cache

def ml_classification(
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
        result,
        session=None):
    '''
    Inputs:

    Outputs:

    '''
    ch = get_cache(session)

    if len(hashList) < 2:
        logging.warning("Classification requires >= 2 features.")
        return None

    if subsetHashName is not None:
        subsetHash = cache.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    try:
        result = run_codex_classification(inputHash, subsetHashName, labelHash, downsampled, algorithmName, parms, search_type, cross_val, scoring, session=session)
        logging.warning("Completed classification run with warnings: {r}".format(r=result["WARNING"]))
    except BaseException:
        logging.warning("Failed to run classification algorithm")
        result['message'] = "Failed to run classification algorithm"
        logging.warning(traceback.format_exc())
        return None

    return result

def run_codex_classification(inputHash, subsetHash, labelHash, downsampled, algorithm,  parms, search_type, cross_val, scoring, session=None):
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

    Notes:
        Scoring Metrics: https://scikit-learn.org/stable/modules/model_evaluation.html#scoring-parameter

    '''
    cache = get_cache(session)
    logReturnCode(inspect.currentframe())
    startTime = time.time()
    result = {'algorithm': algorithm,
              'downsample': downsampled,
              'cross_val': cross_val,
              'scoring': scoring,
              'WARNING': "None"}

    returnHash = cache.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        logging.warning("Classification: {algorithm}: Hash not found. Returning!".format(algorithm=algorithm))
        return None

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False and subsetHash is not None:
        data = cache.applySubsetMask(data, subsetHash)
        if(data is None):
            logging.warning("ERROR: run_codex_classification - subsetHash returned None.")
            return None
            
    full_samples = len(data)
    if downsampled is not False:
        logging.warning("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = downsample(data, percentage=downsampled, session=session)

    if data.ndim < 2:
        logging.warning("ERROR: run_codex_classification - insufficient data dimmensions")
        return None

    X = data
    X = impute(X)
    result['X'] = X.tolist()

    result['eta'] = getComputeTimeEstimate("classification", algorithm, full_samples)

    accepted_scoring_metrics = ["accuracy", "balanced_accuracy", "average_precision", "brier_score_loss", "f1, f1_micro", "f1_macro", "f1_weighted", "f1_samples", "neg_log_loss", "precision", "recall", "jaccard", "roc_auc"]
    if scoring not in accepted_scoring_metrics:
        result["WARNING"] = "{scoring} not a valid scoring metric for classification.".format(scoring=scoring)
        return result

    # TODO - labels are currently cached under features
    labelHash_dict = cache.findHashArray("hash", labelHash, "feature")
    if labelHash_dict is None:
        logging.warning("label hash {hash} not found. Returning!".format(hash=labelHash))
        return {'algorithm': algorithm,
                'downsample': downsampled,
                'cross_val': cross_val,
                'scoring': scoring,
                'WARNING': "Label not found in database."}
    else:
        y = labelHash_dict['data']
        result['y'] = y.tolist()

        unique, counts = np.unique(y, return_counts=True)
        count_dict = dict(zip(unique, counts))
        if any(v < cross_val for v in count_dict.values()):
            count_dict = dict(zip(unique.astype(str), counts.astype(str)))
            return {'algorithm': algorithm,
                    'cross_val': cross_val,
                    'downsample': downsampled,
                    'counts': json.dumps(count_dict),
                    'scoring': scoring,
                    'WARNING': "Label class has less samples than cross val score"}         

    try:

        if(algorithm == "AdaBoostClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(AdaBoostClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf = GridSearchCV(AdaBoostClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "BaggingClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(BaggingClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(BaggingClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "BayesianGaussianMixture"):

            if search_type == "random":
                clf = RandomizedSearchCV(BayesianGaussianMixture(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(BayesianGaussianMixture(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "BernoulliNB"):

            if search_type == "random":
                clf = RandomizedSearchCV(BernoulliNB(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(BernoulliNB(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "CalibratedClassifierCV"):

            if search_type == "random":
                clf = RandomizedSearchCV(CalibratedClassifierCV(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(CalibratedClassifierCV(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "ComplementNB"):

            if search_type == "random":
                clf = RandomizedSearchCV(ComplementNB(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(ComplementNB(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "DecisionTreeClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(DecisionTreeClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(DecisionTreeClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "ExtraTreeClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(ExtraTreeClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(ExtraTreeClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "ExtraTreesClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(ExtraTreesClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(ExtraTreesClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "GaussianMixture"):

            if search_type == "random":
                clf = RandomizedSearchCV(GaussianMixture(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(GaussianMixture(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "GaussianNB"):

            if search_type == "random":
                clf = RandomizedSearchCV(GaussianNB(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(GaussianNB(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "GaussianProcessClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(GaussianProcessClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(GaussianProcessClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "GradientBoostingClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(GradientBoostingClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(GradientBoostingClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "KNeighborsClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(KNeighborsClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(KNeighborsClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LabelPropagation"):

            if search_type == "random":
                clf = RandomizedSearchCV(LabelPropagation(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(LabelPropagation(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LabelSpreading"):

            if search_type == "random":
                clf = RandomizedSearchCV(LabelSpreading(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(LabelSpreading(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LinearDiscriminantAnalysis"):

            if search_type == "random":
                clf = RandomizedSearchCV(LinearDiscriminantAnalysis(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(LinearDiscriminantAnalysis(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LogisticRegression"):

            if search_type == "random":
                clf = RandomizedSearchCV(LogisticRegression(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(LogisticRegression(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "LogisticRegressionCV"):

            if search_type == "random":
                clf = RandomizedSearchCV(LogisticRegressionCV(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(LogisticRegressionCV(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "MLPClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(MLPClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(MLPClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "MultinomialNB"):

            if search_type == "random":
                clf = RandomizedSearchCV(MultinomialNB(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(MultinomialNB(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "NuSVC"):

            if search_type == "random":
                clf = RandomizedSearchCV(NuSVC(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(NuSVC(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "QuadraticDiscriminantAnalysis"):

            if search_type == "random":
                clf = RandomizedSearchCV(QuadraticDiscriminantAnalysis(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(QuadraticDiscriminantAnalysis(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "RandomForestClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(RandomForestClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(RandomForestClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "SGDClassifier"):

            if search_type == "random":
                clf = RandomizedSearchCV(SGDClassifier(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(SGDClassifier(), parms, cv=cross_val, scoring=scoring)

        elif(algorithm == "SVC"):

            if search_type == "random":
                clf = RandomizedSearchCV(SVC(), parms, cv=cross_val, scoring=scoring)
            else:
                clf =  GridSearchCV(SVC(), parms, cv=cross_val, scoring=scoring)

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
                'cross_val': cross_val,
                'downsample': downsampled,
                'scoring': scoring,
                'WARNING': traceback.format_exc()}

    clf.fit(X,y)
    y_pred = clf.predict(X)

    cm = confusion_matrix(y, y_pred)
    cm = np.round((cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]) * 100)
    result['cm_data'] = cm.tolist()
    result['classes'] = np.unique(y).tolist()

    result["best_parms"] = clf.best_params_
    result["best_score"] = clf.best_score_

    # TODO - The front end should specify a save name for the model
    model_name = algorithm +  "_" + str(random.random())
    model_dict = cache.saveModel(model_name, clf.best_estimator_, "classifier")
    if not model_dict:
        result['WARNING'] = "Model could not be saved."
    else:   
        result['model_name'] = model_dict['name']
        result['model_hash'] = model_dict['hash']

    endTime = time.time()
    computeTime = endTime - startTime
    logTime(
        "classification",
        algorithm,
        computeTime,
        len(X),
        X.ndim)

    return result


