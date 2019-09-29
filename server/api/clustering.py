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

from api.algorithm import algorithm

class clustering(algorithm):
    def __init__(self, **super):
        algorithm.__init__(self, name='clustering', **super)


    def get_algorithm(self, X, result):

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
                        'WARNING': algorithm + " not supported."}

        except:
            logging.warning(str(traceback.format_exc()))
            return {'algorithm': algorithm,
                    'data': X.tolist(),
                    'downsample': downsampled,
                    'WARNING': "{algorithm} not supported.".format(algorithm=algorithm)}

        result['data'] = X.tolist()

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

        return result

