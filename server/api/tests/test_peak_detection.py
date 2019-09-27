import os
import pytest
import sys

sys.path.insert(1, os.getenv('CODEX_ROOT'))

def test_ml_peak_detect(capsys):
	
	assert 1 == 1