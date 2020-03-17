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

from api.sub.hash             import DOCTEST_SESSION
from api.sub.hash             import get_cache
from api.dimmension_reduction import *
from fixtures                 import testData

def test_dimension_reduction(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    result = dimension_reduction(testData['inputHash'], None, testData['featureNames'], testData['hashList'], None, False, "PCA", False, {"n_components":2}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'

    result = dimension_reduction(testData['inputHash'], None, testData['featureNames'], testData['hashList'], None, False, "ICA", False, {"n_components":2}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'