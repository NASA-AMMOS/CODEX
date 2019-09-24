
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
import h5py
import time
import sklearn
import collections
import traceback
import inspect

import numpy as np

from sklearn.decomposition import PCA, FastICA

sys.path.insert(1, os.getenv('CODEX_ROOT'))

# CODEX Support
import api.sub.codex_system
import api.sub.codex_math
import api.sub.codex_downsample
import api.sub.codex_read_data_api
import api.sub.codex_return_code
import api.sub.codex_time_log

from api.sub.codex_hash import get_cache

def ml_dimensionality_reduction(
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
        result = run_codex_dim_reduction(inputHash, subsetHash, parms, downsampled, False, algorithmName, session=codex_hash)
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
        algorithm,
        session=None):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        n_components (int)  - Number of components to keep
        incremental (bool)  - If set to True, incremental PCA used, else regular

    Outputs:

    Examples:

        >>> from codex_hash import DOCTEST_SESSION
        >>> codex_hash = get_cache(DOCTEST_SESSION)
        >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

        >>> result = run_codex_dim_reduction(testData['inputHash'], False, {"n_components":2}, False, False, "PCA", session=codex_hash)

        >>> result = run_codex_dim_reduction(testData['inputHash'], False, {"n_components":2}, 500, False, "ICA", session=codex_hash)
        Downsampling to 500 samples.

    '''

    codex_hash = get_cache(session)
    
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
        data = codex_downsample.downsample(data, samples=downsampled, session=codex_hash)

    eta = codex_time_log.getComputeTimeEstimate("dimension_reduction", algorithm, full_samples)

    data = codex_math.codex_impute(data)

    if(data.ndim > n_components):
        codex_system.codex_log("ERROR: run_codex_dim_reduction: features ({ndim}) > requested components ({components})".format(ndim=data.ndim, components=n_components))
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

    # print("saving out PCA")
    # outputHash = codex_hash.hashArray('PCA_', X_transformed, "feature", virtual=True)

    output = {
        'eta': eta,
        'algorithm': algorithm,
        'data': X_transformed.tolist(),
        'explained_variance_ratio': exp_var_ratio.tolist(),
        'inputHash': inputHash,
        'subsetHash': subsetHash,
        'outputHash': inputHash, #outputHash["hash"],
        'n_components': n_components,
        'downsample': downsampled,
        'message':"success"}

    return output




if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()

