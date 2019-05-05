'''
Author: Jack Lightholder
Date  : 2/7/18

Brief : YAML read/write/manipulate library for CODEX

Notes :

'''
import os
import sys
import yaml
CODEX_ROOT = os.getenv('CODEX_ROOT')

import codex_doctest

def codex_read_yaml(filepath):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> result = codex_read_yaml(CODEX_ROOT + 'guidance.yaml')
    >>> print(result['unit_tests']['test'])
    This is a unit test
    '''
    with open(filepath, 'r') as ymlfile:
        cfg = yaml.load(ymlfile, Loader=yaml.FullLoader)
        return cfg


def get_guidance_text_block(page, section):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> result = get_guidance_text_block('unit_tests', 'test')
    >>> print(result)
    This is a unit test

    >>> result = get_guidance_text_block('unit_tests', 'not_a_test')
    '''
    yaml = codex_read_yaml(CODEX_ROOT + "guidance.yaml")

    try:
        return yaml[page][section]
    except BaseException:
        return None


if __name__ == "__main__":

    codex_doctest.run_codex_doctest()
