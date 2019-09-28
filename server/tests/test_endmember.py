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
from api.endmember      import codex_ATGP, codex_FIPPI, codex_PPI
from fixtures           import testData

def test_ml_endmember(capsys, testData):


    ch = get_cache(DOCTEST_SESSION)

    # Missing algorithmType
    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "kmean", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=ch)

    #result = ml_endmember(testData['inputHash'], testData['hashList'], None, "ATGP", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=ch)

    #result = ml_endmember(testData['inputHash'], testData['hashList'], None, "PPI", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=ch)

    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=ch)

    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'q':4, 'numSkewers':5}, {}, session=ch)

    # inputHash == None
    result = ml_endmember(testData['inputHash'], None, None, "FIPPI", False, {'downsampled': 500, 'q':4, 'numSkewers':5}, {}, session=ch)

    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'numSkewers':5}, {}, session=ch)


def test_codex_ATGP(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    #result = codex_ATGP(testData['inputHash'], False, 3, False, session=ch)

def test_codex_FIPPI(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    #result = codex_FIPPI(testData['inputHash'], False, 1, False, session=ch)

def test_codex_PPI(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    #result = codex_PPI(testData['inputHash'], False, 3, 1, False, session=ch)



