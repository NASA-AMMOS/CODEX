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

from scipy.ndimage.measurements import label

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

            self.activeLabels = np.asarray(self.activeLabels)
            labeled, ncomponents = label(self.activeLabels)

            score_set = np.ones(labeled.shape[0])
            results = np.zeros(labeled.shape[0])
            for x in range(1, ncomponents+1):
                seg_start = np.min(np.argwhere(labeled == x))
                seg_end = np.max(np.argwhere(labeled == x))
                seg = self.y[seg_start:seg_end+1]
                distance, scores = fastdtw(self.X, seg, radius=self.parms['radius'], dist=euclidean)
                score_array = np.array(scores)
                seg_scores = np.asarray(score_array[:,1]) * distance
                score_set = np.column_stack((score_set, seg_scores))
            
            if ncomponents >= 1:
                score_set = score_set[:,1:]
                score_set = np.average(score_set, axis=1)
                threshold_indices = score_set > (((np.max(score_set) - np.min(score_set)) / 2) + np.min(score_set))
                results[threshold_indices] = 1
                
            self.result['results'] = results.tolist()



    def check_valid(self):
        return 1
        
