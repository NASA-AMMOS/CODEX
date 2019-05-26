# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for supporting doctests
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import imp
import os
import sys


# little function to help resolve location of doctest_files back in repository
def repo_path():
    """Returns the absolute path to the root of the repository."""
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def repo_relpath(start=None):
    """Returns the relative path to the root of the repository."""
    if start is None:
        start = ''
    return os.path.relpath(repo_abspath(), start)


def repo_abspath():
    """Returns the absolute path to the directory containing the mlib module."""
    return os.path.realpath(os.path.dirname(imp.find_module('mlib')[1]))


def module_path():
    return os.path.dirname(os.path.realpath(__file__))


def doctest_input_path():
    """Returns the path to the doctest input files."""
    # return os.path.join(repo_path(), 'tests', 'doctest_input_files')
    return os.path.join(repo_path(), 'tests', 'doctest_files')


def doctest_output_path():
    """Returns the path to the doctest output files."""
    # return os.path.join(repo_path(), 'tests', 'doctest_output_files')
    return os.path.join(repo_path(), 'tests', 'doctest_working')
