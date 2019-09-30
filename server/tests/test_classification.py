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

def test_classification(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    # Standard use - AdaBoostClassifier classifier
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "AdaBoostClassifier",           False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - BaggingClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "BaggingClassifier",            False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - BayesianGaussianMixture classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "BayesianGaussianMixture",      False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - BernoulliNB classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "BernoulliNB",                  False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - CalibratedClassifierCV classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "CalibratedClassifierCV",       False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - ComplementNB classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "ComplementNB",                 False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - DecisionTreeClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "DecisionTreeClassifier",       False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - ExtraTreeClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "ExtraTreeClassifier",          False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - ExtraTreesClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "ExtraTreesClassifier",         False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - GaussianMixture classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "GaussianMixture",              False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - GaussianNB classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "GaussianNB",                   False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - GaussianProcessClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "GaussianProcessClassifier",    False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - GradientBoostingClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "GradientBoostingClassifier",   False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - KNeighborsClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "KNeighborsClassifier",         False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - LabelPropagation classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "LabelPropagation",             False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - LabelSpreading classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "LabelSpreading",               False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - LinearDiscriminantAnalysis classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "LinearDiscriminantAnalysis",   False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - LogisticRegression classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "LogisticRegression",           False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - LogisticRegressionCV classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "LogisticRegressionCV",         False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - MLPClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "MLPClassifier",                False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - MultinomialNB classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "MultinomialNB",                False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - NuSVC classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "NuSVC",                         False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - QuadraticDiscriminantAnalysis classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "QuadraticDiscriminantAnalysis", False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - RandomForestClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "RandomForestClassifier",        False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - SGDClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "SGDClassifier",                 False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - SVC classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "SVC",                           False, {}, 'accuracy', "grid", 3, {}, session=ch).run()
    assert result['message'] == 'success'







    # Standard use - AdaBoostClassifier classifier
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "AdaBoostClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - BaggingClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "BaggingClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - BayesianGaussianMixture classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "BayesianGaussianMixture", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - BernoulliNB classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "BernoulliNB", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - CalibratedClassifierCV classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "CalibratedClassifierCV", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - ComplementNB classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "ComplementNB", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - DecisionTreeClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "DecisionTreeClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - ExtraTreeClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "ExtraTreeClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - ExtraTreesClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "ExtraTreesClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - GaussianMixture classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "GaussianMixture", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - GaussianNB classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "GaussianNB", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - GaussianProcessClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "GaussianProcessClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - GradientBoostingClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "GradientBoostingClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - KNeighborsClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "KNeighborsClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - LabelPropagation classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "LabelPropagation", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - LabelSpreading classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "LabelSpreading", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - LinearDiscriminantAnalysis classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "LinearDiscriminantAnalysis", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - LogisticRegression classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "LogisticRegression", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - LogisticRegressionCV classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "LogisticRegressionCV", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - MLPClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "MLPClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - MultinomialNB classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "MultinomialNB", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - NuSVC classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "NuSVC", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - QuadraticDiscriminantAnalysis classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "QuadraticDiscriminantAnalysis", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - RandomForestClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "RandomForestClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - SGDClassifier classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "SGDClassifier", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'

    # Standard use - SVC classification
    result = classification(testData['inputHash'], testData['hashList'], testData['regrLabelHash'], False, "SVC", False, {}, 'accuracy', "random", 3, {}, session=ch).run()
    assert result['message'] == 'success'




