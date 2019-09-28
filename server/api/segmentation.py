'''
Author: Jack Lightholder
Date  : 7/15/17
Brief : Segmentation algorithms, formatted for CODEX
Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import h5py
import traceback
import time
import math
import inspect
import logging

import numpy as np

from skimage.segmentation import quickshift
from skimage.segmentation import felzenszwalb

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math        import impute
from api.sub.time_log          import logTime
from api.sub.downsample        import downsample
from api.sub.return_code       import logReturnCode
from api.sub.hash              import get_cache


def ml_segmentation(
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

    data = cache.mergeHashResults(hashList)
    inputHash = cache.hashArray('Merged', data, "feature")
    if(inputHash is not None):
        inputHash = inputHash["hash"]
    else:
        logging.warning("Feature hash failure in ml_cluster")
        result['message'] = "Feature hash failure in ml_cluster"
        return None

    if(subsetHashName is not None):
        subsetHash = cache.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    if(algorithmName == 'felzenszwalb'):

        try:
            scale = float(parms['scale'])
        except BaseException:
            logging.warning("scale parameter not set")
            result['message'] = "scale parameter not set"
            return None

        try:
            sigma = float(parms['sigma'])
        except BaseException:
            logging.warning("sigma parameter not set")
            result['message'] = "sigma parameter not set"
            return None

        try:
            min_size = int(parms['min_size'])
        except BaseException:
            logging.warning("min_size parameter not set")
            result['message'] = "min_size parameter not set"
            return None

        try:
            result = codex_segmentation_felzenszwalb(
                inputHash, subsetHash, downsampled, scale, sigma, min_size, session=cache)
        except BaseException:
            logging.warning("Failed to run felzenszwalb segmentation algorithm")
            result['message'] = "Failed to run felzenszwalb segmentation algorithm"
            logging.warning(traceback.format_exc())
            return None

    elif(algorithmName == 'quickshift'):

        try:
            kernel_size = float(parms['kernel_size'])
        except BaseException:
            logging.warning("kernel_size parameter not set")
            result['message'] = "kernel_size parameter not set"
            return None

        try:
            sigma = float(parms['sigma'])
        except BaseException:
            logging.warning("sigma parameter not set")
            result['message'] = "sigma parameter not set"
            logging.warning(traceback.format_exc())
            return None

        try:
            max_dist = int(parms['max_dist'])
        except BaseException:
            logging.warning("max_dist parameter not set")
            result['message'] = "max_dist parameter not set"
            return None

        try:
            result = codex_segmentation_quickshift(inputHash, subsetHash, downsampled, kernel_size, max_dist, sigma, session=cache)
        except BaseException:
            logging.warning("Failed to run quickshift segmentation algorithm")
            result['message'] = "Failed to run quickshift segmentation algorithm"
            logging.warning(traceback.format_exc())
            return None

    else:
        logging.warning("Cannot find requested segmentation algorithm")
        result['message'] = "Cannot find requested segmentation algorithm"

    return result


def codex_segmentation_quickshift(
        inputHash,
        subsetHash,
        downsampled,
        kernel_size,
        max_dist,
        sigma,
        session=None):
    '''
    Inputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)
        downsampled (int)    - number of data points to use for quicklook
        kernel_size (float)  - Width of Gaussian kernel used in smoothing the sample density. Higher means fewer clusters.
        max_dist (float)     - Cut-off point for data distances. Higher means fewer clusters.
        sigma (float)        - Width for Gaussian smoothing as preprocessing. Zero means no smoothing.

    Outputs:
        Dictionary -
            segments (array)    - segment subset mask
            kernel_size (float) - Width of Gaussian kernel used in smoothing the sample density. Higher means fewer clusters.
            max_dist (float)    - Cut-off point for data distances. Higher means fewer clusters.
            sigma (float)       - Width for Gaussian smoothing as preprocessing. Zero means no smoothing.

    Notes:
        Algorithm: http://scikit-image.org/docs/dev/api/skimage.segmentation.html#quickshift

    '''
    cache = get_cache(session)

    logReturnCode(inspect.currentframe())
    startTime = time.time()
    eta = None

    returnHash = cache.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        logging.warning("Hash not found. Returning!")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data = cache.applySubsetMask(data, subsetHash)
        if(data is None):
            logging.warning("ERROR: codex_segmentation quickshift - subsetHash returned None.")
            return None

    if(downsampled is not False):
        logging.info("Downsampling to {downsample} percent".format(downsample=downsampled))
        data = downsample(data, percentage=downsampled, session=cache)

    data = np.dstack((data, data, data))
    segments = quickshift(
        data,
        kernel_size=kernel_size,
        sigma=sigma,
        max_dist=max_dist)

    endTime = time.time()
    computeTime = endTime - startTime
    logTime("segmentation", "quickshift", computeTime, len(data), data.ndim)

    # temporary to not change API right now
    merged_hash = cache.hashArray("temporary", data, "feature")

    output = {
        'eta': eta,
        "segments": segments.tolist(),
        "kernel_size": kernel_size,
        "sigma": sigma,
        "max_dist": max_dist,
        'downsample': downsampled}

    return output


def codex_segmentation_felzenszwalb(
        inputHash,
        subsetHash,
        downsampled,
        scale,
        sigma,
        min_size,
        session=None):
    '''
    Inputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)
        downsampled (int)    - number of data points to use for quicklook
        scale (float)        - larger indicates more segments
        sigma (float)        - width of the Gaussian kernel used in preprocessing
        min_size (int)       - Minimum number of values which must exist in each segment

    Outputs:
        Dictionary -
            segments (array) - segment subset mask
            scale (float)        - larger indicates more segments
            sigma (float)        - width of the Gaussian kernel used in preprocessing
            min_size (int)       - Minimum number of values which must exist in each segment

    Notes:
        Algorithm: http://scikit-image.org/docs/dev/api/skimage.segmentation.html#skimage.segmentation.felzenszwalb

    '''
    cache = get_cache(session)

    logReturnCode(inspect.currentframe())
    startTime = time.time()
    eta = None

    returnHash = cache.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        logging.warning("Hash not found. Returning!")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data = cache.applySubsetMask(data, subsetHash)
        if(data is None):
            logging.warning("ERROR: codex_segmentation felzenswalb - subsetHash returned None.")
            return None

    if(downsampled is not False):
        logging.info("Downsampling to {downsampled} percent".format(downsampled=downsampled))
        data = downsample(data, percentage=downsampled, session=cache)

    data = impute(data)
    segments = felzenszwalb(data, scale=scale, sigma=sigma, min_size=min_size)

    endTime = time.time()
    computeTime = endTime - startTime
    logTime("segmentation", "felzenszwalb", computeTime, len(data), data.ndim)

    # temporary to not change API right now
    merged_hash = cache.hashArray("temporary", data, "feature")

    output = {
        'eta': eta,
        "segments": segments.tolist(),
        "scale": scale,
        "sigma": sigma,
        "min_size": min_size,
        'downsample': downsampled}

    return output

    
