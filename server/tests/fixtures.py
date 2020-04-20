'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys
import random

import numpy as np

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

# CODEX Support
from api.sub.read_data import codex_read_csv

@pytest.fixture
def testData(session=None):
    '''
    Inputs:
        None

    Outputs:
        None

    Notes:
        doctest function to streamline data ingestion for use
        in clustering unit tests

        TODO - labels are currently stashed in features due to front-end limitations.  
                Need to convert here when they get moved to their own class.

    '''
    from api.sub.hash import get_cache, DOCTEST_SESSION

    cache = get_cache(DOCTEST_SESSION if session is None else session)

    featureList = ['TiO2', 'FeOT', 'SiO2', 'Total']
    hashList, featureList = codex_read_csv(CODEX_ROOT + '/uploads/doctest.csv', featureList, "feature", session=cache)
    
    # merge 1d arrays to nd-array
    data = cache.mergeHashResults(hashList)
    samples, features = data.shape

    inputHash = cache.hashArray('Merged', data, "feature")

    template = np.zeros(samples)
    templateHashDictionary = cache.hashArray("template", template, "feature")
    templateHash = templateHashDictionary['hash']

    labelHash = codex_read_csv(CODEX_ROOT + '/uploads/doctest.csv', ["labels"], "feature", session=cache)
    labelHash = labelHash[0][0]

    regrLabelData = []
    random.seed(50)

    for j in range(samples): 
        regrLabelData.append(random.randint(0, 10))

    regrLabelData = np.asarray(regrLabelData)
    regrLabelDictionary = cache.hashArray("regrLabelHash", regrLabelData, "feature")
    regrLabelHash = regrLabelDictionary['hash']

    return {"inputHash":inputHash['hash'], 'featureNames':featureList, "hashList":hashList, "templateHash": templateHash, "classLabelHash":labelHash, "regrLabelHash": regrLabelHash}
    
