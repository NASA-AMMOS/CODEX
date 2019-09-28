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
from api.classification import run_codex_classification

def test_run_classification(capsys, testData):
        
        ch = get_cache(DOCTEST_SESSION)

        result = run_codex_classification(testData['inputHash'], False, testData['classLabelHash'], False, "AdaBoostClassifier", {"n_estimators":[10]}, "grid", 3, 'fake_scoring_metric', session=ch)
        #print(result["WARNING"])
        #fake_scoring_metric not a valid scoring metric for classification.

        result = run_codex_classification(testData['inputHash'], False, testData['classLabelHash'], False, "AdaBoostClassifier", {"n_estimators":[10]}, "grid", 3, 'precision', session=ch)
        #print(result["WARNING"])
        #None