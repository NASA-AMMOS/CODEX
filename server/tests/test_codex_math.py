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

from api.sub.codex_math import *

def test_impute(capsys):

    # Check multiple feature case
    a = np.array(([10,5,10],[5,10,np.inf],[None,2,3],[6,-np.inf,8]))
    a = impute(a)

    # Check single feature case
    a = np.array(([5],[5],[5],[np.inf],[5],[5],[5],[5]))
    a = impute(a)
