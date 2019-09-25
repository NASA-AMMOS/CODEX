'''
Author: Jack Lightholder
Date  : 5/27/19

Brief : YAML read/write/manipulate library for CODEX

Notes :

'''
import os
import sys
import yaml

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))


def codex_read_yaml(filepath):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> result = codex_read_yaml(os.path.join(CODEX_ROOT,'guidance.yaml'))
    >>> print(result['unit_tests']['test'])
    This is a unit test
    '''
    with open(filepath, 'r') as ymlfile:
        cfg = yaml.load(ymlfile, Loader=yaml.FullLoader)
        return cfg


if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()
