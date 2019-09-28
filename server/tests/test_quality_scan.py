'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.hash          import DOCTEST_SESSION
from api.sub.hash          import get_cache
from api.quality_scan      import ml_quality_scan
from api.quality_scan      import codex_count_oddities, codex_column_correlation, codex_column_threshold
from fixtures              import testData

def test_ml_quality_scan(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    result = ml_quality_scan(testData['inputHash'], testData['hashList'], None, "oddities", False, {'sigma': 3, 'inside': True}, {}, session=ch)

    result = ml_quality_scan(testData['inputHash'], testData['hashList'], None, "sigma_data", False, {'sigma': 3, 'inside': True}, {}, session=ch)

def test_codex_count_oddities(capsys, testData):

    # integer example
    ch = get_cache(DOCTEST_SESSION)

    #>>> dictionary = codex_count_oddities(testData['inputHash'], False)

    #dictionary = codex_count_oddities(None,False, session=ch)
    #Error: codex_count_oddities: Hash not found

def test_codex_get_sigma_data(capsys, testData):

    # collect data inside sigma range
    ch = get_cache(DOCTEST_SESSION)

def test_codex_column_correlation(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    results = codex_column_correlation(testData['inputHash'], False, session=ch)

def test_codex_column_threshold(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    dictionary = codex_column_threshold(testData['inputHash'], False, 0, 0.000394, session=ch)
    #print(dictionary["threshold_max"])
    #0.000394


