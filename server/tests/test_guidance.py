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

from api.sub.guidance import *

def test_guidance_text_block(capsys):

    result = get_guidance_text_block('unit_tests', 'test', CODEX_ROOT)
    assert result == "This is a unit test"

    result = get_guidance_text_block('unit_tests', 'not_a_test', CODEX_ROOT)
    assert result == None