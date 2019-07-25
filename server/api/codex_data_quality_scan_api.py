'''
Author: Jack Lightholder
Date  : 7/19/17

Brief : Custom data quality scan algorithms, formatted for CODEX

Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.path.join(CODEX_ROOT, 'api/sub'))

# Python Libraries
import traceback
from sklearn.metrics import r2_score
from scipy import stats
import numpy.polynomial.chebyshev
import numpy as np
import time
import statistics
import math
import h5py
import inspect

# CODEX Support
import codex_doctest
import codex_math
import codex_time_log
from codex_hash import get_cache
import codex_read_data_api
import codex_return_code
import codex_system

def ml_quality_scan(
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

    >>> result = ml_quality_scan(testData['inputHash'], testData['hashList'], None, "oddities", False, {'sigma': 3, 'inside': True}, {}, session=codex_hash)

    >>> result = ml_quality_scan(testData['inputHash'], testData['hashList'], None, "sigma_data", False, {'sigma': 3, 'inside': True}, {}, session=codex_hash)

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

    if(algorithmName == 'oddities'):

        try:
            result = codex_count_oddities(inputHash, subsetHash, session=codex_hash)
        except BaseException:
            codex_system.codex_log("Failed to run count_oddities")
            result['message'] = "Failed to run count_oddities"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif(algorithmName == 'sigma_data'):

        try:
            sigma = int(parms["sigma"])
        except BaseException:
            codex_system.codex_log("sigma parameter not set")
            result['message'] = "sigma parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            inside = parms["inside"]
        except BaseException:
            codex_system.codex_log("inside parameter not set")
            result['message'] = "inside parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            result = codex_get_sigma_data(inputHash, subsetHash, sigma, inside, session=codex_hash)
        except BaseException:
            codex_system.codex_log("Failed to run codex_get_sigma_data")
            result['message'] = "Failed to run codex_get_sigma_data"
            codex_system.codex_log(traceback.format_exc())
            return None

    else:
        result['message'] = "Cannot find requested quality scan algorithm"

    return result


def codex_count_oddities(inputHash, subsetHash, session=None):
    '''
    Inuputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)

    Outputs:
        dictionary -
            nan_count        - count of NaN values in the feature
            neg_inf_count    - count of negative infinity values in the feature
            inf_count        - count of negative
            zero_count       - count of 0 value instances (if integers, else None value)
            mode_count       - count of mode value instances (if integers, else None value)
            mode_value       - associated mode value (if integers, else None value)

    Notes:
    - Currently only works on single feature.  Call for each feature

    Examples:

    # integer example
    >>> from codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

    #>>> dictionary = codex_count_oddities(testData['inputHash'], False)

    >>> dictionary = codex_count_oddities(None,False, session=codex_hash)
    Error: codex_count_oddities: Hash not found

    '''

    codex_hash = get_cache(session)
    codex_return_code.logReturnCode(inspect.currentframe())
    startTime = time.time()

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Error: codex_count_oddities: Hash not found")
        return None

    feature = returnHash['data']
    feature_name = returnHash['name']
    dtype = feature.dtype

    feature = codex_math.codex_impute(feature)

    if(subsetHash is not False):
        feature = codex_hash.applySubsetMask(data, subsetHash)

    nan_count = 0
    ninf_count = 0
    inf_count = 0
    empty_string = 0
    zero_count = None
    mode_count = None
    mode_value = None

    if(np.issubdtype(feature.dtype, np.integer)):
        zero_count = 0

        modeInfo = stats.mode(feature, axis=None)
        mode_value = modeInfo.mode[0]
        mode_count = modeInfo.count[0]

    samples = len(feature)

    for x in range(0, samples):

        if(feature[x] == ''):
            empty_string += 1

        # if(np.isnan(feature[x])):
        #   nan_count += 1

        # if(np.isneginf(feature[x])):
        #   ninf_count += 1

        # elif(np.isinf(feature[x])):
        #   inf_count += 1

        if(np.issubdtype(feature.dtype, np.integer)):

            if(feature[x] == 0):
                zero_count += 1

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "quality_scan",
        "count_oddities",
        computeTime,
        samples,
        feature.ndim)

    dictionary = {"feature_name": feature_name,
                  "dtype": str(dtype),
                  "nan_count": nan_count,
                  "neg_inf_count": ninf_count,
                  "inf_count": inf_count,
                  "zero_count": zero_count,
                  "mode_value": mode_value,
                  "mode_count": mode_count,
                  "empty_string_count": empty_string}
    return dictionary


def codex_get_sigma_data(inputHash, subsetHash, sigma, inside, session=None):
    '''
    Inuputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)
        sigma(int)           - sigma value to search around
        inside (bool)        - returns statistics assoicated with values within sigma range if True or values outside
                                    sigma range if False
    Outputs:
        dictionary -
            values      - array of values inside/outside sigma range (values in range if inside = True, values outside
                            range if inside = False)
            std    -      standard deviation of the original feature vector
            mean   -      mean vaue of the original feature vector
            sigma_high  - caulcated high-end sigma value for feature vector
            sigma_low   - calculated low-end sigma value for feature vector
            sigma       - sigma value
            inside      - boolean value tracking if data is inside sigma range or outside
            count       - count of values in the requested area (inside/outside of specified sigma range)
            percentage  - percentage of the data set falling inside the return array

    Examples:

    # collect data inside sigma range
    >>> from codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

    '''
    codex_hash = get_cache(session)

    codex_return_code.logReturnCode(inspect.currentframe())
    startTime = time.time()

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Error: codex_get_sigma_data: Hash not found!")
        return

    feature = returnHash['data']
    feature = codex_math.codex_impute(feature)

    if(subsetHash is not False):
        feature = codex_hash.applySubsetMask(data, subsetHash)

    sigmaList = []
    feature_length = len(feature)

    std_value = np.std(feature)
    mean_value = np.mean(feature)

    low_sigma = mean_value - ((std_value * sigma) / 2)
    high_sigma = mean_value + ((std_value * sigma) / 2)

    if(inside):
        for x in range(0, len(feature)):
            if(feature[x][0] <= float(high_sigma)):
                if(feature[x][0] >= float(low_sigma)):
                    sigmaList.append(feature[x])

    else:
        for x in range(0, len(feature)):
            if(feature[x] > high_sigma):
                sigmaList.append(feature[x])
            elif(feature[x] < low_sigma):
                sigmaList.append(feature[x])

    resultValues = np.asarray(sigmaList)
    count = len(resultValues)
    percentage = count / feature_length

    resultValuesString = np.array2string(resultValues)
    mean_value_string = np.array2string(mean_value)
    std_value_string = np.array2string(std_value)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "quality_scan",
        "sigma_data",
        computeTime,
        feature,
        feature.ndim)

    dictionary = {"values": resultValuesString,
                  "std": std_value_string,
                  "mean": mean_value_string,
                  "sigma_high": high_sigma,
                  "sigma_low": low_sigma,
                  "sigma": sigma,
                  "inside": inside,
                  "count": count,
                  "percentage": percentage}
    return dictionary


def codex_column_correlation(inputHash, subsetHash, session=None):
    '''
    Inuputs:
        inputHash (string)            - hash value corresponding to the data to cluster
        subsetHash (string)           - hash value corresponding to the subselection (false if full feature)

    Outputs:
        Dictionary -
            r2_matrix (2d-array)      - array of r2 coefficients.  Calculated using sklearn r2_score()
            pearson_matrix (2d-array) - array of pearson coefficients.  Calculated using scipy.stats.pearson()

    Examples:

        >>> from codex_hash import DOCTEST_SESSION
        >>> codex_hash = get_cache(DOCTEST_SESSION)
        >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

        >>> results = codex_column_correlation(testData['inputHash'], False, session=codex_hash)

        '''

    codex_hash = get_cache(session)
    codex_return_code.logReturnCode(inspect.currentframe())
    startTime = time.time()

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Error: codex_column_correlation: Hash not found!")
        return

    data = returnHash['data']
    data = codex_math.codex_impute(data)

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)

    samples, features = data.shape
    arraySize = (features, features)
    r2Array = np.zeros(arraySize)
    pearsonArray = np.zeros(arraySize)

    if(features < 2):
        print("Error: Need at least two features to do a correlation!")
        return

    for x in range(0, features):
        for y in range(0, features):
            f1_data = data[:, x]
            f2_data = data[:, y]
            pearson = stats.pearsonr(f1_data, f2_data)
            pearsonArray[x, y] = pearson[0]
            r2Array[x, y] = r2_score(f1_data, f2_data)


    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "quality_scan",
        "column_correlation",
        computeTime,
        data,
        data.ndim)

    dictionary = {"r2_matrix": r2Array.tolist(),
                  "pearson_matrix": pearsonArray.tolist()}
    return dictionary


def codex_column_threshold(
        inputHash,
        subsetHash,
        threshold_min,
        threshold_max,
        session=None):
    '''
    Inuputs:
        inputHash (string)            - hash value corresponding to the data to cluster
        subsetHash (string)           - hash value corresponding to the subselection (false if full feature)
        threshold_min (int/float)     - minimum value to accept into the new column
        threshold_max (int/float)     - maximum value to accept into the new column

    Outputs:
        Dictionary -
            resulting_array           - resulting feature column after threholds are applied to input column feature
            threshold_min             - threshold_min input value
            threshold_max             - threshold_max input value
            percentage_data           - percentage of data from original feature remaining in filtered feature column

    Examples:

        >>> from codex_hash import DOCTEST_SESSION
        >>> codex_hash = get_cache(DOCTEST_SESSION)
        >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

        >>> dictionary = codex_column_threshold(testData['inputHash'], False, 0, 0.000394, session=codex_hash)
        >>> print(dictionary["threshold_max"])
        0.000394

    '''
    codex_hash = get_cache(session)

    codex_return_code.logReturnCode(inspect.currentframe())
    startTime = time.time()
    returnList = []

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Error: codex_column_correlation: Hash not found!")
        return

    data = returnHash['data']
    samples = len(data)
    inThresholdCount = 0

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)

    data = codex_math.codex_impute(data)

    # TODO - this needs to handle multiple features correctly
    for value in data:
        if(value.any() > threshold_min):
            if(value.any() < threshold_max):
                returnList.append(value)
                inThresholdCount += 1

    returnArray = np.asarray(returnList)
    dataPercentage = (inThresholdCount / samples) * 100

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "quality_scan",
        "column_threshold",
        computeTime,
        data,
        data.ndim)

    dictionary = {"resulting_array": returnArray,
                  "threshold_min": threshold_min,
                  "threshold_max": threshold_max,
                  "percentage_data": dataPercentage}
    return dictionary


if __name__ == "__main__":

    codex_doctest.run_codex_doctest()


    
