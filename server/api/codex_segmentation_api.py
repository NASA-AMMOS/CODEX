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
# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

import h5py
import traceback
from skimage.segmentation import quickshift
from skimage.segmentation import felzenszwalb
import numpy as np
import sys
import time
import statistics
import math


# CODEX Support
import codex_math
import codex_system
import codex_time_log
import codex_doctest
import codex_hash
import codex_downsample
import codex_read_data_api
import codex_return_code

DEBUG = False


def ml_segmentation(
        inputHash,
        hashList,
        subsetHashName,
        algorithmName,
        downsampled,
        parms,
        result):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> testData = codex_doctest.doctest_get_data()

    # Standard use
    >>> result = ml_segmentation(testData['inputHash'], testData['hashList'], None, "felzenszwalb", False, {'scale': 3, 'sigma': 7, 'min_size': 10, 'downsampled': 500}, {})

    # Scale cannot be cast
    >>> result = ml_segmentation(testData['inputHash'], testData['hashList'], None, "felzenszwalb", False, {'scale': "string", 'sigma': 7, 'min_size': 10, 'downsampled': 500}, {})
    scale parameter not set
    Traceback (most recent call last):
    ...
    ValueError: could not convert string to float: 'string'
    <BLANKLINE>

    # Sigma cannot be cast
    >>> result = ml_segmentation(testData['inputHash'], testData['hashList'], None, "felzenszwalb", False, {'scale': 3, 'sigma': "String", 'min_size': 10, 'downsampled': 500}, {})
    sigma parameter not set
    Traceback (most recent call last):
    ...
    ValueError: could not convert string to float: 'String'
    <BLANKLINE>

    # min_size incorrectly called min_scale
    >>> result = ml_segmentation(testData['inputHash'], testData['hashList'], None, "felzenszwalb", False, {'scale': 3, 'sigma': 7, 'min_scale': 10, 'downsampled': 500}, {})
    min_size parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'min_size'
    <BLANKLINE>

    # incorrect algorithmType
    >>> result = ml_segmentation(testData['inputHash'], testData['hashList'], None, "felzenszwa", False, {'scale': 3, 'sigma': 7, 'min_size': 10, 'downsampled': 500}, {})
    Cannot find requested segmentation algorithm
    '''
    data = codex_hash.mergeHashResults(hashList)
    inputHash = codex_hash.hashArray('Merged', data, "feature")
    if(inputHash is not None):
        inputHash = inputHash["hash"]
    else:
        codex_system.codex_log("Feature hash failure in ml_cluster")
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

    if(algorithmName == 'felzenszwalb'):

        try:
            scale = float(parms['scale'])
        except BaseException:
            codex_system.codex_log("scale parameter not set")
            result['message'] = "scale parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            sigma = float(parms['sigma'])
        except BaseException:
            codex_system.codex_log("sigma parameter not set")
            result['message'] = "sigma parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            min_size = int(parms['min_size'])
        except BaseException:
            codex_system.codex_log("min_size parameter not set")
            result['message'] = "min_size parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            result = codex_segmentation_felzenszwalb(
                inputHash, subsetHash, downsampled, scale, sigma, min_size)
        except BaseException:
            codex_system.codex_log(
                "Failed to run felzenszwalb segmentation algorithm")
            result['message'] = "Failed to run felzenszwalb segmentation algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif(algorithmName == 'quickshift'):

        try:
            kernel_size = float(parms['kernel_size'])
        except BaseException:
            codex_system.codex_log("kernel_size parameter not set")
            result['message'] = "kernel_size parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            sigma = float(parms['sigma'])
        except BaseException:
            codex_system.codex_log("sigma parameter not set")
            result['message'] = "sigma parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            max_dist = int(parms['max_dist'])
        except BaseException:
            codex_system.codex_log("max_dist parameter not set")
            result['message'] = "max_dist parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            result = codex_segmentation_quickshift(
                inputHash, subsetHash, downsampled, kernel_size, max_dist, sigma)
        except BaseException:
            codex_system.codex_log(
                "Failed to run quickshift segmentation algorithm")
            result['message'] = "Failed to run quickshift segmentation algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    else:
        codex_system.codex_log("Cannot find requested segmentation algorithm")
        result['message'] = "Cannot find requested segmentation algorithm"

    return result


def codex_segmentation_quickshift(
        inputHash,
        subsetHash,
        downsampled,
        kernel_size,
        max_dist,
        sigma):
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

    Examples:
        >>> testData = codex_doctest.doctest_get_data()

        >>> segments = codex_segmentation_quickshift(testData['inputHash'], False, 50, 20.0, 5.0, 2.0)
        Downsampling to 50 percent
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log(
                "ERROR: codex_segmentation quickshift - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        data = codex_downsample.downsample(data, percentage=downsampled)

    data = np.dstack((data, data, data))
    segments = quickshift(
        data,
        kernel_size=kernel_size,
        sigma=sigma,
        max_dist=max_dist)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "segmentation",
        "quickshift",
        computeTime,
        len(data),
        data.ndim)

    # temporary to not change API right now
    merged_hash = codex_hash.hashArray("temporary", data, "feature")

    if(subsetHash is False):
        returnCodeString = "codex_segmentation_api.codex_segmentation_quickshift('" + inputHash + "',False," + str(
            downsampled) + "," + str(kernel_size) + "," + str(sigma) + "," + str(max_dist) + ")"
    else:
        returnCodeString = "codex_segmentation_api.codex_segmentation_quickshift('" + inputHash + "','" + subsetHash + "'," + str(
            downsampled) + "," + str(kernel_size) + "," + str(sigma) + "," + str(max_dist) + ")"
    codex_return_code.logReturnCode(returnCodeString)

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
        min_size):
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

    Examples:

        >>> testData = codex_doctest.doctest_get_data()

        >>> segments = codex_segmentation_felzenszwalb(testData['inputHash'], False, 50, 3.0, 0.95, 3)
        Downsampling to 50 percent
    '''

    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log(
                "ERROR: codex_segmentation felzenswalb - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " percent")
        data = codex_downsample.downsample(data, percentage=downsampled)

    data = codex_math.codex_impute(data)
    segments = felzenszwalb(data, scale=scale, sigma=sigma, min_size=min_size)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "segmentation",
        "felzenszwalb",
        computeTime,
        len(data),
        data.ndim)

    # temporary to not change API right now
    merged_hash = codex_hash.hashArray("temporary", data, "feature")

    if(subsetHash is False):
        returnCodeString = "codex_segmentation_api.codex_segmentation_felzenszwalb('" + inputHash + "',False," + str(
            downsampled) + "," + str(scale) + "," + str(sigma) + "," + str(min_size) + ")"
    else:
        returnCodeString = "codex_segmentation_api.codex_segmentation_felzenszwalb('" + inputHash + "','" + subsetHash + "'," + str(
            downsampled) + "," + str(scale) + "," + str(sigma) + "," + str(min_size) + ")"
    codex_return_code.logReturnCode(returnCodeString)

    output = {
        'eta': eta,
        "segments": segments.tolist(),
        "scale": scale,
        "sigma": sigma,
        "min_size": min_size,
        'downsample': downsampled}

    return output


if __name__ == "__main__":

    codex_doctest.run_codex_doctest()

    