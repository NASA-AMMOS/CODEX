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

import codex_yaml

def get_guidance_text_block(page, section):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> result = get_guidance_text_block('unit_tests', 'test')
    >>> print(result)
    This is a unit test

    >>> result = get_guidance_text_block('classification_page', 'BernoulliNB')
    >>> print(result)
    <BLANKLINE>
    Sample data
    <BLANKLINE>  

    >>> result = get_guidance_text_block('unit_tests', 'not_a_test')
    '''
    yaml = codex_yaml.codex_read_yaml(os.path.join(CODEX_ROOT, "guidance.yaml"))

    try:
        return yaml[page][section]
    except BaseException:
        return None


if __name__ == "__main__":

    from codex_doctest import run_codex_doctest
    run_codex_doctest()
