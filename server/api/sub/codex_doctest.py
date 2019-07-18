'''
Author: Jack Lightholder
Date  : 3/5/18

Brief : Functions to support doctesting CODEX

Notes :
'''
import os
import sys
# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

# Python Libraries
import numpy as np
import random

# CODEX Support
import codex_read_data_api

def doctest_get_image_path():

    return (CODEX_ROOT + '/uploads/test_image.JPG')


def doctest_get_data(session=None):
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

    Examples:
        >>> testData = doctest_get_data()

        >>> print(testData['inputHash'])
        34a8c666b260c3968ad2a2010eef03fe4f80e21e
    '''
    from codex_hash import get_cache, DOCTEST_SESSION

    codex_hash = get_cache(DOCTEST_SESSION if session is None else session)

    featureList = ['TiO2', 'FeOT', 'SiO2', 'Total']
    hashList, featureList = codex_read_data_api.codex_read_csv(CODEX_ROOT + '/uploads/doctest.csv', featureList, "feature", session=codex_hash)

    # merge 1d arrays to nd-array
    data = codex_hash.mergeHashResults(hashList)
    samples, features = data.shape

    inputHash = codex_hash.hashArray('Merged', data, "feature")

    template = np.zeros(samples)
    templateHashDictionary = codex_hash.hashArray("template", template, "feature")
    templateHash = templateHashDictionary['hash']

    labelHash = codex_read_data_api.codex_read_csv(CODEX_ROOT + '/uploads/doctest.csv', ["labels"], "feature", session=codex_hash)
    labelHash = labelHash[0][0]

    regrLabelData = []
    random.seed(50)

    for j in range(samples): 
        regrLabelData.append(random.randint(0, 10))

    regrLabelData = np.asarray(regrLabelData)
    regrLabelDictionary = codex_hash.hashArray("regrLabelHash", regrLabelData, "feature")
    regrLabelHash = regrLabelDictionary['hash']

    return {"inputHash":inputHash['hash'], 'featureNames':featureList, "hashList":hashList, "templateHash": templateHash, "classLabelHash":labelHash, "regrLabelHash": regrLabelHash}
    
def run_codex_doctest():

    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)

if __name__ == "__main__":

    run_codex_doctest()




