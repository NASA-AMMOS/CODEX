##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake lib (mlib) for supporting doctests
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

#little function to help resolve location of doctest_files back in repository
def repo_path():
    import os
    return os.path.dirname(os.path.abspath(__file__))
