'''
Author: Jack Lightholder
Date  : 7/15/17
Brief : Dimmensionality reduction algorithms, formatted for CODEX
Notes : Not currently functional

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import sys
import os
import traceback

import matplotlib # Necessary for pysptools matplotlib backend issue
matplotlib.use('Agg') # Necessary for pysptools matplotlib backend issue
import pysptools.eea.eea
import pysptools.eea

import time
import inspect
import logging

import numpy as np

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math        import impute
from api.sub.downsample        import downsample
from api.sub.time_log          import getComputeTimeEstimate
from api.sub.time_log          import logTime
from api.sub.return_code       import logReturnCode
from api.sub.hash              import get_cache


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

    '''
    cache = get_cache(session)

    if len(hashList) < 2:
        logging.warning("Clustering requires >= 2 features.")
        return None

    if subsetHashName is not None:
        subsetHash = cache.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    try:
        result = run_codex_endmember(inputHash, subsetHash, downsampled, algorithmName, parms, session=cache)

    except BaseException:
        logging.warning("Failed to run endmember algorithm")
        result['message'] = "Failed to run endmember algorithm"
        logging.warning(traceback.format_exc())

    return result


def run_codex_endmember(inputHash, subsetHash, downsampled, algorithm, parms, session=None):
    '''
    Inputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)
        q  (int)             - Number of endmembers to be induced (positive integer > 0)

    Outputs:
        Dictionary -
            endmember_array  - Set of induced endmembers (N x p)
            endmember_vector - Array of indices into the array data corresponding to the induced endmembers
    '''
    cache = get_cache(session)

    logReturnCode(inspect.currentframe())
    startTime = time.time()

    returnHash = cache.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        logging.warning("Hash not found. Returning!")
        return None

    X = returnHash['data']
    if X is None:
        return None

    #if(q > y):
    #    logging.warning("WARNING: q must be <= to number of features")
    #    return None

    full_samples, full_features = X.shape
    eta = getComputeTimeEstimate("dimension_reduction", algorithm, full_samples, full_features)

    if(subsetHash is not False):
        X, datName = ch.applySubsetMask(X, subsetHash)
        if(X is None):
            logging.warning("ERROR: run_codex_endmember: subsetHash returned None.")
            return None

    if(downsampled is not False):
        X = downsample(X, samples=downsampled, session=cache)
        logging.info("Downsampled to {samples} samples".format(samples=len(X)))

    computed_samples, computed_features = X.shape
    X = impute(X)

    if algorithm == "ATGP":
        results = pysptools.eea.eea.ATGP(X, int(parms['q']))
    elif algorithm == "FIPPI":
        results = pysptools.eea.eea.FIPPI(X, int(parms['q']))
    elif algorithm == "PPI":
        results = pysptools.eea.eea.PPI(X, int(parms['q']), int(parms['numSkewers']))
    else:
        return {'algorithm': algorithm,
                'data': X.tolist(),
                'downsample': downsampled,
                'WARNING': "{algorithm} not supported.".format(algorithm=algorithm)}

    dictionary = {
            'eta': eta, 
            'endmember_array': np.array_str(results[0]), 
            'endmember_vector': np.array_str(results[1]), 
            'downsample': downsampled}

    endTime = time.time()
    computeTime = endTime - startTime
    logTime("endmember", algorithm, computeTime, computed_samples, computed_features)

    return dictionary


