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
from api.peak_detection import *
from fixtures           import testData

def test_peak_detection(capsys, testData):
	
    ch = get_cache(DOCTEST_SESSION)

    result = peak_detection(testData['inputHash'], None, testData['featureNames'], testData['hashList'], None, False, "cwt", False, {"peak_width":5, "gap_threshold":2, "min_snr":1, "noise_perc":3}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'
