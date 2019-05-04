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
from numpy.random import randint
import numpy as np

# CODEX Support
import codex_hash
import codex_read_data_api

def doctest_get_image_path():

    return (CODEX_ROOT + '/uploads/test_image.JPG')


def doctest_get_data():
    '''
    Inputs:
        None

    Outputs:
        None

    Notes:
        doctest function to streamline data ingestion for use
        in clustering unit tests

    Examples:
        >>> (result, hashList, template, labelHash) = doctest_get_data()

        >>> print(result)
        0d07e87434cda0012b55ae432cb612367c6a82c1
    '''
    featureList = ['TiO2', 'FeOT', 'SiO2', 'Total']
    hashList, featureList = codex_read_data_api.codex_read_csv(CODEX_ROOT + '/uploads/doctest.csv', featureList, "feature")
    
    # merge 1d arrays to nd-array
    data = codex_hash.mergeHashResults(hashList)
    samples, features = data.shape

    inputHash = codex_hash.hashArray('Merged', data, "feature")

    template = np.zeros(samples)
    templateHashDictionary = codex_hash.hashArray("template", template, "feature")
    templateHash = templateHashDictionary['hash']

    labelHash = codex_read_data_api.codex_read_csv(CODEX_ROOT + '/uploads/doctest.csv', ["labels"], "feature")
    labelHash = labelHash[0][0]

    #codex_hash.printHashList("feature")
    #hashDict = codex_hash.findHashArray("name", "labels", "label")
    #print(hashDict)

    return (inputHash['hash'], hashList, templateHash, labelHash)
    

if __name__ == "__main__":

    #import doctest
    #results = doctest.testmod(verbose=True, optionflags=doctest.ELLIPSIS)
    #sys.exit(results.failed)

    doctest_get_data()

