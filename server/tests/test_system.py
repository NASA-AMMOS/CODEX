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

from api.sub.hash    import DOCTEST_SESSION, get_cache
from api.sub.system  import *

def test_get_featureList(capsys):

    featureList = ['TiO2','FeOT','SiO2','Total']
    output = get_featureList(featureList)
    assert featureList == output

def test_string2token(capsys):

    stringArray = np.array(["one","two","three"])
    result = string2token(stringArray)
    assert len(result) == 3

def test_get_codex_memory_usage(capsys):

    memory = get_codex_memory_usage()
    assert memory >= 0

def test_codex_server_memory_check(capsys):

    ch = get_cache(DOCTEST_SESSION, timeout=None)
    codex_server_memory_check(session=ch)