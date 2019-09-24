'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Dimmensionality reduction algorithms, formatted for CODEX

Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import sys
import os
import traceback
import pysptools.eea.eea
import pysptools.eea
import time
import inspect

import numpy as np

from sklearn.preprocessing import StandardScaler
from sklearn.neighbors import kneighbors_graph
from sklearn import cluster, datasets
from random import randint
from scipy import misc

sys.path.insert(1, os.getenv('CODEX_ROOT'))

# CODEX Support
from api.sub.codex_math        import codex_impute
from api.sub.codex_downsample  import downsample
from api.sub.codex_system      import codex_log
from api.sub.codex_time_log    import getComputeTimeEstimate
from api.sub.codex_time_log    import logTime
from api.sub.codex_return_code import logReturnCode
from api.sub.codex_hash        import get_cache


def ml_endmember(
        inputHash,
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

    # Missing algorithmType
    >>> result = ml_endmember(testData['inputHash'], testData['hashList'], None, "kmean", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=codex_hash)
    Cannot find requested endmember algorithm

    >>> result = ml_endmember(testData['inputHash'], testData['hashList'], None, "ATGP", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=codex_hash)

    >>> result = ml_endmember(testData['inputHash'], testData['hashList'], None, "PPI", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=codex_hash)

    >>> result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {}, session=codex_hash)
    WARNING: q must be <= to number of features

    >>> result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'q':4, 'numSkewers':5}, {}, session=codex_hash)

    # inputHash == None
    >>> result = ml_endmember(testData['inputHash'], None, None, "FIPPI", False, {'downsampled': 500, 'q':4, 'numSkewers':5}, {}, session=codex_hash)

    # q not set
    >>> result = ml_endmember(testData['inputHash'], testData['hashList'], None, "FIPPI", False, {'downsampled': 500, 'numSkewers':5}, {}, session=codex_hash)
    q parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'q'
    <BLANKLINE>
    '''
    codex_hash = get_cache(session)

    if(subsetHashName is not None):
        subsetHash = codex_hash.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    try:
        q = int(parms['q'])
    except BaseException:
        codex_log("q parameter not set")
        result['message'] = "q parameter not set"
        codex_log(traceback.format_exc())
        return result

    if(algorithmName == "ATGP"):
        try:
            result = codex_ATGP(inputHash, subsetHash, q, downsampled, session=codex_hash)
        except BaseException:
            codex_log("Failed to run ATGP endmember algorithm")
            result['message'] = "Failed to run ATGP endmember algorithm"
            codex_log(traceback.format_exc())
            return result

    elif(algorithmName == "FIPPI"):
        try:
            result = codex_FIPPI(inputHash, subsetHash, q, downsampled, session=codex_hash)
        except BaseException:
            codex_log("Failed to run FIPPI endmember algorithm")
            result['message'] = "Failed to run FIPPI endmember algorithm"
            codex_log(traceback.format_exc())
            return result

    elif(algorithmName == "PPI"):

        try:
            numSkewers = int(parms["numSkewers"])
        except BaseException:
            codex_log("numSkewers parameter not set")
            result['message'] = "numSkewers parameter not set"
            codex_log(traceback.format_exc())
            return result

        try:
            result = codex_PPI(
                inputHash,
                subsetHash,
                q,
                numSkewers,
                downsampled,
                session=codex_hash)
        except BaseException:
            codex_log("Failed to run PPI endmember algorithm")
            result['message'] = "Failed to run PPI endmember algorithm"
            codex_log(traceback.format_exc())
            return result

    else:
        codex_log("Cannot find requested endmember algorithm")
        result['message'] = "Cannot find requested endmember algorithm"
        return result

    return result


def codex_ATGP(inputHash, subsetHash, q, downsampled, session=None):
    '''
    Inputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)
        q  (int)  			 - Number of endmembers to be induced (positive integer > 0)

    Outputs:
        Dictionary -
            endmember_array  - Set of induced endmembers (N x p)
            endmember_vector - Array of indices into the array data corresponding to the induced endmembers

    Examples:
    >>> from codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

    >>> result = codex_ATGP(testData['inputHash'], False, 3, False, session=codex_hash)
    '''
    codex_hash = get_cache(session)

    logReturnCode(inspect.currentframe())
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_log("Hash not found. Returning!")
        return None

    data = returnHash['data']

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_log("ERROR: codex_endmembers - ATGP - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_log("Downsampling to " + str(downsampled) + " samples")
        samples = len(data)
        data = downsample(data, percentage=downsampled, session=codex_hash)
        eta = getComputeTimeEstimate("endmember", "ATGP", samples)

    data = codex_impute(data)

    results = pysptools.eea.eea.ATGP(data, int(q))

    dictionary = {
        'eta': eta, 'endmember_array': np.array_str(
            results[0]), 'endmember_vector': np.array_str(
            results[1]), 'downsample': downsampled}

    endTime = time.time()
    computeTime = endTime - startTime
    logTime(
        "endmember",
        "ATGP",
        computeTime,
        len(data),
        data.ndim)

    return dictionary


def codex_FIPPI(inputHash, subsetHash, q, downsampled, session=None):
    '''
    Inputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)
        q  (int)  			 - Number of endmembers to be induced (positive integer > 0)

    Outputs:
        Dictionary -
            endmember_array  - Set of induced endmembers (N x p)
            endmember_vector - Array of indices into the array data corresponding to the induced endmembers

    Examples:
    >>> from codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

    >>> result = codex_FIPPI(testData['inputHash'], False, 1, False, session=codex_hash)
    '''

    codex_hash = get_cache(session)
    logReturnCode(inspect.currentframe())
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_log("Hash not found. Returning!")
        return None

    data = returnHash['data']
    x, y = data.shape

    if(q > y):
        codex_log("WARNING: q must be <= to number of features")
        return None

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_log("ERROR: codex_endmembers - FIPPI - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_log("Downsampling to " + str(downsampled) + " samples")
        samples = len(data)
        data = downsample(data, percentage=downsampled, session=codex_hash)
        eta = getComputeTimeEstimate("endmember", "FIPPI", samples)

    data = codex_impute(data)

    results = pysptools.eea.eea.FIPPI(data, int(q))

    endTime = time.time()
    computeTime = endTime - startTime
    logTime(
        "endmember",
        "FIPPI",
        computeTime,
        len(data),
        data.ndim)

    dictionary = {
        'eta': eta, 'endmember_array': np.array_str(
            results[0]), 'endmember_vector': np.array_str(
            results[1]), 'downsample': downsampled}

    return dictionary


def codex_PPI(inputHash, subsetHash, q, numSkewers, downsampled, session=None):
    '''
    Inputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)
        q  (int)  			 - Number of endmembers to be induced (positive integer > 0)
        numSkewers (int)	 - Number of “skewer” vectors to project data onto.

    Outputs:
        Dictionary -
            endmember_array  - Set of induced endmembers (N x p)
            endmember_vector - Array of indices into the array data corresponding to the induced endmembers

    Examples:
    >>> from codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

    >>> result = codex_PPI(testData['inputHash'], False, 3, 1, False, session=codex_hash)
    '''

    codex_hash = get_cache(session)
    logReturnCode(inspect.currentframe())
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_log("ERROR: codex_endmembers - PPI - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_log("Downsampling to " + str(downsampled) +" samples")
        samples = len(data)
        data = downsample(data, percentage=downsampled, session=codex_hash)
        eta = getComputeTimeEstimate("endmember", "PPI", samples)

    data = codex_impute(data)

    results = pysptools.eea.eea.PPI(data, int(q), int(numSkewers))

    endTime = time.time()
    computeTime = endTime - startTime
    logTime(
        "endmember",
        "PPI",
        computeTime,
        len(data),
        data.ndim)

    dictionary = {
        'eta': eta, 'endmember_array': np.array_str(
            results[0]), 'endmember_vector': np.array_str(
            results[1]), 'downsample': downsampled}

    return dictionary


if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()


    
