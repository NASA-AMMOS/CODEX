'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Peak detection algorithms, formatted for CODEX

Notes : 

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
## Enviornment variable for setting CODEX root directory.
CODEX_ROOT  = os.getenv('CODEX_ROOT')
import sys
sys.path.insert(1,CODEX_ROOT + '/api/sub/')

import numpy as np
import math, statistics
import traceback

import codex_doctest, codex_hash
import codex_system

DEBUG = False

def ml_normalize(hashList, subsetHashName, algorithmName, downsampled, parms, result):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> (inputHash, hashList, template, labelHash) = codex_doctest.doctest_get_data()

    '''

    data = codex_hash.mergeHashResults(hashList)
    inputHash = codex_hash.hashArray('Merged', data, "feature")	
    if(inputHash != None):
        inputHash = inputHash["hash"]
    else:
        codex_system.codex_log("Feature hash failure in ml_cluster")
        result['message'] = "Feature hash failure in ml_cluster"
        return None

    if(subsetHashName != None):
        subsetHash = codex_hash.findHashArray("name", subsetHashName,"subset")
        if(subsetHash == None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    if(algorithmName == 'min_max'):
        try:
            minRange = int(parms['min'])
        except:
            codex_system.codex_log("min parameter not set")
            result['message'] = "min parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            maxRange = int(parms['max'])
        except:
            codex_system.codex_log("max parameter not set")
            result['message'] = "max parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            # TODO - fix
            result = codex_normalize_min_max(inputHash,minRange,maxRange)
        except:
            codex_system.codex_log("Failed to run regression algorithm")
            result['message'] = "Failed to run regression algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    else:
        result['message'] = "Cannot find requested normalization algorithm"

    return result


def codex_normalize_min_max(inputHash, minRange, maxRange):
    '''
    Inuputs:

    Outputs:

    Examples:

    '''
    # TODO - fix
    return None
    maxVal = max(X)
    minVal = min(X)

    X_ = ((X - minVal)/(maxVal - minVal)) * (maxRange-minRange) + minRange
    print(X_)

def codex_n(X):
    '''
    Inuputs:

    Outputs:

    Examples:

    '''
    dp = X[0]
    length = len(X)

    max_value = max(X)
    print("Max: " + str(max_value))

    min_value = min(X)
    print("Min: " + str(min_value))

    mean_value = statistics.mean(X)
    print("Mean: " + str(mean_value))

    if(type(dp) is int):

        median_value = statistics.median(X)
        print("Median: " + str(median_value))

        try:
            mode_value = statistics.mode(X)
            print("Mode: " + str(mode_value))
        except statistics.StatisticsError:
            mode_value = None

if __name__ == "__main__":

    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)



