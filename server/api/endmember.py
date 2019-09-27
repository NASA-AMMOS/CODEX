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
#import pysptools.eea.eea
#import pysptools.eea
import time
import inspect
import logging

import numpy as np

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math        import codex_impute
from api.sub.codex_downsample  import downsample
from api.sub.codex_time_log    import getComputeTimeEstimate
from api.sub.codex_time_log    import logTime
from api.sub.return_code       import logReturnCode
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

    '''
    ch = get_cache(session)

    if(subsetHashName is not None):
        subsetHash = ch.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    try:
        q = int(parms['q'])
    except BaseException:
        logging.warning("q parameter not set")
        result['message'] = "q parameter not set"
        return result

    if(algorithmName == "ATGP"):
        try:
            result = codex_ATGP(inputHash, subsetHash, q, downsampled, session=ch)
        except BaseException:
            logging.warning("Failed to run ATGP endmember algorithm")
            result['message'] = "Failed to run ATGP endmember algorithm"
            logging.warning(traceback.format_exc())
            return result

    elif(algorithmName == "FIPPI"):
        try:
            result = codex_FIPPI(inputHash, subsetHash, q, downsampled, session=ch)
        except BaseException:
            logging.warning("Failed to run FIPPI endmember algorithm")
            result['message'] = "Failed to run FIPPI endmember algorithm"
            logging.warning(traceback.format_exc())
            return result

    elif(algorithmName == "PPI"):

        try:
            numSkewers = int(parms["numSkewers"])
        except BaseException:
            logging.warning("numSkewers parameter not set")
            result['message'] = "numSkewers parameter not set"
            return result

        try:
            result = codex_PPI(
                inputHash,
                subsetHash,
                q,
                numSkewers,
                downsampled,
                session=ch)
        except BaseException:
            logging.warning("Failed to run PPI endmember algorithm")
            result['message'] = "Failed to run PPI endmember algorithm"
            logging.warning(traceback.format_exc())
            return result

    else:
        logging.warning("Cannot find requested endmember algorithm")
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
    '''
    ch = get_cache(session)
    logReturnCode(inspect.currentframe())
    startTime = time.time()
    eta = None

    returnHash = ch.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        logging.warning("Hash not found. Returning!")
        return None

    data = returnHash['data']

    if(subsetHash is not False):
        data = ch.applySubsetMask(data, subsetHash)
        if(data is None):
            logging.warning("ERROR: codex_endmembers - ATGP - subsetHash returned None.")
            return None

    if(downsampled is not False):
        logging.info("Downsampling to {downsampled} samples".format(downsampled=downsampled))
        samples = len(data)
        data = downsample(data, percentage=downsampled, session=ch)
        eta = getComputeTimeEstimate("endmember", "ATGP", samples)

    data = codex_impute(data)

    results = None#pysptools.eea.eea.ATGP(data, int(q))

    dictionary = {
        'eta': eta, 'endmember_array': np.array_str(
            results[0]), 'endmember_vector': np.array_str(
            results[1]), 'downsample': downsampled}

    endTime = time.time()
    computeTime = endTime - startTime
    logTime("endmember", "ATGP", computeTime, len(data), data.ndim)

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

    '''
    ch = get_cache(session)
    logReturnCode(inspect.currentframe())
    startTime = time.time()
    eta = None

    returnHash = ch.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        logging.warning("Hash not found. Returning!")
        return None

    data = returnHash['data']
    x, y = data.shape

    if(q > y):
        logging.warning("WARNING: q must be <= to number of features")
        return None

    if(subsetHash is not False):
        data = ch.applySubsetMask(data, subsetHash)
        if(data is None):
            logging.warning("ERROR: codex_endmembers - FIPPI - subsetHash returned None.")
            return None

    if(downsampled is not False):
        logging.warning("Downsampling to " + str(downsampled) + " samples")
        samples = len(data)
        data = downsample(data, percentage=downsampled, session=ch)
        eta = getComputeTimeEstimate("endmember", "FIPPI", samples)

    data = codex_impute(data)

    results = None#pysptools.eea.eea.FIPPI(data, int(q))

    endTime = time.time()
    computeTime = endTime - startTime
    logTime("endmember", "FIPPI", computeTime, len(data), data.ndim)

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

    '''
    ch = get_cache(session)
    logReturnCode(inspect.currentframe())
    startTime = time.time()
    eta = None

    returnHash = ch.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        logging.warning("Hash not found. Returning!")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data = ch.applySubsetMask(data, subsetHash)
        if(data is None):
            logging.warning("ERROR: codex_endmembers - PPI - subsetHash returned None.")
            return None

    if(downsampled is not False):
        logging.warning("Downsampling to {downsampled} samples".format(downsampled=downsampled))
        samples = len(data)
        data = downsample(data, percentage=downsampled, session=ch)
        eta = getComputeTimeEstimate("endmember", "PPI", samples)

    data = codex_impute(data)

    results = None#pysptools.eea.eea.PPI(data, int(q), int(numSkewers))

    endTime = time.time()
    computeTime = endTime - startTime
    logTime("endmember", "PPI", computeTime, len(data), data.ndim)

    dictionary = {
        'eta': eta, 'endmember_array': np.array_str(
            results[0]), 'endmember_vector': np.array_str(
            results[1]), 'downsample': downsampled}

    return dictionary

