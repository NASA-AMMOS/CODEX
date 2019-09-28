'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

# CODEX Support
from api.sub.read_data  import codex_read_csv
from fixtures           import testData
from api.sub.hash       import DOCTEST_SESSION
from api.sub.hash       import get_cache
from api.classification import *

def test_ml_classification(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    # Standard use - AdaBoostClassifier classifier
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "AdaBoostClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - BaggingClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "BaggingClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - BayesianGaussianMixture classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "BayesianGaussianMixture", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - BernoulliNB classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "BernoulliNB", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - CalibratedClassifierCV classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "CalibratedClassifierCV", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - ComplementNB classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "ComplementNB", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - DecisionTreeClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "DecisionTreeClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - ExtraTreeClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "ExtraTreeClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - ExtraTreesClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "ExtraTreesClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - GaussianMixture classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "GaussianMixture", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - GaussianNB classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "GaussianNB", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - GaussianProcessClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "GaussianProcessClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - GradientBoostingClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "GradientBoostingClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - KNeighborsClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "KNeighborsClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - LabelPropagation classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "LabelPropagation", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - LabelSpreading classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "LabelSpreading", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - LinearDiscriminantAnalysis classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "LinearDiscriminantAnalysis", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - LogisticRegression classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "LogisticRegression", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - LogisticRegressionCV classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "LogisticRegressionCV", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - MLPClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "MLPClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - MultinomialNB classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "MultinomialNB", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - NuSVC classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "NuSVC", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - QuadraticDiscriminantAnalysis classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "QuadraticDiscriminantAnalysis", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - RandomForestClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "RandomForestClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - SGDClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "SGDClassifier", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - SVC classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "SVC", False, {}, 'accuracy', "grid", 3, {}, session=ch)
    assert result['message'] == 'success'







    # Standard use - AdaBoostClassifier classifier
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "AdaBoostClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - BaggingClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "BaggingClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - BayesianGaussianMixture classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "BayesianGaussianMixture", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - BernoulliNB classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "BernoulliNB", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - CalibratedClassifierCV classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "CalibratedClassifierCV", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - ComplementNB classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "ComplementNB", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - DecisionTreeClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "DecisionTreeClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - ExtraTreeClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "ExtraTreeClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - ExtraTreesClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "ExtraTreesClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - GaussianMixture classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "GaussianMixture", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - GaussianNB classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "GaussianNB", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - GaussianProcessClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "GaussianProcessClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - GradientBoostingClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "GradientBoostingClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - KNeighborsClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "KNeighborsClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - LabelPropagation classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "LabelPropagation", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - LabelSpreading classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "LabelSpreading", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - LinearDiscriminantAnalysis classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "LinearDiscriminantAnalysis", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - LogisticRegression classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "LogisticRegression", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - LogisticRegressionCV classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "LogisticRegressionCV", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - MLPClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "MLPClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - MultinomialNB classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "MultinomialNB", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - NuSVC classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "NuSVC", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - QuadraticDiscriminantAnalysis classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "QuadraticDiscriminantAnalysis", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - RandomForestClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "RandomForestClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - SGDClassifier classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "SGDClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'

    # Standard use - SVC classification
    result = ml_classification(testData['inputHash'], testData['hashList'], None, testData['classLabelHash'], "SVC", False, {}, 'accuracy', "random", 3, {}, session=ch)
    assert result['message'] == 'success'








def test_run_classification(capsys, testData):
        
    ch = get_cache(DOCTEST_SESSION)

    result = run_classification(testData['inputHash'], False, testData['classLabelHash'], False, "AdaBoostClassifier", {"n_estimators":[10]}, "grid", 3, 'fake_scoring_metric', session=ch)
    #print(result["WARNING"])
    #fake_scoring_metric not a valid scoring metric for classification.

    result = run_classification(testData['inputHash'], False, testData['classLabelHash'], False, "AdaBoostClassifier", {"n_estimators":[10]}, "grid", 3, 'precision', session=ch)
    #print(result["WARNING"])
    #None



