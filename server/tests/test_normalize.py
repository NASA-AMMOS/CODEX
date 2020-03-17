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

from api.sub.hash       import get_cache
from api.sub.hash       import DOCTEST_SESSION
from api.normalize      import *
from fixtures           import testData

def test_clustering(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    result = normalize(testData['featureNames'], testData['inputHash'], testData['hashList'], None, False, "test", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'failure'
    assert result['WARNING'] == 'test algorithm not supported'

    result = normalize(testData['featureNames'], testData['inputHash'], testData['hashList'], None, False, "normalize", False, {}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'

    result = normalize(testData['featureNames'], testData['inputHash'], testData['hashList'], None, False, "normalize", False, {}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'