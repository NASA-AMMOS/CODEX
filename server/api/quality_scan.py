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
import traceback
import numpy.polynomial.chebyshev
import time
import statistics
import math
import h5py
import inspect
import logging

import numpy as np

from sklearn.metrics import r2_score
from scipy           import stats

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math     import impute
from api.sub.time_log       import logTime
from api.sub.return_code    import logReturnCode
from api.sub.hash           import get_cache
from api.algorithm          import algorithm


class quality_scan(algorithm):

    def get_algorithm(self):

        if(self.algorithmName == "oddities"):
            self.algorithm = "oddities"
        elif(self.algorithmName == "sigma_data"):
            self.algorithm == "sigma_data"
        else:
            return None

        return algorithm


    def fit_algorithm(self):
        pass




    def check_valid(self):
        return 1


'''
            nan_count = 0
            ninf_count = 0
            inf_count = 0
            empty_string = 0
            zero_count = None
            mode_count = None
            mode_value = None

            if(np.issubdtype(self.X.dtype, np.integer)):
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

            dictionary = {"feature_name": feature_name,
                          "dtype": str(dtype),
                          "nan_count": nan_count,
                          "neg_inf_count": ninf_count,
                          "inf_count": inf_count,
                          "zero_count": zero_count,
                          "mode_value": mode_value,
                          "mode_count": mode_count,
                          "empty_string_count": empty_string}




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


    dictionary = {"values": resultValuesString,
                  "std": std_value_string,
                  "mean": mean_value_string,
                  "sigma_high": high_sigma,
                  "sigma_low": low_sigma,
                  "sigma": sigma,
                  "inside": inside,
                  "count": count,
                  "percentage": percentage}



    samples, features = data.shape
    arraySize = (features, features)
    r2Array = np.zeros(arraySize)
    pearsonArray = np.zeros(arraySize)

    if(features < 2):
        logging.warning("Error: Need at least two features to do a correlation!")
        return

    for x in range(0, features):
        for y in range(0, features):
            f1_data = data[:, x]
            f2_data = data[:, y]
            pearson = stats.pearsonr(f1_data, f2_data)
            pearsonArray[x, y] = pearson[0]
            r2Array[x, y] = r2_score(f1_data, f2_data)

    dictionary = {"r2_matrix": r2Array.tolist(),
                  "pearson_matrix": pearsonArray.tolist()}



    # TODO - this needs to handle multiple features correctly
    for value in data:
        if(value.any() > threshold_min):
            if(value.any() < threshold_max):
                returnList.append(value)
                inThresholdCount += 1

    returnArray = np.asarray(returnList)
    dataPercentage = (inThresholdCount / samples) * 100

    dictionary = {"resulting_array": returnArray,
                  "threshold_min": threshold_min,
                  "threshold_max": threshold_max,
                  "percentage_data": dataPercentage}
'''


    
