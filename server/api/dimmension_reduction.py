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
from api.sub.codex_math        import impute
from api.sub.codex_math        import explained_variance_ratio
from api.sub.downsample        import downsample
from api.sub.return_code       import logReturnCode
from api.sub.time_log          import logTime
from api.sub.time_log          import getComputeTimeEstimate
from api.sub.hash              import get_cache
from api.sub.plot              import plot_dimensionality
from api.algorithm             import algorithm

class dimension_reduction(algorithm):

    def get_algorithm(self):

        if(self.algorithmName == "PCA"):
            dim_r = PCA(n_components=self.parms['n_components'])

        elif(self.algorithmName == "ICA"):
            dim_r = FastICA(n_components=self.parms['n_components'])

        else:
            return None

        return dim_r


    def fit_algorithm(self):

        X_transformed = self.algorithm.fit_transform(self.X)
        exp_var_ratio = explained_variance_ratio(X_transformed, self.parms['n_components'])

        self.result['data'] = X_transformed.tolist()
        self.result['explained_variance_ratio'] = exp_var_ratio.tolist()
        self.result['n_components'] = self.parms['n_components']


    def check_valid(self):

        if(self.X.ndim > self.parms["n_components"]):
            logging.warning("ERROR: run_codex_dim_reduction: features ({ndim}) > requested components ({components})".format(ndim=self.X.ndim, components=self.parms['n_components']))
            return None

        return 1


    def algorithm_plot(self):
        plot_dimensionality(exp_var_ratio, "PCA Explained Variance", show=True)



