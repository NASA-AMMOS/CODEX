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

from api.sub.hash       import DOCTEST_SESSION
from api.sub.hash       import get_cache
from api.template_scan  import ml_template_scan
from fixtures           import testData

def test_ml_template_scan(capsys, testData):

    ch = get_cache(DOCTEST_SESSION)

    # Missing algorithmType
    result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "temp", False, {'num_templates': 1, 'scan_jump': 50}, {}, session=ch)

    # Standard usage
    result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "template", False, {'num_templates': 1, 'scan_jump': 50}, {}, session=ch)

    # Incorrect num_templates
    result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "template", False, {'num_templates': "String", 'scan_jump': 50}, {}, session=ch)

    # Incorrect scan_jump
    result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "template", False, {'num_templates': 1, 'scan_jump': "String"}, {}, session=ch)