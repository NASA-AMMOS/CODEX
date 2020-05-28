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

from api.sub.hash          import get_cache
from api.sub.hash          import DOCTEST_SESSION
from fixtures              import testData
from api.session_manager   import *

def test_save_session(capsys, testData):

    cache = get_cache(DOCTEST_SESSION, timeout=None)

    message =  {'session_name': 'AUTOSAVE', 'state': {'windows': [{'data': {'features': ['SiO2', 'TiO2']}, 'height': 500, 'width': 500, 'x': 0, 'y': 0, 'windowType': 'Scatter'}]}, 'sessionkey': DOCTEST_SESSION}
    result = save_session(message, {}, CODEX_ROOT)
    assert result == {}

    message =  {'session_name': 'AUTOSAVE', 'state': {'windows': [{'data': {'features': ['SiO2', 'TiO2']}, 'height': 500, 'width': 500, 'x': 0, 'y': 0, 'windowType': 'Scatter'}]}, 'sessionkey': DOCTEST_SESSION}
    result = save_session(message, {}, CODEX_ROOT)
    assert result == {}


def test_load_session(capsys, testData):

    cache = get_cache(DOCTEST_SESSION, timeout=None)

    message =  {'session_name': 'AUTOSAVE', 'state': {'windows': [{'data': {'features': ['SiO2', 'TiO2']}, 'height': 500, 'width': 500, 'x': 0, 'y': 0, 'windowType': 'Scatter'}]}, 'sessionkey': DOCTEST_SESSION}
    result = load_session(message, {}, CODEX_ROOT)
    assert result['session_name'] == 'AUTOSAVE'

    message =  {'session_name': 'AUTOSAVE', 'state': {'windows': [{'data': {'features': ['SiO2', 'TiO2']}, 'height': 500, 'width': 500, 'x': 0, 'y': 0, 'windowType': 'Scatter'}]}, 'sessionkey': DOCTEST_SESSION}
    result = load_session(message, {}, CODEX_ROOT)
    assert result['session_name'] == 'AUTOSAVE'
    
def test_get_sessions(capsys, testData):

    cache = get_cache(DOCTEST_SESSION, timeout=None)

    message =  {'session_name': 'AUTOSAVE', 'state': {'windows': [{'data': {'features': ['SiO2', 'TiO2']}, 'height': 500, 'width': 500, 'x': 0, 'y': 0, 'windowType': 'Scatter'}]}, 'sessionkey': DOCTEST_SESSION}
    result = get_sessions({}, {}, CODEX_ROOT)
    assert "AUTOSAVE" in result['sessions']
