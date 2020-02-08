'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys

import numpy as np

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.detect_peaks import detect_peaks

def test_detect_peaks(capsys):


    x = np.random.randn(100)
    x[60:81] = np.nan

    # detect all peaks and plot data
    ind = detect_peaks(x, show=False)

    x = np.sin(2*np.pi*5*np.linspace(0, 1, 200)) + np.random.randn(200)/5
    # set minimum peak height = 0 and minimum peak distance = 20
    result = detect_peaks(x, mph=0, mpd=20, show=False)

    x = [0, 1, 0, 2, 0, 3, 0, 2, 0, 1, 0]
    # set minimum peak distance = 2
    result = detect_peaks(x, mpd=2, show=False)

    x = np.sin(2*np.pi*5*np.linspace(0, 1, 200)) + np.random.randn(200)/5
    # detection of valleys instead of peaks
    result = detect_peaks(x, mph=0, mpd=20, valley=True, show=False)

    x = [0, 1, 1, 0, 1, 1, 0]
    # detect both edges
    result = detect_peaks(x, edge='both', show=False)

    x = [-2, 1, -2, 2, 1, 1, 3, 0]
    # set threshold = 2
    result = detect_peaks(x, threshold = 2, show=False)