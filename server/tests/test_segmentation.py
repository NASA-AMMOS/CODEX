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

from api.sub.hash          import DOCTEST_SESSION
from api.sub.hash          import get_cache
from api.segmentation      import ml_segmentation
from api.segmentation      import codex_segmentation_quickshift, codex_segmentation_felzenszwalb
from fixtures              import testData

def test_ml_segmentation(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    # Standard use
    result = ml_segmentation(testData['inputHash'], testData['hashList'], None, "felzenszwalb", False, {'scale': 3, 'sigma': 7, 'min_size': 10, 'downsampled': 500}, {}, session=ch)

    # Scale cannot be cast
    result = ml_segmentation(testData['inputHash'], testData['hashList'], None, "felzenszwalb", False, {'scale': "string", 'sigma': 7, 'min_size': 10, 'downsampled': 500}, {}, session=ch)

    # Sigma cannot be cast
    result = ml_segmentation(testData['inputHash'], testData['hashList'], None, "felzenszwalb", False, {'scale': 3, 'sigma': "String", 'min_size': 10, 'downsampled': 500}, {}, session=ch)

    # min_size incorrectly called min_scale
    result = ml_segmentation(testData['inputHash'], testData['hashList'], None, "felzenszwalb", False, {'scale': 3, 'sigma': 7, 'min_scale': 10, 'downsampled': 500}, {}, session=ch)

    # incorrect algorithmType
    result = ml_segmentation(testData['inputHash'], testData['hashList'], None, "felzenszwa", False, {'scale': 3, 'sigma': 7, 'min_size': 10, 'downsampled': 500}, {}, session=ch)

def test_codex_segmentation_quickshift(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    segments = codex_segmentation_quickshift(testData['inputHash'], False, 50, 20.0, 5.0, 2.0, session=ch)


def test_codex_segmentation_felzenszwalb(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    segments = codex_segmentation_felzenszwalb(testData['inputHash'], False, 50, 3.0, 0.95, 3, session=ch)
