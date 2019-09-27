
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
import logging

import numpy as np

from sklearn.decomposition import PCA, FastICA

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math        import codex_impute
from api.sub.codex_math        import codex_explained_variance_ratio
from api.sub.codex_downsample  import downsample
from api.sub.return_code       import logReturnCode
from api.sub.codex_time_log    import logTime
from api.sub.codex_time_log    import getComputeTimeEstimate
from api.sub.codex_hash        import get_cache

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
        result = run_codex_dim_reduction(inputHash, subsetHash, parms, downsampled, False, algorithmName, session=ch)
    except BaseException:
        logging.warning("Failed to run dimensionality reduction analysis")
        result['message'] = "Failed to run dimensionality reduction analysis"
        logging.warning(traceback.format_exc())
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

        >>> from api.sub.codex_hash import DOCTEST_SESSION
        >>> from api.sub.codex_doctest import doctest_get_data
        >>> ch = get_cache(DOCTEST_SESSION)
        >>> testData = doctest_get_data(session=ch)

        >>> result = run_codex_dim_reduction(testData['inputHash'], False, {"n_components":2}, False, False, "PCA", session=ch)
        >>> result = run_codex_dim_reduction(testData['inputHash'], False, {"n_components":2}, 500, False, "ICA", session=ch)

    '''

    ch = get_cache(session)
    
    logReturnCode(inspect.currentframe())
    startTime = time.time()
    eta = None

    n_components = parms["n_components"]

    returnHash = ch.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Error: run_codex_dim_reduction: Hash not found")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data, datName = ch.applySubsetMask(data, subsetHash)
        if(data is None):
            logging.warning("ERROR: run_codex_dim_reduction: subsetHash returned None.")
            return None

    full_samples = len(data)
    if(downsampled is not False):
        logging.info("Downsampling to {ds} samples.".format(ds=downsampled))
        data = downsample(data, samples=downsampled, session=ch)

    eta = getComputeTimeEstimate("dimension_reduction", algorithm, full_samples)

    data = codex_impute(data)

    if(data.ndim > n_components):
        logging.warning("ERROR: run_codex_dim_reduction: features ({ndim}) > requested components ({components})".format(ndim=data.ndim, components=n_components))
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

        logging.warning(str(traceback.format_exc()))

        return {'algorithm': algorithm,
                'inputHash': inputHash,
                'subsetHash': subsetHash,
                'n_components': n_components,
                'downsample': downsampled,
                'WARNING': traceback.format_exc()}

    if showPlot:
        codex_plot.plot_dimensionality(exp_var_ratio, "PCA Explained Variance", show=True)

    X_transformed = dim_r.fit_transform(data)
    exp_var_ratio = codex_explained_variance_ratio(X_transformed, n_components)

    endTime = time.time()
    computeTime = endTime - startTime
    logTime(
        "dimension_reduction",
        algorithm,
        computeTime,
        len(data),
        data.ndim)

    # print("saving out PCA")
    # outputHash = ch.hashArray('PCA_', X_transformed, "feature", virtual=True)

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
    logging.basicConfig(level=0, stream=sys.stdout)
    run_codex_doctest()

