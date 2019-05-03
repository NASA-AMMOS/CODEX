
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
import traceback
import numpy as np
from sklearn.neighbors import kneighbors_graph
from sklearn import cluster

DEBUG = False

# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

# CODEX Support
import codex_return_code
import codex_math
import codex_time_log
import codex_doctest
import codex_plot
import codex_read_data_api
import codex_downsample
import codex_hash
import codex_dimmension_reduction_api
import codex_system
import codex_labels

def ml_cluster(
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
    >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = ml_cluster(inputHash, hashList, None, "kmean", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {})
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(inputHash, hashList, None, "kmeans", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {})
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(inputHash, hashList, None, "mean_shift", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {})
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(inputHash, hashList, None, "birch", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {})
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(inputHash, hashList, None, "ward", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {})
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(inputHash, hashList, None, "spectral", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {})
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(inputHash, hashList, None, "dbscan", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {})
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(inputHash, hashList, None, "agglomerative", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {})
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    >>> result = ml_cluster(inputHash, hashList, None, "affinity_propagation", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, {})
    {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}

    '''

    if len(hashList) < 2:
        codex_system.codex_log("Clustering requires >= 2 features.")
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
        
        pca = codex_dimmension_reduction_api.run_codex_dim_reduction(inputHash, subsetHash, {"n_components":2}, downsampled, False, "PCA")
        result = run_codex_clustering(inputHash, subsetHash, downsampled, algorithmName, parms)
        result['data'] = pca['data']

    except BaseException:
        codex_system.codex_log("Failed to clustering algorithm")
        result['message'] = "Failed to run clustering algorithm"
        codex_system.codex_log(traceback.format_exc())

    return result


def run_codex_clustering(inputHash, subsetHash, downsampled, algorithm, parms):
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

    codex_system.codex_log(str(parms))

    startTime = time.time()
    result = {'algorithm': algorithm,
              'downsample': downsampled}

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if returnHash is None:
        codex_system.codex_log(
            "Clustering: run_codex_clustering: Hash not found. Returning!")
        return None

    data = returnHash['data']
    if data is None:
        return None

    if subsetHash is not False:
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log(
                "ERROR: run_codex_clustering - subsetHash returned None.")
            return None

    if downsampled is not False:
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        result['eta'] = codex_time_log.getComputeTimeEstimate(
            "clustering", algorithm, samples)

    if data.ndim < 2:
        codex_system.codex_log(
            "ERROR: run_codex_clustering - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)
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

            cluster_alg = cluster.SpectralClustering(
                n_clusters=int(parms['k']),
                eigen_solver='arpack',
                affinity="nearest_neighbors")

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
        codex_system.codex_log(str(traceback.format_exc()))

        return {'algorithm': algorithm,
                'data': X.tolist(),
                'downsample': downsampled,
                'WARNING': traceback.format_exc()}



    cluster_alg.fit(X)
    y_pred = cluster_alg.labels_.astype(np.int)
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
    codex_time_log.logTime(
        "clustering",
        algorithm,
        computeTime,
        len(data),
        data.ndim)

    # temporary to not change API right now
    merged_hash = codex_hash.hashArray("temporary", X, "feature")
    label_hash = codex_hash.hashArray(merged_hash["hash"], y_pred, "label")
    y_pred = codex_labels.label_swap(y_pred, merged_hash["hash"])

    '''
    if subsetHash is False:
        returnCodeString = "codex_clustering_api.codex_clustering_kmeans('" + inputHash + "',False," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    else:
        returnCodeString = "codex_clustering_api.codex_clustering_kmeans('" + inputHash + "','" + subsetHash + "'," + str(k) + "," + str(True) + "," + str(downsampled) + ")\n"
    codex_return_code.logReturnCode(returnCodeString)
    '''


    return result



if __name__ == "__main__":

    import doctest
    results = doctest.testmod(verbose=True, optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)
