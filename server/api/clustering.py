
'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Clustering algorithms, formatted for CODEX

Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import time
import h5py
import inspect
import traceback
import logging

import numpy as np

from sklearn.neighbors import kneighbors_graph
from sklearn           import cluster

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.return_code                import logReturnCode
from api.sub.codex_math                 import codex_impute
from api.sub.codex_time_log             import getComputeTimeEstimate
from api.sub.codex_time_log             import logTime
from api.sub.codex_downsample           import downsample
from api.dimmension_reduction           import run_codex_dim_reduction
from api.sub.codex_labels               import label_swap
from api.sub.codex_hash                 import get_cache

def ml_cluster(
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
    >>> from api.sub.codex_doctest import doctest_get_data
    >>> testData = doctest_get_data()
    >>> from api.sub.codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)

    >>> result = ml_cluster(testData['inputHash'], testData['hashList'], None, "kmean", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=codex_hash)
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(testData['inputHash'], testData['hashList'], None, "kmeans", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=codex_hash)
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(testData['inputHash'], testData['hashList'], None, "mean_shift", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=codex_hash)
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(testData['inputHash'], testData['hashList'], None, "birch", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=codex_hash)
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(testData['inputHash'], testData['hashList'], None, "ward", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=codex_hash)
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(testData['inputHash'], testData['hashList'], None, "spectral", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=codex_hash)
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(testData['inputHash'], testData['hashList'], None, "dbscan", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=codex_hash)
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(testData['inputHash'], testData['hashList'], None, "agglomerative", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=codex_hash)
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(testData['inputHash'], testData['hashList'], None, "affinity_propagation", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {}, session=codex_hash)
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    '''
    codex_hash = get_cache(session)

    if len(hashList) < 2:
        logging.warning("Clustering requires >= 2 features.")
        return None

    if subsetHashName is not None:
        subsetHash = codex_hash.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False


    try:
        
        pca = run_codex_dim_reduction(inputHash, subsetHash, {"n_components":2}, downsampled, False, "PCA", session=codex_hash)
        result = run_codex_clustering(pca['outputHash'], subsetHash, downsampled, algorithmName, parms, session=codex_hash)
        result['data'] = pca['data']

    except BaseException:
        logging.warning("Failed to clustering algorithm")
        result['message'] = "Failed to run clustering algorithm"
        logging.warning(traceback.format_exc())

    return result


def run_codex_clustering(inputHash, subsetHash, downsampled, algorithm, parms, session=None):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        downsampled (int)   - number of data points to use for quicklook
        algorithm (string)  - Name of the classifier to run.  Follows Sklearn naming conventions.
                                Available keys:  

    Outputs:
        dictionary:
            algorithm (str)          - Name of the classifier which was run.  Will be same as algorithm input argument
            data (numpy.ndarray)     - (samples, features) array of features to cluster
            clusters (numpy.ndarray) -  array containing cluster index for each sample
            k (int)                  - number of clusters found
            downsample (int)         - number of data points used in quicklook
            numClusters (int)        - number of clusters calculated by the algorithm (unique of clusters)

    Examples:

    '''
    codex_hash = get_cache(session)

    logReturnCode(inspect.currentframe())
    logging.warning(str(parms))
    startTime = time.time()
    result = {'algorithm': algorithm,
              'downsample': downsampled,
              "WARNING":None}

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        logging.warning("Clustering: run_codex_clustering: Hash not found. Returning!")
        return None

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            logging.warning("ERROR: run_codex_clustering - subsetHash returned None.")
            return None

    full_samples = len(data)
    if downsampled is not False:
        logging.warning("Downsampling to {downsampled} samples".format(downsampled=downsampled))
        data = downsample(data, samples=downsampled, session=codex_hash)
        logging.warning("Downsampled to {samples} samples".format(samples=len(data)))

    result['eta'] = getComputeTimeEstimate("clustering", algorithm, full_samples)
    if data.ndim < 2:
        logging.warning("ERROR: run_codex_clustering - insufficient data dimmensions")
        return None

    X = data
    X = codex_impute(X)
    result['data'] = X.tolist()

    try:

        if(algorithm == "kmeans"):

            cluster_alg = cluster.MiniBatchKMeans(n_clusters=int(parms['k']))

        elif(algorithm == "mean_shift"):

            bandwidth = cluster.estimate_bandwidth(X, quantile=float(parms['quantile']))
            cluster_alg = cluster.MeanShift(bandwidth=bandwidth, bin_seeding=True)

        elif(algorithm == "affinity_propagation"):

            cluster_alg = cluster.AffinityPropagation(damping=float(parms['damping']))

        elif(algorithm == "birch"):

            cluster_alg = cluster.Birch(n_clusters=int(parms['k']))

        elif(algorithm == "ward"):

            connectivity = kneighbors_graph(X, n_neighbors=int(parms['n_neighbors']), include_self=False)
            connectivity = 0.5 * (connectivity + connectivity.T)
            cluster_alg = cluster.AgglomerativeClustering(n_clusters=int(parms['k']), linkage='ward', connectivity=connectivity)

        elif(algorithm == "spectral"):

            cluster_alg = cluster.SpectralClustering(n_clusters=int(parms['k']), eigen_solver='arpack', affinity="nearest_neighbors")

        elif(algorithm == "dbscan"):

            cluster_alg = cluster.DBSCAN(eps=float(parms['eps']))

        elif(algorithm == "agglomerative"):

            connectivity = kneighbors_graph(X, n_neighbors=int(parms['n_neighbors']), include_self=False)
            connectivity = 0.5 * (connectivity + connectivity.T)

            cluster_alg = cluster.AgglomerativeClustering(
                linkage="average",
                affinity="cityblock",
                n_clusters=int(parms['k']),
                connectivity=connectivity)

        else:
            return {'algorithm': algorithm,
                    'data': X.tolist(),
                    'downsample': downsampled,
                    'WARNING': algorithm + " not supported."}

    except:
        logging.warning(str(traceback.format_exc()))

        return {'algorithm': algorithm,
                'data': X.tolist(),
                'downsample': downsampled,
                'WARNING': traceback.format_exc()}



    cluster_alg.fit(X)
    y_pred = cluster_alg.labels_.astype(np.int)

    # temporary to not change API right now
    merged_hash = codex_hash.hashArray("temporary", X, "feature")
    y_pred = label_swap(y_pred, merged_hash["hash"], session=codex_hash)
    label_hash = codex_hash.hashArray(merged_hash["hash"], y_pred, "label")

    result['numClusters'] = np.unique(y_pred).size
    result['clusters'] = y_pred.tolist()

    try:
        centers = cluster_alg.cluster_centers_
        result['centers'] = centers.tolist()
    except:
        centers = None
        result['centers'] = None

    endTime = time.time()
    computeTime = endTime - startTime
    logTime(
        "clustering",
        algorithm,
        computeTime,
        len(data),
        data.ndim)

    result['message'] = "success"
    return result



if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()

    
