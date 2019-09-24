'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Peak detection algorithms, formatted for CODEX

Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import traceback
import statistics
import math

import numpy as np

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_system import codex_log
from api.sub.codex_hash   import get_cache

def ml_normalize(
        hashList,
        subsetHashName,
        algorithmName,
        downsampled,
        parms,
        result,
        session=None):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> from codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

    '''
    codex_hash = get_cache(session)

    data = codex_hash.mergeHashResults(hashList)
    inputHash = codex_hash.hashArray('Merged', data, "feature")
    if(inputHash is not None):
        inputHash = inputHash["hash"]
    else:
        codex_log("Feature hash failure in ml_cluster")
        result['message'] = "Feature hash failure in ml_cluster"
        return None

    if(subsetHashName is not None):
        subsetHash = codex_hash.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    if(algorithmName == 'min_max'):
        try:
            minRange = int(parms['min'])
        except BaseException:
            codex_log("min parameter not set")
            result['message'] = "min parameter not set"
            codex_log(traceback.format_exc())
            return None

        try:
            maxRange = int(parms['max'])
        except BaseException:
            codex_log("max parameter not set")
            result['message'] = "max parameter not set"
            codex_log(traceback.format_exc())
            return None

        try:
            # TODO - fix
            result = codex_normalize_min_max(inputHash, minRange, maxRange)
        except BaseException:
            codex_log("Failed to run regression algorithm")
            result['message'] = "Failed to run regression algorithm"
            codex_log(traceback.format_exc())
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

    X_ = ((X - minVal) / (maxVal - minVal)) * (maxRange - minRange) + minRange
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

    if(isinstance(dp, int)):

        median_value = statistics.median(X)
        print("Median: " + str(median_value))

        try:
            mode_value = statistics.mode(X)
            print("Mode: " + str(mode_value))
        except statistics.StatisticsError:
            mode_value = None


if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()

    
