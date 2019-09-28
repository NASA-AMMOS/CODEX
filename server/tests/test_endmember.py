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
from api.endmember      import ml_endmember
from fixtures           import testData

def test_ml_endmember(capsys, testData):


    cache = get_cache(DOCTEST_SESSION)

    # Missing algorithmType
    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "kmean", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=cache)

    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=cache)

    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'q':4, 'numSkewers':5}, {}, session=cache)

    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'numSkewers':5}, {}, session=cache)



