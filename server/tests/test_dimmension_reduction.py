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

def test_run_codex_dim_reduction(capsys, testData):

	ch = get_cache(DOCTEST_SESSION)

	result = run_dim_reduction(testData['inputHash'], False, {"n_components":2}, False, False, "PCA", session=ch)
	result = run_dim_reduction(testData['inputHash'], False, {"n_components":2}, 500, False, "ICA", session=ch)
