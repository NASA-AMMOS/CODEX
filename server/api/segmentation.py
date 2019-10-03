'''
Author: Jack Lightholder
Date  : 7/15/17
Brief : Segmentation algorithms, formatted for CODEX
Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import h5py
import traceback
import time
import math
import inspect
import logging

import numpy as np

from skimage.segmentation import quickshift
from skimage.segmentation import felzenszwalb

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math        import impute
from api.sub.time_log          import logTime
from api.sub.downsample        import downsample
from api.sub.hash              import get_cache
from api.algorithm             import algorithm

class segmentation(algorithm):

    def get_algorithm(self):

        if(self.algorithmName == "quickshift"):
            self.algorithm = "quickshift"
        elif(self.algorithmName == "felzenszwalb"):
            self.algorithm = "felzenszwalb"
        else:
            return None

        return cluster_alg

    def fit_algorithm(self):

        if(self.algorithm == "quickshift"):
            data = np.dstack((data, data, data))
            segments = quickshift(data, kernel_size=kernel_size, sigma=sigma, max_dist=max_dist)
            self.results["segments"] = segments.tolist(),
            self.results["kernel_size"] = kernel_size,
            self.results["sigma"] = sigma,
            self.results["max_dist"] = max_dist,

        elif(self.algorithm == "felzenszwalb"):
            data = impute(data)
            segments = felzenszwalb(data, scale=scale, sigma=sigma, min_size=min_size)
            self.results["segments"] = segments.tolist(),
            self.results["scale"] = scale,
            self.results["sigma"] = sigma,
            self.results["min_size" ] = min_size,


    def check_valid(self):
        return 1




