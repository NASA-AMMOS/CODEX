'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.time_log import *

def test_logTime(capsys):

    logTime("clustering", "kmeans", 10, 100, 2)

def test_getTimeLogDict(capsys):

    getTimeLogDict()

def test_getComputeTimeEstimate(capsys):

    time = getComputeTimeEstimate("clustering", "kmeans", 9000)