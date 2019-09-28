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
from api.sub.return_code        import logReturnCode
from api.sub.codex_math         import impute
from api.sub.time_log           import getComputeTimeEstimate
from api.sub.time_log           import logTime
from api.sub.downsample         import downsample
from api.dimmension_reduction   import run_dim_reduction
from api.sub.labels             import label_swap
from api.sub.hash               import get_cache

from api.algorithm_manager import algorithm
class clustering(algorithm):
    def __init__(self, **super):
        algorithm.__init__(self, name='clustering', **super)


    def get_algorithm(self):

        print(self.algorithmName)
        '''

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
                    'WARNING': "{algorithm} not supported.".format(algorithm=algorithm)}
        '''

        return cluster.DBSCAN()



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

    '''
    cache = get_cache(session)

    if len(hashList) < 2:
        logging.warning("Clustering requires >= 2 features.")
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
        
        pca = run_dim_reduction(inputHash, subsetHash, {"n_components":2}, downsampled, False, "PCA", session=cache)
        result = run_codex_clustering(pca['outputHash'], subsetHash, downsampled, algorithmName, parms, session=cache)
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

    '''
    cache = get_cache(session)

    logReturnCode(inspect.currentframe())

    startTime = time.time()
    result = {'algorithm': algorithm,
              'downsample': downsampled,
              "WARNING":None}

    returnHash = cache.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        logging.warning("Clustering: run_codex_clustering: Hash not found. Returning!")
        return None

    X = returnHash['data']
    if X is None:
        return None

    if X.ndim < 2:
        logging.warning("ERROR: run_codex_clustering - insufficient data dimmensions")
        return None

    full_samples, full_features = X.shape
    result['eta'] = getComputeTimeEstimate("clustering", algorithm, full_samples, full_features)

    if subsetHash is not False:
        X = cache.applySubsetMask(X, subsetHash)
        if(X is None):
            logging.warning("ERROR: run_codex_clustering - subsetHash returned None.")
            return None

    if downsampled is not False:
        X = downsample(X, samples=downsampled, session=cache)
        logging.info("Downsampled to {samples} samples".format(samples=len(X)))

    computed_samples, computed_features = X.shape
    X = impute(X)
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
                'WARNING': "{algorithm} not supported.".format(algorithm=algorithm)}


    cluster_alg.fit(X)
    y_pred = cluster_alg.labels_.astype(np.int)

    # temporary to not change API right now
    merged_hash = cache.hashArray("temporary", X, "feature")
    y_pred = label_swap(y_pred, merged_hash["hash"], session=cache)
    label_hash = cache.hashArray(merged_hash["hash"], y_pred, "label")

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
    logTime("clustering", algorithm, computeTime, computed_samples, computed_features)

    result['message'] = "success"
    return result


