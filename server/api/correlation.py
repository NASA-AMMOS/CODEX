'''
Author: Jack Lightholder
Date  : 7/15/17
Brief : Clustering algorithms, formatted for CODEX
Notes : Algorithm grabbed from here: https://stats.stackexchange.com/questions/138325/clustering-a-correlation-matrix

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

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math         import impute
from api.sub.time_log           import getComputeTimeEstimate
from api.sub.time_log           import logTime
from api.sub.downsample         import downsample
from api.sub.labels             import label_swap
from api.sub.hash               import get_cache
from api.algorithm              import algorithm

from sklearn import preprocessing

class correlation(algorithm):

    def get_algorithm(self):
        if(self.algorithmName == "alphabetical"):
            algorithm = "alphabetical"
        elif(self.algorithmName == "sorted"):
            algorithm = "sorted"
        else:
            return None

        return algorithm


    def fit_algorithm(self):

        n_samples, n_variables = self.X.shape
        n_clusters = 5 #TODO dynamic variable

        cluster_size = n_variables // n_clusters

        # Assign each variable to a cluster
        belongs_to_cluster = np.repeat(range(n_clusters), cluster_size)
        np.random.shuffle(belongs_to_cluster)

        # This latent data is used to make variables that belong
        # to the same cluster correlated.
        latent = np.random.randn(n_clusters, n_samples)

        variables = self.X.transpose()
        C = np.cov(variables)

        if(self.algorithmName == "alphabetical"):
            self.featureList = np.asarray(self.featureList)
            C = C[:, np.argsort(self.featureList)]

            self.featureList = np.sort(self.featureList)
            C = preprocessing.MinMaxScaler().fit_transform(C)

            self.result["ordering"] = self.featureList.tolist()
            self.result["corr_matrix"] = C.tolist()

        elif(self.algorithmName == "sorted"):

            initial_C = C
            initial_score = score(C, n_clusters, cluster_size, n_variables)
            initial_ordering = np.arange(n_variables)

            current_C = C
            current_ordering = initial_ordering
            current_score = initial_score

            max_iter = 1000
            for i in range(max_iter):
                # Find the best row swap to make
                best_C = current_C
                best_ordering = current_ordering
                best_score = current_score
                for row1 in range(n_variables):
                    for row2 in range(n_variables):
                        if row1 == row2:
                            continue
                        option_ordering = best_ordering.copy()
                        option_ordering[row1] = best_ordering[row2]
                        option_ordering[row2] = best_ordering[row1]
                        option_C = swap_rows(best_C, row1, row2)
                        option_score = score(option_C, n_clusters, cluster_size, n_variables)

                        if option_score > best_score:
                            best_C = option_C
                            best_ordering = option_ordering
                            best_score = option_score

                if best_score > current_score:
                    # Perform the best row swap
                    current_C = best_C
                    current_ordering = best_ordering
                    current_score = best_score
                else:
                    # No row swap found that improves the solution, we're done
                    break

            current_C = preprocessing.MinMaxScaler().fit_transform(current_C)

            ordering = []
            for x in range(0, len(current_ordering)):
                ordering.append(self.featureList[current_ordering[x]])

            self.result["ordering"] = ordering
            self.result["corr_matrix"] = current_C.tolist()

        else:

            self.result["WARNING"] = "algorithmName == alphabetical | sorted"

    def check_valid(self):
        return 1

# Greedy optimization algorithm that continuously
# swaps rows to improve the score
def swap_rows(C, var1, var2):
    '''
    Function to swap two rows in a covariance matrix,
    updating the appropriate columns as well.
    '''
    D = C.copy()
    D[var2, :] = C[var1, :]
    D[var1, :] = C[var2, :]

    E = D.copy()
    E[:, var2] = D[:, var1]
    E[:, var1] = D[:, var2]

    return E

def score(C, n_clusters, cluster_size, n_variables):
    '''
    Function to assign a score to an ordered covariance matrix.
    High correlations within a cluster improve the score.
    High correlations between clusters decease the score.
    '''
    score = 0
    for cluster in range(n_clusters):
        inside_cluster = np.arange(cluster_size) + cluster * cluster_size
        outside_cluster = np.setdiff1d(range(n_variables), inside_cluster)

        # Belonging to the same cluster
        score += np.sum(C[inside_cluster, :][:, inside_cluster])

        # Belonging to different clusters
        score -= np.sum(C[inside_cluster, :][:, outside_cluster])
        score -= np.sum(C[outside_cluster, :][:, inside_cluster])

    return score
       
