'''
Author: Jack Lightholder
Date  : 7/15/17
Brief : Template scan algorithms, formatted for CODEX
Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import sys
import os
import traceback
import time
import math
import inspect
import logging

import numpy as np

from scipy.spatial.distance import euclidean
from fastdtw                import fastdtw

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.algorithm             import algorithm

class template_scan(algorithm):

    def get_algorithm(self):

        if(self.algorithmName == "dtw"):
            algorithm = "dtw"
        else:
            return None

        return algorithm

    def fit_algorithm(self):

        if self.algorithm == "dtw":
            distance, paths = fastdtw(self.X, self.y, radius=self.parms['radius'], dist=euclidean)
            self.result["distance"] = distance
            self.result["paths"] = paths

    def check_valid(self):
        return 1
        
