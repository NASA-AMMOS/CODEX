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
from api.sub.labels             import label_swap
from api.sub.hash               import get_cache
from api.algorithm              import algorithm

class clustering(algorithm):

    def get_algorithm(self):

        if(self.algorithmName == "kmeans"):

            cluster_alg = cluster.MiniBatchKMeans(n_clusters=int(self.parms['k']))

        elif(self.algorithmName == "mean_shift"):

            bandwidth = cluster.estimate_bandwidth(self.X, quantile=float(self.parms['quantile']))
            cluster_alg = cluster.MeanShift(bandwidth=bandwidth, bin_seeding=True)

        elif(self.algorithmName == "affinity_propagation"):

            cluster_alg = cluster.AffinityPropagation(damping=float(self.parms['damping']))

        elif(self.algorithmName == "birch"):

            cluster_alg = cluster.Birch(n_clusters=int(self.parms['k']))

        elif(self.algorithmName == "ward"):

            connectivity = kneighbors_graph(self.X, n_neighbors=int(self.parms['n_neighbors']), include_self=False)
            connectivity = 0.5 * (connectivity + connectivity.T)
            cluster_alg = cluster.AgglomerativeClustering(n_clusters=int(self.parms['k']), linkage='ward', connectivity=connectivity)

        elif(self.algorithmName == "spectral"):

            cluster_alg = cluster.SpectralClustering(n_clusters=int(self.parms['k']), eigen_solver='arpack', affinity="nearest_neighbors")

        elif(self.algorithmName == "dbscan"):

            cluster_alg = cluster.DBSCAN(eps=float(self.parms['eps']))

        elif(self.algorithmName == "agglomerative"):

            connectivity = kneighbors_graph(self.X, n_neighbors=int(self.parms['n_neighbors']), include_self=False)
            connectivity = 0.5 * (connectivity + connectivity.T)

            cluster_alg = cluster.AgglomerativeClustering(linkage="average", affinity="cityblock", n_clusters=int(self.parms['k']), connectivity=connectivity)

        else:
            return None

        return cluster_alg


    def fit_algorithm(self):

        self.algorithm.fit(self.X)
        y_pred = self.algorithm.labels_.astype(np.int)

        # temporary to not change API right now
        merged_hash = self.cache.hashArray("temporary", self.X, "feature")
        y_pred = label_swap(y_pred, merged_hash["hash"], session=self.cache)
        label_hash = self.cache.hashArray(merged_hash["hash"], y_pred, "label")

        self.result['numClusters'] = np.unique(y_pred).size
        self.result['clusters'] = y_pred.tolist()

        try:
            centers = self.algorithm.cluster_centers_
            self.result['centers'] = centers.tolist()
        except:
            centers = None
            self.result['centers'] = None


    def check_valid(self):

        if self.X.ndim < 2:
            logging.warning("ERROR: run_codex_clustering - insufficient data dimmensions")
            return None

        return 1


        
