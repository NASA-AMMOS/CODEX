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
# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

import time
import h5py
import traceback
from detect_peaks import detect_peaks
from scipy.signal import find_peaks_cwt
import numpy as np
import inspect

# CODEX Support
import codex_math
import codex_system
import codex_doctest
import codex_read_data_api
import codex_return_code
import codex_downsample
import codex_plot
import codex_time_log
from codex_hash import get_cache

DEBUG = False

# Note: algorithm source: https://blog.ytotech.com/2015/11/01/findpeaks-in-python/
# Note: algorithm source:
# https://docs.scipy.org/doc/scipy-0.14.0/reference/generated/scipy.signal.find_peaks_cwt.html

# TODO add subset hash support


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

    Examples:
    >>> from codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

    #>>> result = ml_peak_detect(testData['hashList'], None, "peak_cwt", False, {'peak_width': 3, 'gap_threshold': 5, 'min_snr': 3, 'noise_perc': 10}, {})

    '''
    codex_hash = get_cache(session)

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

    if(algorithmName == "peak_cwt"):
        try:
            peak_width = int(parms["peak_width"])
        except BaseException:
            codex_system.codex_log("peak_width parameter not set")
            result['message'] = "peak_width parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            gap_threshold = float(parms["gap_threshold"])
        except BaseException:
            codex_system.codex_log("gap_threshold parameter not set")
            result['message'] = "gap_threshold parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            min_snr = float(parms["min_snr"])
        except BaseException:
            codex_system.codex_log("min_snr parameter not set")
            result['message'] = "min_snr parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            noise_perc = float(parms["noise_perc"])
        except BaseException:
            codex_system.codex_log("noise_perc parameter not set")
            result['message'] = "noise_perc parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            result = codex_scipy_signal_peak_cwt(
                inputHash,
                subsetHash,
                False,
                False,
                peak_width,
                gap_threshold,
                min_snr,
                noise_perc,
                session=codex_hash)
        except BaseException:
            codex_system.codex_log(
                "Failed to run codex_scipy_signal_peak_cwt peak detection algorithm")
            result['message'] = "Failed to run codex_scipy_signal_peak_cwt peak detection algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    if(algorithmName == "findpeaks"):

        try:
            mph = int(parms["mph"])
        except BaseException:
            codex_system.codex_log("mph parameter not set")
            result['message'] = "mph parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            mpd = int(parms["mpd"])
        except BaseException:
            codex_system.codex_log("mpd parameter not set")
            result['message'] = "mpd parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            threshold = int(parms["threshold"])
        except BaseException:
            codex_system.codex_log("threshold parameter not set")
            result['message'] = "threshold parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            edge = int(parms["edge"])
        except BaseException:
            codex_system.codex_log("edge parameter not set")
            result['message'] = "edge parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            kpsh = int(parms["kpsh"])
        except BaseException:
            codex_system.codex_log("kpsh parameter not set")
            result['message'] = "kpsh parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            valley = boolean(parms["valley"])
        except BaseException:
            codex_system.codex_log("valley parameter not set")
            result['message'] = "valley parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            result = codex_matlab_findpeaks(
                inputHash,
                subsetHash,
                False,
                mph,
                mpd,
                threshold,
                edge,
                kpsh,
                valley,
                False,
                session=codex_hash)
        except BaseException:
            codex_system.codex_log(
                "Failed to run matlab-findpeaks peak detection algorithm")
            result['message'] = "Failed to run matlab-findpeaks peak detection algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    else:

        result['message'] = "Cannot find requested peak detection algorithm"

    return result


def codex_scipy_signal_peak_cwt(
        inputHash,
        subsetHash,
        showPlot,
        downsampled,
        peak_width,
        gap_threshold,
        min_snr,
        noise_perc,
        session=None):
    '''
    Inputs:
        inputHash (string)        - Hash value corresponding to the data to cluster
        subsetHash (string)       - Hash value corresponding to the subselection (false if full feature)
        showPlot (bool)           - Show the matplotlib plot (turned off for CODEX API / on for standalone python script output)
        downsampled (int)         - Number of data points to use for quicklook
        peak_width (int)          - Width for caulculating CWT matrix, Uniform distribution using num_samples/peak_width
        gap_threshold (float)     - If a relative maximum is not found within max_distances, there will be a gap. A ridge line is discontinued
                                        if there are more than gap_thresh points without connecting a new relative maximum. Default is 2.
        min_snr (float)           - Minimum SNR ratio. Default 1. The noise is the noise_perc`th percentile of datapoints contained within a window
        noise_perc (float)		  - When calculating the noise floor, percentile of data points examined below which to consider noise.
                                        Calculated using stats.scoreatpercentile. Default is 10.

    Outputs:
        indexes (np.ndarray)      - index locations of all found peaks
        inputHash (string)        - hash value corresponding to the data to cluster
        subsetHash (string)       - Hash value corresponding to the subselection (false if full feature)
        downsampled (int)         - Number of data points to use for quicklook
        downsampledHash (string)  - Hash of newly created dataset which has downsampling (and potential subset) applied

    Examples:

    '''
    codex_hash = get_cache(session)

    downsampledHash = None
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Hash not found. Returning!")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log(
                "ERROR: codex_peak_detection scipy_signal_peak_cwt - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " samples")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled, session=codex_hash)
        eta = codex_time_log.getComputeTimeEstimate("peak", "cwt", samples)

    data = codex_math.codex_impute(data)
    data = data[:, 0]
    num_samples = len(data)
    width_array = np.asarray(np.arange(1, num_samples / peak_width))

    indexes = find_peaks_cwt(
        data,
        width_array,
        gap_thresh=gap_threshold,
        min_snr=min_snr,
        noise_perc=noise_perc)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("peak", "cwt", computeTime, len(data), data.ndim)

    if(showPlot):
        codex_plot.codex_plot_peak(data, indexes)

    codex_return_code.logReturnCode(inspect.currentframe())

    dictionary = {
        'eta': eta,
        "indexes": indexes,
        "inputHash": inputHash,
        'subsetHash': subsetHash,
        'downsampled': downsampled}
    return dictionary


def codex_matlab_findpeaks(
        inputHash,
        subsetHash,
        downsampled,
        mph,
        mpd,
        threshold,
        edge,
        kpsh,
        valley,
        showPlot,
        session=None):
    '''
    Inputs:
        inputHash (string)        - Hash value corresponding to the data to cluster
        subsetHash (string)       - Hash value corresponding to the subselection (false if full feature)
        downsampled (int)         - Number of data points to use for quicklook
        mph (None, number)        - Detect peaks that are greater than minimum peak height
        mpd (1-INF, int)          - Detect peaks that are at least separated by minimum peak distance, in number of data points
        threshold (int)           - Detect peaks (valleys) that are greater (smaller) than `threshold` in relation to their immediate neighbors.
        edge (string)             - {None, 'rising', 'falling', 'both'} for a flat peak, keep only the rising edge ('rising'), only the
                                        falling edge ('falling'), both edges ('both'), or don't detect a flat peak (None).
        kpsh (bool)               - Keep peaks with same height even if they are closer than `mpd`.
        valley (bool)             - If True, detect valleys (local minima) instead of peaks.
        showPlot (bool)           - If True, plot data in matplotlib figure.

    Outputs:
        indexes (np.ndarray)      - index locations of all found peaks
        inputHash (string)        - hash value corresponding to the data to cluster
        subsetHash (string)       - Hash value corresponding to the subselection (false if full feature)
        downsampled (int)         - Number of data points to use for quicklook
        downsampledHash (string)  - Hash of newly created dataset which has downsampling (and potential subset) applied

    Examples:

    '''
    codex_hash = get_cache(session)

    codex_return_code.logReturnCode(inspect.currentframe())
    downsampledHash = None
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Hash not found. Returning!")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log(
                "ERROR: codex_peak_detection matlab_findpeaks - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log(
            "Downsampling to " +
            str(downsampled) +
            " samples")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled, session=codex_hash)
        eta = codex_time_log.getComputeTimeEstimate(
            "peak", "matlab_findpeaks", samples)

    data = codex_math.codex_impute(data)
    data = data[:, 0]
    num_samples = len(data)
    indexes = detect_peaks(
        data,
        mph=mph,
        mpd=mpd,
        threshold=threshold,
        edge=edge,
        kpsh=kpsh,
        valley=valley)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "peak",
        "matlab_findpeaks",
        computeTime,
        len(data),
        data.ndim)

    if(showPlot):
        codex_plot.codex_plot_peak(data, indexes)

    dictionary = {
        'eta': eta,
        "indexes": indexes,
        "inputHash": inputHash,
        'subsetHash': subsetHash,
        'downsampled': downsampled}
    return dictionary


if __name__ == "__main__":

    codex_doctest.run_codex_doctest()

    
