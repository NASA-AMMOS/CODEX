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
import time
import h5py
import traceback
import inspect
import logging

import numpy as np

from scipy.signal import find_peaks_cwt

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math        import impute
from api.sub.return_code       import logReturnCode
from api.sub.downsample        import downsample
from api.sub.plot              import plot_peak
from api.sub.time_log          import getComputeTimeEstimate
from api.sub.time_log          import logTime
from api.sub.detect_peaks      import detect_peaks
from api.sub.hash              import get_cache

# Note: algorithm source: https://blog.ytotech.com/2015/11/01/findpeaks-in-python/
# Note: algorithm source:
# https://docs.scipy.org/doc/scipy-0.14.0/reference/generated/scipy.signal.find_peaks_cwt.html

def ml_peak_detect(
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
        logging.warning("Peak detection requires >= 2 features.")
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
        
        result = run_codex_peak_detection(inputHash, subsetHash, downsampled, algorithmName, parms, session=cache)

    except BaseException:
        logging.warning("Failed to run peak detection algorithm")
        result['message'] = "Failed to run peak detection algorithm"
        logging.warning(traceback.format_exc())

    return result

# matlab_findpeaks, cwt
def run_codex_peak_detection(inputHash, 
                             subsetHash, 
                             downsampled, 
                             algorithm, 
                             parms, 
                             session=None):
    '''
    Inputs:

    Outputs:

    '''
    cache = get_cache(session)
    logReturnCode(inspect.currentframe())

    startTime = time.time()

    returnHash = cache.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        logging.warning("Clustering: run_codex_clustering: Hash not found. Returning!")
        return None

    X = returnHash['data']
    if X is None:
        return None

    full_samples, full_features = X.shape
    eta = getComputeTimeEstimate("peak", algorithm, full_samples, full_features)

    if(subsetHash is not False):
        X = cache.applySubsetMask(X, subsetHash)
        if(X is None):
            logging.warning("ERROR: subsetHash returned None.")
            return None

    if downsampled is not False:
        X = downsample(X, samples=downsampled, session=cache)
        logging.info("Downsampled to {samples} samples".format(samples=len(X)))

    computed_samples, computed_features = X.shape
    X = impute(X)
    X = X[:, 0]
    num_samples = len(X)
    width_array = np.asarray(np.arange(1, num_samples / peak_width))

    if algorithm == "cwt":
        indexes = find_peaks_cwt(data, width_array, gap_thresh=gap_threshold, min_snr=min_snr, noise_perc=noise_perc)
    elif algorithm == "matlab_findpeaks":
        indexes = detect_peaks(data, mph=mph, mpd=mpd, threshold=threshold, edge=edge, kpsh=kpsh, valley=valley)
    else:
        return {'algorithm': algorithm,
                'data': X.tolist(),
                'downsample': downsampled,
                'WARNING': "{algorithm} not supported.".format(algorithm=algorithm)}

    endTime = time.time()
    computeTime = endTime - startTime
    logTime("peak", algorithm, computeTime, len(data), data.ndim)

    if(showPlot):
        plot_peak(data, indexes)

    dictionary = {
        'eta': eta,
        "indexes": indexes,
        "inputHash": inputHash,
        'subsetHash': subsetHash,
        'downsampled': downsampled}

    return dictionary



