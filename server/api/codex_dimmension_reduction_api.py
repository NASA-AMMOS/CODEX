
'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Dimmensionality reduction algorithms, formatted for CODEX

Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA, FastICA
import h5py
import time
import sklearn
import collections
import traceback
import inspect

# CODEX Support
import codex_system
import codex_math
import codex_downsample
import codex_doctest
import codex_hash
import codex_read_data_api
import codex_return_code
import codex_time_log


def ml_dimensionality_reduction(
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

    '''

    if(subsetHashName is not None):
        subsetHash = codex_hash.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    try:
        result = run_codex_dim_reduction(inputHash, subsetHash, parms, downsampled, False, algorithmName)
    except BaseException:
        codex_system.codex_log("Failed to run dimensionality reduction analysis")
        result['message'] = "Failed to run dimensionality reduction analysis"
        codex_system.codex_log(traceback.format_exc())
        return None

    return result


def run_codex_dim_reduction(
        inputHash,
        subsetHash,
        parms,
        downsampled,
        showPlot,
        algorithm):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        n_components (int)  - Number of components to keep
        incremental (bool)  - If set to True, incremental PCA used, else regular

    Outputs:

    Examples:

        >>> testData = codex_doctest.doctest_get_data()

        >>> result = run_codex_dim_reduction(testData['inputHash'], False, {"n_components":2}, False, False, "PCA")

        >>> result = run_codex_dim_reduction(testData['inputHash'], False, {"n_components":2}, 500, False, "ICA")
        Downsampling to 500 samples.

    '''
    codex_return_code.logReturnCode(inspect.currentframe())
    startTime = time.time()
    eta = None

    n_components = parms["n_components"]

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Error: run_codex_dim_reduction: Hash not found")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data, datName = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: run_codex_dim_reduction: subsetHash returned None.")
            return None

    full_samples = len(data)
    if(downsampled is not False):
        codex_system.codex_log("Downsampling to {ds} samples.".format(ds=downsampled))
        data = codex_downsample.downsample(data, samples=downsampled)

    eta = codex_time_log.getComputeTimeEstimate("dimension_reduction", algorithm, full_samples)

    data = codex_math.codex_impute(data)

    if(data.ndim > n_components):
        codex_system.codex_log("ERROR: run_codex_dim_reduction: features (" + str(data.ndim) +") > requested components (" +str(n_components) +")")
        return None

    try:

        if(algorithm == "PCA"):

            dim_r = PCA(n_components=n_components)

        elif(algorithm == "ICA"):

            dim_r = FastICA(n_components=n_components)

        else:
            return {'algorithm': algorithm,
                    'inputHash': inputHash,
                    'subsetHash': subsetHash,
                    'n_components': n_components,
                    'downsample': downsampled,
                    'WARNING': algorithm + " not supported."}

    except:

        codex_system.codex_log(str(traceback.format_exc()))

        return {'algorithm': algorithm,
                'inputHash': inputHash,
                'subsetHash': subsetHash,
                'n_components': n_components,
                'downsample': downsampled,
                'WARNING': traceback.format_exc()}

    if showPlot:
        codex_plot.plot_dimensionality(exp_var_ratio, "PCA Explained Variance", show=True)

    X_transformed = dim_r.fit_transform(data)
    exp_var_ratio = codex_math.codex_explained_variance_ratio(X_transformed, n_components)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime(
        "dimension_reduction",
        algorithm,
        computeTime,
        len(data),
        data.ndim)

    outputHash = codex_hash.hashArray('PCA_', X_transformed, "feature")

    output = {
        'eta': eta,
        'algorithm': algorithm,
        'data': X_transformed.tolist(),
        'explained_variance_ratio': exp_var_ratio.tolist(),
        'inputHash': inputHash,
        'subsetHash': subsetHash,
        'outputHash': outputHash["hash"],
        'n_components': n_components,
        'downsample': downsampled,
        'message':"success"}

    return output




if __name__ == "__main__":

    codex_doctest.run_codex_doctest()

