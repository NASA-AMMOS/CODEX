'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Segmentation algorithms, formatted for CODEX

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
from api.sub.downsample        import downsample
from api.sub.time_log          import logTime
from api.sub.codex_math        import impute
from api.sub.hash              import get_cache
from api.algorithm             import algorithm

class template_scan(algorithm):

    def get_algorithm(self):

        if(self.algorithmName == ""):
            pass
        elif(self.algorithmName == ""):
            pass
        else:
            return None

        return cluster_alg





'''
    returnTemplateHash = ch.findHashArray("hash", templateHash, "feature")
    if(returnTemplateHash is None):
        logging.warning("Error: codex_template_scan: templateHash not found.")
        return

    X = impute(X)
    y = returnTemplateHash['data']

    templateLength = len(y)
    seriesLength = len(X)
    similarAreas = np.zeros(seriesLength)

    for a in range(1, num_templates + 1):

        lowestDistance = math.inf
        lowestIndex = 0

        seriesLength = len(X)

        for x in range(0, seriesLength - templateLength + 1, scan_jump):

            X_ = X[0 + x:templateLength + x]

            distance, path = fastdtw(X_, y, radius=10, dist=euclidean)

            if(distance < lowestDistance):
                alreadyUsed = False
                for z in range(x, x + templateLength):
                    if(similarAreas[z] != 0):
                        alreadyUsed = True
                if(alreadyUsed == False):
                    lowestDistance = distance
                    lowestIndex = x

        for b in range(lowestIndex, lowestIndex + templateLength):
            similarAreas[b] = a

    endTime = time.time()
    computeTime = endTime - startTime
    logTime("template_scan", "dtw", computeTime, len(X), X.ndim)

    uniques = np.unique(similarAreas)
    locationsFound = len(uniques) - 1
    dictionary = {"templatesFound": locationsFound, 'indexes': similarAreas}

    dictionary['message'] = 'success'
    return dictionary
'''

