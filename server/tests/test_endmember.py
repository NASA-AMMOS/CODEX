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

from api.sub.hash       import DOCTEST_SESSION
from api.sub.hash       import get_cache
from api.endmember      import *
from fixtures           import testData

#inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, session
def test_ml_endmember(capsys, testData):


    cache = get_cache(DOCTEST_SESSION)

    # Missing algorithmType
    result = endmember(testData['inputHash'], testData['hashList'], None, False, "kmean", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, None, "direct", None, {}, cache).run()
    assert result['message'] == 'failure'
    assert result['WARNING'] == 'kmean algorithm not supported'

    result = endmember(testData['inputHash'], testData['hashList'], None, False, "ATGP", False, {'q':5, 'numSkewers':5}, None, "direct", None, {}, cache).run()
    assert result['message'] == 'success'

    result = endmember(testData['inputHash'], testData['hashList'], None, False, "FIPPI", False, {'q':4, 'numSkewers':5}, None, "direct", None, {}, cache).run()
    assert result['message'] == 'success'
    
    result = endmember(testData['inputHash'], testData['hashList'], None, False, "PPI", False, {'q':4, 'numSkewers':5}, None, "direct", None, {}, cache).run()
    assert result['message'] == 'success'


