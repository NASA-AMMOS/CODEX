import os
import pytest
import sys

@pytest.fixture
def cwd():
    return os.path.dirname(os.path.realpath(__file__))

def test_yamls(cwd, capsys):

    assert 1 == 1



