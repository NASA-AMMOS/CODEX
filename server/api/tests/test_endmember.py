import os
import pytest
import sys

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_hash import DOCTEST_SESSION
from api.sub.codex_doctest import doctest_get_data
from api.sub.codex_hash import get_cache
from api.endmember import ml_endmember
from api.endmember import codex_ATGP, codex_FIPPI, codex_PPI

def test_ml_endmember(capsys):


    ch = get_cache(DOCTEST_SESSION)
    testData = doctest_get_data(session=ch)

    # Missing algorithmType
    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "kmean", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=ch)

    #result = ml_endmember(testData['inputHash'], testData['hashList'], None, "ATGP", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=ch)

    #result = ml_endmember(testData['inputHash'], testData['hashList'], None, "PPI", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=ch)

    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=ch)

    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'q':4, 'numSkewers':5}, {}, session=ch)

    # inputHash == None
    result = ml_endmember(testData['inputHash'], None, None, "FIPPI", False, {'downsampled': 500, 'q':4, 'numSkewers':5}, {}, session=ch)

    result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'numSkewers':5}, {}, session=ch)


def test_codex_ATGP(capsys):

    ch = get_cache(DOCTEST_SESSION)
    testData = doctest_get_data(session=ch)

    #result = codex_ATGP(testData['inputHash'], False, 3, False, session=ch)

def test_codex_FIPPI(capsys):

    ch = get_cache(DOCTEST_SESSION)
    testData = doctest_get_data(session=ch)

    #result = codex_FIPPI(testData['inputHash'], False, 1, False, session=ch)

def test_codex_PPI(capsys):

    ch = get_cache(DOCTEST_SESSION)
    testData = doctest_get_data(session=ch)

    #result = codex_PPI(testData['inputHash'], False, 3, 1, False, session=ch)



