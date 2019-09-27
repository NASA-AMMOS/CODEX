import os
import pytest
import sys

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_doctest import doctest_get_data
from api.sub.codex_hash import get_cache
from api.sub.codex_hash import DOCTEST_SESSION
from api.clustering import ml_cluster

def test_ml_cluster(capsys):

    ch = get_cache(DOCTEST_SESSION)
    testData = doctest_get_data()

    result = ml_cluster(testData['inputHash'], testData['hashList'], None, "kmean", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=ch)
    result = ml_cluster(testData['inputHash'], testData['hashList'], None, "kmeans", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=ch)
    result = ml_cluster(testData['inputHash'], testData['hashList'], None, "mean_shift", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=ch)
    result = ml_cluster(testData['inputHash'], testData['hashList'], None, "birch", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=ch)
    result = ml_cluster(testData['inputHash'], testData['hashList'], None, "ward", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=ch)
    result = ml_cluster(testData['inputHash'], testData['hashList'], None, "spectral", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=ch)
    result = ml_cluster(testData['inputHash'], testData['hashList'], None, "dbscan", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=ch)
    result = ml_cluster(testData['inputHash'], testData['hashList'], None, "agglomerative", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=ch)
    result = ml_cluster(testData['inputHash'], testData['hashList'], None, "affinity_propagation", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=ch)




