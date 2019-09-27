import os
import pytest
import sys

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_hash import DOCTEST_SESSION
from api.sub.codex_hash import get_cache
from api.sub.codex_doctest import doctest_get_data
from api.dimmension_reduction import run_codex_dim_reduction

def test_run_codex_dim_reduction(capsys):

	ch = get_cache(DOCTEST_SESSION)
	testData = doctest_get_data(session=ch)

	result = run_codex_dim_reduction(testData['inputHash'], False, {"n_components":2}, False, False, "PCA", session=ch)
	result = run_codex_dim_reduction(testData['inputHash'], False, {"n_components":2}, 500, False, "ICA", session=ch)
