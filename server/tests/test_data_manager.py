'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.hash       import get_cache
from api.sub.hash       import DOCTEST_SESSION
from fixtures           import testData
from api.data_manager   import *

def test_get_data(capsys, testData):

    cache = get_cache(DOCTEST_SESSION)

    message = {'routine': 'arrange', 'hashType': 'feature', 'activity': 'get', 'name': ['TiO2','FeOT'], 'cid': '8vrjn', 'sessionkey': DOCTEST_SESSION}
    result = get_data(message, 1, 2, 3, {})

def test_add_data(capsys, testData):

    cache = get_cache(DOCTEST_SESSION)

    message = {'routine': 'arrange', 'hashType': 'feature', 'activity': 'add', 'name': 'TiO2', 'data': [1, 2, 3, 4], 'sessionkey': DOCTEST_SESSION}
    results = add_data(message, {})

def test_get_data_metrics(capsys, testData):

    cache = get_cache(DOCTEST_SESSION)

    message = {'routine': 'arrange', 'hashType': 'feature', 'activity': 'metrics', 'name': ['TiO2'], 'cid': '8vrjn', 'sessionkey': DOCTEST_SESSION}
    result = get_data_metrics(message, {})