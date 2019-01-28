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
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from scipy import misc
from random import randint
from sklearn import cluster, datasets
from sklearn.neighbors import kneighbors_graph
from sklearn.preprocessing import StandardScaler
from json import dumps, loads, JSONEncoder, JSONDecoder
import pickle
from decimal import *
import traceback

DEBUG = False

# Enviornment variable for setting CODEX root directory.
CODEX_ROOT  = os.getenv('CODEX_ROOT')
sys.path.insert(1,CODEX_ROOT + '/api/sub/')

# CODEX Support
import codex_labels, codex_system
import codex_dimmension_reduction_api
import codex_hash, codex_return_code, codex_downsample
import codex_read_data_api, codex_plot
import codex_doctest, codex_time_log, codex_math

def ml_cluster(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> (inputHash,hashList,template, labelHash) = codex_doctest.doctest_get_data()

    # Missing algorithmType
    >>> result = ml_cluster(inputHash, hashList, None, "kmean", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9, 'downsampled': 500}, {})

    >>> result = ml_cluster(inputHash, hashList, None, "kmeans", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9, 'downsampled': 500}, {})

    >>> result = ml_cluster(inputHash, hashList, None, "mean_shift", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9, 'downsampled': 500}, {})

    >>> result = ml_cluster(inputHash, hashList, None, "birch", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9, 'downsampled': 500}, {})

    >>> result = ml_cluster(inputHash, hashList, None, "ward", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9, 'downsampled': 500}, {})

    >>> result = ml_cluster(inputHash, hashList, None, "spectral", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9, 'downsampled': 500}, {})

    >>> result = ml_cluster(inputHash, hashList, None, "dbscan", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9, 'downsampled': 500}, {})

    >>> result = ml_cluster(inputHash, hashList, None, "agglomerative", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9, 'downsampled': 500}, {})

    >>> result = ml_cluster(inputHash, hashList, None, "affinity_propagation", False, {'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9, 'downsampled': 500}, {})

    >>> result = ml_cluster(inputHash, hashList, None, "kmeans", False, {}, {})
    K parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'k'
    <BLANKLINE>

    >>> result = ml_cluster(inputHash, hashList, None, "mean_shift", False, {}, {})
    Quantile parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'quantile'
    <BLANKLINE>

    >>> result = ml_cluster(inputHash, hashList, None, "birch", False, {}, {})
    k parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'k'
    <BLANKLINE>

    >>> result = ml_cluster(inputHash, hashList, None, "ward", False, {}, {})
    n_neighbors, or k parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'n_neighbors'
    <BLANKLINE>

    >>> result = ml_cluster(inputHash, hashList, None, "spectral", False, {}, {})
    k parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'k'
    <BLANKLINE>

    >>> result = ml_cluster(inputHash, hashList, None, "dbscan", False, {}, {})
    eps parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'eps'
    <BLANKLINE>

    >>> result = ml_cluster(inputHash, hashList, None, "agglomerative", False, {}, {})
    n_neighbors parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'n_neighbors'
    <BLANKLINE>

    >>> result = ml_cluster(inputHash, hashList, None, "affinity_propagation", False, {}, {})
    damping parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'damping'
    <BLANKLINE>

    '''

    if(len(hashList) < 2):
        codex_system.codex_log("Clustering requires >= 2 features.")
        return None      

    if(subsetHashName != None):
        subsetHash = codex_hash.findHashArray("name", subsetHashName,"subset")
        if(subsetHash == None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    if(algorithmName == 'kmeans'):
        try:
            k = int(parms['k'])
        except:
            codex_system.codex_log("K parameter not set")
            result['message'] = "K parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            pca = codex_dimmension_reduction_api.codex_decomposition_PCA(inputHash, subsetHash, 2, True, False, False)
            result = codex_clustering_kmeans(pca["outputHash"], False, k, False, downsampled)
        except:
            codex_system.codex_log("Failed to run k-means clustering algorithm")
            result['message'] = "Failed to run k-means clustering algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None
    
    elif(algorithmName == 'mean_shift'):
        try:
            quantile = float(parms["quantile"])
        except:
            codex_system.codex_log("Quantile parameter not set")
            result['message'] = "Quantile parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            pca = codex_dimmension_reduction_api.codex_decomposition_PCA(inputHash, subsetHash, 2, True, False, False)
            result = codex_clustering_mean_shift(pca["outputHash"], False, quantile, False, downsampled)
        except:
            codex_system.codex_log("Failed to run mean-shift clustering algorithm")
            result['message'] = "Failed to run mean-shift clustering algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif(algorithmName == 'birch'):
        try:
            k = int(parms["k"])
        except:
            codex_system.codex_log("k parameter not set")
            result['message'] = "k parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            pca = codex_dimmension_reduction_api.codex_decomposition_PCA(inputHash, subsetHash, 2, True, False, False)
            result = codex_clustering_birch(pca["outputHash"], False, k, False, downsampled)
        except:
            codex_system.codex_log("Failed to run birch clustering algorithm")
            result['message'] = "Failed to run birch clustering algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif(algorithmName == 'ward'):
        try:
            num_neighbors =  int(parms["n_neighbors"])
            k = int(parms["k"])
        except:
            codex_system.codex_log("n_neighbors, or k parameter not set")
            result['message'] = "n_neighbors, or k parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            pca = codex_dimmension_reduction_api.codex_decomposition_PCA(inputHash, subsetHash, 2, True, False, False)
            result = codex_clustering_ward(pca["outputHash"], False, num_neighbors, k, False, downsampled)
        except:
            codex_system.codex_log("Failed to run ward clustering algorithm")
            result['message'] = "Failed to run ward clustering algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif(algorithmName == 'spectral'):
        try:
            k = int(parms["k"])
        except:
            codex_system.codex_log("k parameter not set")
            result['message'] = "k parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            pca = codex_dimmension_reduction_api.codex_decomposition_PCA(inputHash, subsetHash, 2, True, False, False)
            result = codex_clustering_spectral(pca["outputHash"], False, k, False, downsampled)
        except:
            codex_system.codex_log("Failed to run spectral clustering algorithm")
            result['message'] = "Failed to run spectral clustering algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif(algorithmName == 'dbscan'):
        try:
            eps = float(parms["eps"])
        except:
            codex_system.codex_log("eps parameter not set")
            result['message'] = "eps parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            pca = codex_dimmension_reduction_api.codex_decomposition_PCA(inputHash, subsetHash, 2, True, False, False)
            result = codex_clustering_dbScan(pca["outputHash"], False, eps, False, downsampled)
        except:
            codex_system.codex_log("Failed to run dbScan clustering algorithm")
            result['message'] = "Failed to run dbScan clustering algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif(algorithmName == 'agglomerative'):
        try:
            num_neighbors = int(parms["n_neighbors"])
        except:
            codex_system.codex_log("n_neighbors parameter not set")
            result['message'] = "n_neighbors parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            k = int(parms['k'])
        except:
            codex_system.codex_log("K parameter not set")
            result['message'] = "K parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            pca = codex_dimmension_reduction_api.codex_decomposition_PCA(inputHash, subsetHash, 2, True, False, False)
            result = codex_clustering_agglomerative(pca["outputHash"], False, num_neighbors, k, False, downsampled)
        except:
            codex_system.codex_log("Failed to run agglomerative clustering algorithm")
            result['message'] = "Failed to run agglomerative clustering algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None


    elif(algorithmName == "affinity_propagation"):
        try:
            damping = float(parms["damping"])
        except:
            codex_system.codex_log("damping parameter not set")
            result['message'] = "damping parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            pca = codex_dimmension_reduction_api.codex_decomposition_PCA(inputHash, subsetHash, 2, True, False, False)
            result = codex_clustering_affinity_propagation(pca["outputHash"], False, damping, False, downsampled)
        except:
            codex_system.codex_log("Failed to run affinity propagation clustering algorithm")
            result['message'] = "Failed to run affinity propagation clustering algorithm"
            codex_system.codex_log(traceback.format_exc())
            return None

    else:
        result['message'] = "Cannot find requested clustering algorithm"
    
    return result


def codex_clustering_kmeans(inputHash, subsetHash, k, showPlot, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        k (int)             - number of clusters
        showPlot (bool)     - show the matplotlib plot (turned off for CODEX API / on for standalone python script output)
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)       - "K-Means"
            centers (numpy.ndarray)  - (k,2) array containing coordinates for centroid of each cluster
            data (numpy.ndarray)     - (samples, features) array of features to cluster
            clusters (numpy.ndarray) -  array containing cluster index for each sample
            k (int)                  - number of clusters found
            downsample (int)         - number of data points used in quicklook
            numClusters (int)        - number of clusters calculated by the algorithm (unique of clusters)

    Examples:
    >>> codex_clustering_kmeans(None, None, 2, False, False)
    Clustering: Kmeans: Hash not found. Returning!

    >>> x1 = np.array([2,3,1,0])
    >>> feature = codex_hash.hashArray("x1_feature", x1, "feature")
    >>> codex_clustering_kmeans(feature["hash"],None,2,False,False)
    Hash not found. Returning!
    ERROR: codex_clustering_kmeans - subsetHash returned None.

    # Check for low dimmensionality
    >>> codex_clustering_kmeans(feature["hash"],False,2,False,False)
    ERROR: codex_clustering_kmeans - insufficient data dimmensions

    # Nominal
    >>> (x1,hashList,template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_clustering_kmeans(x1, False, 2, False, 40)
    Downsampling to 40 percent
    >>> print(len(result["centers"]))
    2
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Clustering: Kmeans: Hash not found. Returning!")
        return None

    data = returnHash['data']
    if(data is None):
        return None

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_clustering_kmeans - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "kmeans", samples)

    if(data.ndim < 2):
        codex_system.codex_log("ERROR: codex_clustering_kmeans - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    algorithm = cluster.MiniBatchKMeans(n_clusters=int(k))
    algorithm.fit(X)

    y_pred = algorithm.labels_.astype(np.int)

    centers = algorithm.cluster_centers_
    plotName = "Mini Batch KMeans Clustering"

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("clustering", "kmeans", computeTime, len(data), data.ndim)

    if showPlot:
        codex_plot.plot_clustering(X, y_pred, centers, plotName, show=True)

    if DEBUG:
        codex_plot.plot_clustering(X, y_pred, centers, plotName, save=True)

    merged_hash = codex_hash.hashArray("temporary", X, "feature") # temporary to not change API right now
    label_hash = codex_hash.hashArray(merged_hash["hash"], y_pred, "label")
    y_pred = codex_labels.label_swap(y_pred, merged_hash["hash"])

    if(subsetHash is False):
        returnCodeString = "codex_clustering_api.codex_clustering_kmeans('"+inputHash+"',False,"+str(k)+","+str(True)+","+str(downsampled)+")\n" 
    else:
        returnCodeString = "codex_clustering_api.codex_clustering_kmeans('"+inputHash+"','"+subsetHash+"',"+str(k)+","+str(True)+","+str(downsampled)+")\n" 
    codex_return_code.logReturnCode(returnCodeString)

    output = {'eta': eta,'algorithm': 'K-Means','centers': centers.tolist(), 'data': X.tolist(), 'clusters': y_pred.tolist(), 'k': k, 'downsample': downsampled, 'numClusters': np.unique(y_pred).size}
    return output

def codex_clustering_mean_shift(inputHash, subsetHash, quantile, showPlot, downsampled):
    '''
    Inputs:
        inputHash (string)     - hash value corresponding to the data to cluster
        subsetHash (string)    - hash value corresponding to the subselection (false if full feature)
        quantile (float) [0,1] - Estimation of parise distances used in calculating bandwidth used in RBF kernel
        showPlot (bool)        - show the matplotlib plot (turned off for CODEX API / on for standalone python script output)
        downsampled (int)      - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string) - "Mean Shift"
            centers (numpy.ndarray) - (k,2) array containing coordinates for centroid of each cluster
            data (numpy.ndarray) - (samples, features) array of features to cluster
            clusters (numpy.ndarray) -  array containing cluster index for each sample
            quantile (float) - Estimation of parise distances used in calculating bandwidth used in RBF kernel
            downsample (int) - number of data points used in quicklook
            numClusters (int)        - number of clusters calculated by the algorithm (unique of clusters)

    Examples:
    >>> codex_clustering_mean_shift(None,None,2,False,False)
    Hash not found. Returning!

    >>> x1 = np.array([2,3,1,0])
    >>> feature = codex_hash.hashArray("x1_feature", x1, "feature")
    >>> codex_clustering_mean_shift(feature["hash"],None,2,False,False)
    Hash not found. Returning!
    ERROR: codex_clustering_mean_shift - subsetHash returned None.

    # Check for low dimmensionality
    >>> codex_clustering_mean_shift(feature["hash"],False,2,False,False)
    ERROR: codex_clustering_mean_shift - insufficient data dimmensions

    # Nominal
    >>> (x1,hashList,template, labelHash) = codex_doctest.doctest_get_data()
    >>> result = codex_clustering_mean_shift(x1,False,0.3,False,40)
    Downsampling to 40 percent

    # out of bounds quantile
    >>> result = codex_clustering_mean_shift(x1,False,1.1,False,False)
    ERROR: codex_clustering_mean_shift - quantile out of bounds: 1.1
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if(data is None):
        return None

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_clustering_mean_shift - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "mean_shift", samples)

    if(data.ndim < 2):
        codex_system.codex_log("ERROR: codex_clustering_mean_shift - insufficient data dimmensions")
        return None

    if(float(quantile) < 0.0 or float(quantile) > 1.0):
        codex_system.codex_log("ERROR: codex_clustering_mean_shift - quantile out of bounds: " + str(quantile))
        return None

    X = data
    X = codex_math.codex_impute(X)

    bandwidth = cluster.estimate_bandwidth(X, quantile=float(quantile))

    algorithm = cluster.MeanShift(bandwidth=bandwidth, bin_seeding=True)
    algorithm.fit(X)

    y_pred = algorithm.labels_.astype(np.int)
    centers = algorithm.cluster_centers_

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("clustering", "mean_shift", computeTime, len(data), data.ndim)

    if showPlot:
        codex_plot.plot_clustering(X, y_pred, centers, "Mean Shift Clustering", show=True)

    if DEBUG:
        codex_plot.plot_clustering(X, y_pred, centers, "Mean Shift Clustering", save=True)

    merged_hash = codex_hash.hashArray("temporary", X, "feature") # temporary to not change API right now
    label_hash = codex_hash.hashArray(merged_hash["hash"], y_pred, "label")
    y_pred = codex_labels.label_swap(y_pred, merged_hash["hash"])

    if(subsetHash is False):
        returnCodeString = "codex_clustering_api.codex_clustering_mean_shift('"+inputHash+"',False,"+str(quantile)+","+str(True)+","+str(downsampled)+")\n" 
    else:
        returnCodeString = "codex_clustering_api.codex_clustering_mean_shift('"+inputHash+"','"+subsetHash+"',"+str(quantile)+","+str(True)+","+str(downsampled)+")\n" 
    codex_return_code.logReturnCode(returnCodeString)

    output = {'eta':eta,'algorithm': 'Mean Shift','centers': centers.tolist(), 'data': X.tolist(), 'clusters': y_pred.tolist(), 'quantile': quantile, 'downsample': downsampled, 'numClusters': np.unique(y_pred).size}
    return output

def codex_clustering_affinity_propagation(inputHash, subsetHash, damping, showPlot, downsampled):
    '''
    Inputs:
        inputHash (string)       - hash value corresponding to the data to cluster
        subsetHash (string)      - hash value corresponding to the subselection (false if full feature)
        damping (float) [0.5, 1] - Damping factor
        showPlot (bool)          - show the matplotlib plot (turned off for CODEX API / on for standalone python script output)
        downsampled (int)        - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)         - "Affinity Propagation"
            centers (np.ndarray)       - (k,2) array containing coordinates for centroid of each cluster
            data (np.ndarray)          - (samples, features) array of features to cluster
            clusters (np.ndarray)      - Array containing cluster index for each sample
            damping (float)            - Damping factor
            downsample (int)           - number of data points used in quicklook
            numClusters (int)        - number of clusters calculated by the algorithm (unique of clusters)

    Examples:
    >>> codex_clustering_affinity_propagation(None,None,0.9,False,False)
    Hash not found. Returning!

    >>> x1 = np.array([2,3,1,0])
    >>> feature = codex_hash.hashArray("x1_feature", x1, "feature")
    >>> codex_clustering_affinity_propagation(feature["hash"],None,0.9,False,False)
    Hash not found. Returning!
    ERROR: codex_clustering_affinity_propagation - subsetHash returned None.

    # Check for low dimmensionality
    >>> codex_clustering_affinity_propagation(feature["hash"],False,0.9,False,False)
    ERROR: codex_clustering_affinity_propagation - insufficient data dimmensions

    # Nominal
    >>> (x1,hashList,template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_clustering_affinity_propagation(x1,False,0.9,False,40)
    Downsampling to 40 percent
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if(data is None):
        return None

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_clustering_affinity_propagation - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "affinity_propagation", samples)

    if(data.ndim < 2):
        codex_system.codex_log("ERROR: codex_clustering_affinity_propagation - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    algorithm = cluster.AffinityPropagation(damping=float(damping))
    algorithm.fit(X)

    y_pred = algorithm.labels_.astype(np.int)
    centers = algorithm.cluster_centers_

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("clustering", "affinity_propagation", computeTime, len(data), data.ndim)

    if showPlot:
        codex_plot.plot_clustering(X, y_pred, centers, "Affinity Propagation Clustering", show=True)

    if DEBUG:
        codex_plot.plot_clustering(X, y_pred, centers, "Affinity Propagation Clustering", save=True)
    
    merged_hash = codex_hash.hashArray("temporary", X, "feature") # temporary to not change API right now
    label_hash = codex_hash.hashArray(merged_hash["hash"], y_pred, "label")
    y_pred = codex_labels.label_swap(y_pred, merged_hash["hash"])

    if(subsetHash is False):
        returnCodeString = "codex_clustering_api.codex_clustering_affinity_propagation('"+inputHash+"',False,"+str(damping)+","+str(True)+","+str(downsampled)+")\n" 
    else:
        returnCodeString = "codex_clustering_api.codex_clustering_affinity_propagation('"+inputHash+"','"+subsetHash+"',"+str(damping)+","+str(True)+","+str(downsampled)+")\n"  
    codex_return_code.logReturnCode(returnCodeString)

    output = {'eta': eta,'algorithm': 'Affinity Propagation','centers': centers.tolist(), 'data': X.tolist(), 'clusters': y_pred.tolist(), 'damping':damping, 'downsample':downsampled, 'numClusters': np.unique(y_pred).size}
    return output

def codex_clustering_birch(inputHash, subsetHash, k, showPlot, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        k (int)    - Number of clusters after the final clustering step, which treats the subclusters 
                                from the leaves as new samples.
        showPlot (bool)     - show the matplotlib plot (turned off for CODEX API / on for standalone python script output)
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)    - "Birch"
            centers (np.ndarray)  - (k,2) array containing coordinates for centroid of each cluster
            data (np.ndarray)     - (samples, features) array of features to cluster
            clusters (np.ndarray) -  array containing cluster index for each sample
            k (int)      - Number of clusters after the final clustering step, which treats the subclusters 
                                        from the leaves as new samples.
            downsample (int)      - number of data points used in quicklook
            numClusters (int)     - number of clusters calculated by the algorithm (unique of clusters)

    Examples:
    >>> codex_clustering_birch(None,None,2,False,False)
    Hash not found. Returning!

    >>> x1 = np.array([2,3,1,0])
    >>> feature = codex_hash.hashArray("x1_feature", x1, "feature")
    >>> codex_clustering_birch(feature["hash"],None,2,False,False)
    Hash not found. Returning!
    ERROR: codex_clustering_birch - subsetHash returned None.

    # Check for low dimmensionality
    >>> codex_clustering_birch(feature["hash"],False,2,False,False)
    ERROR: codex_clustering_birch - insufficient data dimmensions

    # Nominal
    >>> (x1,hashList,template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_clustering_birch(x1,False,2,False,40)
    Downsampling to 40 percent
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if(data is None):
        return None

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_clustering_birch - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "birch", samples)

    if(data.ndim < 2):
        codex_system.codex_log("ERROR: codex_clustering_birch - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    algorithm = cluster.Birch(n_clusters=int(k))
    algorithm.fit(X)	

    y_pred = algorithm.labels_.astype(np.int)
    centers = None

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("clustering", "birch", computeTime, len(data), data.ndim)

    if showPlot:
        codex_plot.plot_clustering(X, y_pred, centers, "Birch Clustering", show=True)

    if DEBUG:
        codex_plot.plot_clustering(X, y_pred, centers, "Birch Clustering", save=True)

    merged_hash = codex_hash.hashArray("temporary", data, "feature") # temporary to not change API right now
    label_hash = codex_hash.hashArray(merged_hash["hash"], y_pred, "label")
    y_pred = codex_labels.label_swap(y_pred, merged_hash["hash"])

    if(subsetHash is False):
        returnCodeString = "codex_clustering_api.codex_clustering_birch('"+inputHash+"',False,"+str(k)+","+str(True)+","+str(downsampled)+")\n"  
    else:
        returnCodeString = "codex_clustering_api.codex_clustering_birch('"+inputHash+"','"+subsetHash+"',"+str(k)+","+str(True)+","+str(downsampled)+")\n" 
    codex_return_code.logReturnCode(returnCodeString)

    output = {'eta': eta, 'algorithm': 'Birch', 'centers': centers, 'data': X.tolist(), 'clusters': y_pred.tolist(), 'k': k, 'downsample': downsampled, 'numClusters': np.unique(y_pred).size}
    return output


def codex_clustering_ward(inputHash, subsetHash, n_neighbors, k, showPlot, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        n_neighbors (int)   - The number of connected components in the graph defined by the connectivity matrix.
        k (int)    - Number of clusters after the final clustering step, which treats the subclusters 
                                from the leaves as new samples.
        showPlot (bool)     - show the matplotlib plot (turned off for CODEX API / on for standalone python script output)
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)     - "Ward"
            centers (np.ndarray)   - (k,2) array containing coordinates for centroid of each cluster
            data (np.ndarray)      - (samples, features) array of features to cluster
            clusters (np.ndarray)  -  array containing cluster index for each sample
            n_neighbors (int)      - The number of connected components in the graph defined by the connectivity matrix.
            k (int)       - Number of clusters after the final clustering step, which treats the subclusters
                                        from the leaves as new samples.
            downsample (int)       - number of data points used in quicklook
            numClusters (int)      - number of clusters calculated by the algorithm (unique of clusters)

    Examples:
    >>> codex_clustering_ward(None,None,10,2,False,False)
    Hash not found. Returning!

    >>> x1 = np.array([2,3,1,0])
    >>> feature = codex_hash.hashArray("x1_feature", x1, "feature")
    >>> codex_clustering_ward(feature["hash"],None,10,2,False,False)
    Hash not found. Returning!
    ERROR: codex_clustering_ward - subsetHash returned None.

    # Check for low dimmensionality
    >>> codex_clustering_ward(feature["hash"],False,10,2,False,False)
    ERROR: codex_clustering_ward - insufficient data dimmensions

    # Nominal
    >>> (x1,hashList,template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_clustering_ward(x1, False, 10, 2, False, 40)
    Downsampling to 40 percent
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if(data is None):
        return None

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_clustering_ward - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "ward", samples)

    if(data.ndim < 2):
        print("ERROR: codex_clustering_ward - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    connectivity = kneighbors_graph(X, n_neighbors=int(n_neighbors), include_self=False)
    connectivity = 0.5 * (connectivity + connectivity.T)

    algorithm = cluster.AgglomerativeClustering(n_clusters=int(k), linkage='ward', connectivity=connectivity)
    algorithm.fit(X)

    y_pred = algorithm.labels_.astype(np.int)
    centers = None

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("clustering", "ward", computeTime, len(data), data.ndim)

    if showPlot:
        codex_plot.plot_clustering(X, y_pred, centers, "Ward Clustering", show=True)

    if DEBUG:
        codex_plot.plot_clustering(X, y_pred, centers, "Ward Clustering", save=True)


    merged_hash = codex_hash.hashArray("temporary", data, "feature") # temporary to not change API right now
    label_hash = codex_hash.hashArray(merged_hash["hash"], y_pred, "label")
    y_pred = codex_labels.label_swap(y_pred, merged_hash["hash"])

    if(subsetHash is False):
        returnCodeString = "codex_clustering_api.codex_clustering_ward('"+inputHash+"',False,"+str(n_neighbors)+","+str(k)+","+str(True)+","+str(downsampled)+")\n" 
    else:
        returnCodeString = "codex_clustering_api.codex_clustering_ward('"+inputHash+"','"+subsetHash+"',"+str(n_neighbors)+","+str(k)+","+str(True)+","+str(downsampled)+")\n" 
    codex_return_code.logReturnCode(returnCodeString)

    output = {'eta': eta,'algorithm': 'Ward', 'centers': centers, 'data': X.tolist(), 'clusters': y_pred.tolist(), 'n_neighbors': n_neighbors, 'k': k, 'downsample': downsampled, 'numClusters': np.unique(y_pred).size}
    return output

def codex_clustering_spectral(inputHash, subsetHash, k, showPlot, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        k (int)    - Number of clusters after the final clustering step, which treats the subclusters 
                                from the leaves as new samples.
        showPlot (bool)     - show the matplotlib plot (turned off for CODEX API / on for standalone python script output)
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)    - "Spectral"
            centers (np.ndarray)  - (k,2) array containing coordinates for centroid of each cluster
            data (np.ndarray)     - (samples, features) array of features to cluster
            clusters (np.ndarray) -  array containing cluster index for each sample
            k (int)      - Number of clusters after the final clustering step, which treats the subclusters
                                        from the leaves as new samples.
            downsample (int)      - number of data points used in quicklook
            numClusters (int)     - number of clusters calculated by the algorithm (unique of clusters)

    Examples:
    >>> codex_clustering_spectral(None,None,0.2,False,False)
    Hash not found. Returning!

    >>> x1 = np.array([2,3,1,0])
    >>> feature = codex_hash.hashArray("x1_feature", x1, "feature")
    >>> codex_clustering_spectral(feature["hash"],None,2,False,False)
    Hash not found. Returning!
    ERROR: codex_clustering_spectral - subsetHash returned None.

    # Check for low dimmensionality
    >>> codex_clustering_spectral(feature["hash"],False,2,False,False)
    ERROR: codex_clustering_spectral - insufficient data dimmensions

    # Nominal
    >>> (x1, hashList, template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_clustering_spectral(x1, False, 2, False, 40)
    Downsampling to 40 percent
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if(data is None):
        return None

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_clustering_spectral - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "spectral", samples)

    if(data.ndim < 2):
        codex_system.codex_log("ERROR: codex_clustering_spectral - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    algorithm = cluster.SpectralClustering(n_clusters=int(k), eigen_solver='arpack', affinity="nearest_neighbors")
    algorithm.fit(X)

    y_pred = algorithm.labels_.astype(np.int)
    centers = None

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("clustering", "spectral", computeTime, len(data), data.ndim)

    if showPlot:
        codex_plot.plot_clustering(X, y_pred, centers, "Spectral Clustering", show=True)

    if DEBUG:
        codex_plot.plot_clustering(X, y_pred, centers, "Spectral Clustering", save=True)


    merged_hash = codex_hash.hashArray("temporary", data, "feature") # temporary to not change API right now
    label_hash = codex_hash.hashArray(merged_hash["hash"], y_pred, "label")
    y_pred = codex_labels.label_swap(y_pred, merged_hash["hash"])

    if(subsetHash is False):
        returnCodeString = "codex_clustering_api.codex_clustering_spectral('"+inputHash+"',False,"+str(k)+","+str(True)+","+str(downsampled)+")\n" 
    else:
        returnCodeString = "codex_clustering_api.codex_clustering_spectral('"+inputHash+"','"+subsetHash+"',"+str(k)+","+str(True)+","+str(downsampled)+")\n" 
    codex_return_code.logReturnCode(returnCodeString)

    output = {'eta': eta,'algorithm': "Spectral", 'centers': centers, 'data': X.tolist(), 'clusters': y_pred.tolist(), 'k': k, 'downsample': downsampled, 'numClusters': np.unique(y_pred).size}
    return output


def codex_clustering_dbScan(inputHash, subsetHash, eps, showPlot, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        eps (float)         - The maximum distance between two samples for them to be considered as in the same neighborhood
        showPlot (bool)     - show the matplotlib plot (turned off for CODEX API / on for standalone python script output)
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)    - "DB Scan"
            centers (np.ndarray)  - (k,2) array containing coordinates for centroid of each cluster
            data (np.ndarray)     - (samples, features) array of features to cluster
            clusters (np.ndarray) -  array containing cluster index for each sample
            eps (float)           - The maximum distance between two samples for them to be considered as in the same neighborhood
            downsample (int)      - number of data points used in quicklook
            numClusters (int)     - number of clusters calculated by the algorithm (unique of clusters)

    Examples:
    >>> codex_clustering_dbScan(None,None,0.2,False,False)
    Hash not found. Returning!

    >>> x1 = np.array([2,3,1,0])
    >>> feature = codex_hash.hashArray("x1_feature", x1, "feature")
    >>> codex_clustering_dbScan(feature["hash"],None,0.2,False,False)
    Hash not found. Returning!
    ERROR: codex_clustering_dbScan - subsetHash returned None.

    # Check for low dimmensionality
    >>> codex_clustering_dbScan(feature["hash"],False,0.2,False,False)
    ERROR: codex_clustering_dbScan - insufficient data dimmensions

    # Nominal
    >>> (x1, hashList, template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_clustering_dbScan(x1, False, 0.2, False, 40)
    Downsampling to 40 percent
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if(data is None):
        return None

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_clustering_dbScan - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "dbscan", samples)

    if(data.ndim < 2):
        codex_system.codex_log("ERROR: codex_clustering_dbScan - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    algorithm = cluster.DBSCAN(eps=float(eps))
    algorithm.fit(X)

    y_pred = algorithm.labels_.astype(np.int)
    centers = None

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("clustering", "dbscan", computeTime, len(data), data.ndim)

    if showPlot:
        codex_plot.plot_clustering(X, y_pred, centers, "DBSCAN Clustering", show=True)

    if DEBUG:
        codex_plot.plot_clustering(X, y_pred, centers, "DBSCAN Clustering", save=True)


    merged_hash = codex_hash.hashArray("temporary", data, "feature") # temporary to not change API right now
    label_hash = codex_hash.hashArray(merged_hash["hash"], y_pred, "label")
    y_pred = codex_labels.label_swap(y_pred, merged_hash["hash"])

    if(subsetHash is False):
        returnCodeString = "codex_clustering_api.codex_clustering_dbScan('"+inputHash+"',False,"+str(eps)+","+str(True)+","+str(downsampled)+")\n" 
    else:
        returnCodeString = "codex_clustering_api.codex_clustering_dbScan('"+inputHash+"','"+subsetHash+"',"+str(eps)+","+str(True)+","+str(downsampled)+")\n" 
    codex_return_code.logReturnCode(returnCodeString)

    output = {'eta': eta,'algorithm': 'DB Scan', 'centers': centers, 'data': X.tolist(), 'clusters': y_pred.tolist(), 'eps': eps, 'downsample': downsampled, 'numClusters': np.unique(y_pred).size}
    return output

def codex_clustering_agglomerative(inputHash, subsetHash, n_neighbors, k, showPlot, downsampled):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        n_neighbors (int)   - The number of connected components in the graph defined by the connectivity matrix.
        showPlot (bool)     - show the matplotlib plot (turned off for CODEX API / on for standalone python script output)
        downsampled (int)   - number of data points to use for quicklook

    Outputs:
        dictionary:
            algorithm (string)    - "Agglomerative"
            centers (np.ndarray)  - (k,2) array containing coordinates for centroid of each cluster
            data (np.ndarray)     - (samples, features) array of features to cluster
            clusters (np.ndarray) -  array containing cluster index for each sample
            n_neighbors (int)     - The number of connected components in the graph defined by the connectivity matrix.
            downsample (int)      - number of data points used in quicklook
            numClusters (int)     - number of clusters calculated by the algorithm (unique of clusters)

    Examples:
    >>> codex_clustering_agglomerative(None, None, 2, 3, False, False)
    Hash not found. Returning!

    >>> x1 = np.array([2,3,1,0])
    >>> feature = codex_hash.hashArray("x1_feature", x1, "feature")
    >>> codex_clustering_agglomerative(feature["hash"], None, 2, 3, False, False)
    Hash not found. Returning!
    ERROR: codex_clustering_agglomerative - subsetHash returned None.

    # Check for low dimmensionality
    >>> codex_clustering_agglomerative(feature["hash"], False, 2, 3, False, False)
    ERROR: codex_clustering_agglomerative - insufficient data dimmensions

    # Nominal
    >>> (x1, hashList, template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_clustering_agglomerative(x1, False, 2, 3, False, 40)
    Downsampling to 40 percent
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    if(data is None):
        return None

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_clustering_agglomerative - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " percent")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("clustering", "agglomerative", samples)

    if(data.ndim < 2):
        codex_system.codex_log("ERROR: codex_clustering_agglomerative - insufficient data dimmensions")
        return None

    X = data
    X = codex_math.codex_impute(X)

    connectivity = kneighbors_graph(X, n_neighbors=int(n_neighbors), include_self=False)
    connectivity = 0.5 * (connectivity + connectivity.T)

    algorithm = cluster.AgglomerativeClustering(linkage="average", affinity="cityblock", n_clusters=int(k), connectivity=connectivity)

    algorithm.fit(X)

    y_pred = algorithm.labels_.astype(np.int)
    centers = None

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("clustering", "agglomerative", computeTime, len(data), data.ndim)

    if showPlot:
        codex_plot.plot_clustering(X, y_pred, centers, "Agglomerative Clustering", show=True)

    if DEBUG:
        codex_plot.plot_clustering(X, y_pred, centers, "Agglomerative Clustering", save=True)


    merged_hash = codex_hash.hashArray("temporary", data, "feature") # temporary to not change API right now
    label_hash = codex_hash.hashArray(merged_hash["hash"], y_pred, "label")
    y_pred = codex_labels.label_swap(y_pred, merged_hash["hash"])

    if(subsetHash is False):
        returnCodeString = "codex_clustering_api.codex_clustering_agglomerative('"+inputHash+"',False,"+str(n_neighbors)+","+str(k)+","+str(True)+","+str(downsampled)+")\n"
    else:
        returnCodeString = "codex_clustering_api.codex_clustering_agglomerative('"+inputHash+"','"+subsetHash+"',"+str(n_neighbors)+","+str(k)+","+str(True)+","+str(downsampled)+")\n"
    codex_return_code.logReturnCode(returnCodeString)

    output = {'eta': eta,'algorithm': 'Agglomerative', 'centers': centers, 'data': X.tolist(), 'clusters': y_pred.tolist(), 'k': k, 'n_neighbors': n_neighbors, 'downsample': downsampled, 'numClusters': np.unique(y_pred).size}
    return output

if __name__ == "__main__":

    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)
