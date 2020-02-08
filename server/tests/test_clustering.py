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
from api.clustering     import *
from fixtures           import testData

def test_clustering(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    result = clustering(testData['inputHash'], testData['hashList'], None, False, "kmean",                False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'failure'
    assert result['WARNING'] == 'kmean algorithm not supported'

    result = clustering(testData['inputHash'], testData['hashList'], None, False, "kmeans",               False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'

    result = clustering(testData['inputHash'], testData['hashList'], None, False, "mean_shift",           False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'

    result = clustering(testData['inputHash'], testData['hashList'], None, False, "birch",                False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'

    result = clustering(testData['inputHash'], testData['hashList'], None, False, "ward",                 False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'

    result = clustering(testData['inputHash'], testData['hashList'], None, False, "spectral",             False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'

    result = clustering(testData['inputHash'], testData['hashList'], None, False, "dbscan",               False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'

    result = clustering(testData['inputHash'], testData['hashList'], None, False, "agglomerative",        False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'

    result = clustering(testData['inputHash'], testData['hashList'], None, False, "affinity_propagation", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, None, "direct", None, {}, ch).run()
    assert result['message'] == 'success'



