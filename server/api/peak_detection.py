'''
Author: Jack Lightholder
Date  : 7/15/17
Brief : Peak detection algorithms, formatted for CODEX
Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import time
import h5py
import traceback
import inspect
import logging

import numpy as np

from scipy.signal import find_peaks_cwt

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math        import impute
from api.sub.return_code       import logReturnCode
from api.sub.downsample        import downsample
from api.sub.plot              import plot_peak
from api.sub.time_log          import getComputeTimeEstimate
from api.sub.time_log          import logTime
from api.sub.detect_peaks      import detect_peaks
from api.sub.hash              import get_cache
from api.algorithm             import algorithm

# Note: algorithm source: https://blog.ytotech.com/2015/11/01/findpeaks-in-python/
# Note: algorithm source:
# https://docs.scipy.org/doc/scipy-0.14.0/reference/generated/scipy.signal.find_peaks_cwt.html

class peak_detection(algorithm):

    def get_algorithm(self):

        if(self.algorithmName == "matlab_findpeaks"):
            algorithm = "matlab_findpeaks"
        elif(self.algorithmName == "cwt"):
            algorithm = "cwt"
        else:
            return None

        return algorithm


    def fit_algorithm(self):

        self.X = self.X[:, 0]
        num_samples = len(self.X)
        width_array = np.asarray(np.arange(1, num_samples / peak_width))

        if self.algorithm == "cwt":
            indexes = find_peaks_cwt(data, width_array, gap_thresh=gap_threshold, min_snr=min_snr, noise_perc=noise_perc)
        elif self.algorithm == "matlab_findpeaks":
            indexes = detect_peaks(data, mph=mph, mpd=mpd, threshold=threshold, edge=edge, kpsh=kpsh, valley=valley)

        self.result["indexes"] = indexes


    def check_valid(self):
        return 1


    def algorithm_plot(self):
        plot_peak(data, indexes)






