'''
Author: Jack Lightholder
Date  : 2/7/18

Brief : YAML read/write/manipulate library for CODEX

Notes :

'''
import os
import sys
import yaml

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_yaml import codex_read_yaml

def get_guidance_text_block(page, section, readPath):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> from api.sub.codex_doctest import doctest_base_path
    >>> result = get_guidance_text_block('unit_tests', 'test', doctest_base_path())
    >>> print(result)
    This is a unit test

    >>> result = get_guidance_text_block('classification_page', 'BernoulliNB', doctest_base_path())
    >>> print(result)
    <BLANKLINE>
    Sample data
    <BLANKLINE>  

    >>> result = get_guidance_text_block('unit_tests', 'not_a_test', doctest_base_path())
    '''
    yaml = codex_read_yaml(os.path.join(readPath, "guidance.yaml"))

    try:
        return yaml[page][section]
    except BaseException:
        return None


if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()
