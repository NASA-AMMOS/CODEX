import os
import pytest
import sys

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_hash import DOCTEST_SESSION
from api.sub.codex_hash import get_cache
from api.sub.codex_doctest import doctest_get_data
from api.template_scan import ml_template_scan

def test_ml_template_scan(capsys):

    ch = get_cache(DOCTEST_SESSION)
    testData = doctest_get_data(session=ch)

    # Missing algorithmType
    result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "temp", False, {'num_templates': 1, 'scan_jump': 50}, {}, session=ch)

    # Standard usage
    result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "template", False, {'num_templates': 1, 'scan_jump': 50}, {}, session=ch)

    # Incorrect num_templates
    result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "template", False, {'num_templates': "String", 'scan_jump': 50}, {}, session=ch)

    # Incorrect scan_jump
    result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "template", False, {'num_templates': 1, 'scan_jump': "String"}, {}, session=ch)