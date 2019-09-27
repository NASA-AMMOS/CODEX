import os
import pytest
import sys

sys.path.insert(1, os.getenv('CODEX_ROOT'))


def test_run_classification(capsys):


        from api.sub.codex_doctest import doctest_get_data
        from api.sub.codex_hash import DOCTEST_SESSION
        from api.sub.codex_hash import get_cache
        from api.classification import run_codex_classification
        
        ch = get_cache(DOCTEST_SESSION)
        testData = doctest_get_data(session=ch)

        result = run_codex_classification(testData['inputHash'], False, testData['classLabelHash'], False, "AdaBoostClassifier", {"n_estimators":[10]}, "grid", 3, 'fake_scoring_metric', session=ch)
        #print(result["WARNING"])
        #fake_scoring_metric not a valid scoring metric for classification.

        result = run_codex_classification(testData['inputHash'], False, testData['classLabelHash'], False, "AdaBoostClassifier", {"n_estimators":[10]}, "grid", 3, 'precision', session=ch)
        #print(result["WARNING"])
        #None