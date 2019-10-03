'''
Author: Jack Lightholder
Date  : 7/15/17
Brief : Dimmensionality reduction algorithms, formatted for CODEX
Notes : Not currently functional

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import sys
import os
import traceback

import matplotlib # Necessary for pysptools matplotlib backend issue
matplotlib.use('Agg') # Necessary for pysptools matplotlib backend issue
import pysptools.eea.eea
import pysptools.eea

import time
import inspect
import logging

import numpy as np

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math        import impute
from api.sub.downsample        import downsample
from api.sub.time_log          import getComputeTimeEstimate
from api.sub.time_log          import logTime
from api.sub.hash              import get_cache
from api.algorithm             import algorithm

class endmember(algorithm):

    def get_algorithm(self):

        if(self.algorithmName == "ATGP"):
            algorithm = pysptools.eea.eea.ATGP(self.X, int(self.parms['q']))
        elif(self.algorithmName == "FIPPI"):
            algorithm = pysptools.eea.eea.FIPPI(self.X, int(self.parms['q']))
        elif(self.algorithmName == "PPI"):
            algorithm = pysptools.eea.eea.PPI(self.X, int(self.parms['q']), int(self.parms['numSkewers']))
        else:
            return None

        return algorithm


    def fit_algorithm(self):

        self.result['endmember_array']: np.array_str(self.algorithm[0])
        self.result['endmember_vector']: np.array_str(self.algorithm[1])


    def check_valid(self):

        #if(q > y):
        #    logging.warning("WARNING: q must be <= to number of features")
        #    return None

        return 1







