##-----------------------------------------------------------------
##-----------------------------------------------------------------
##
## Mandrake (mlib) for handling types and type comparisons
##
##-----------------------------------------------------------------
##-----------------------------------------------------------------

import numpy as N

INTTYPES   = (int  , long  , N.int8, N.int16, N.int32, N.int64)
FLOATTYPES = (float, N.float16, N.float32, N.float64)
STRTYPES   = (str, unicode, N.string_)
ARRAYTYPES = (list, tuple, N.ndarray)
BOOLTYPES  = (bool, N.bool_)

#-----------
def isnarray(x):
    """ Determine if a variable is an ndarray

    >>> isnarray(N.array((1,2,3)))
    True

    >>> isnarray((1,2,3))
    False

    >>> isnarray(N.float32(2))
    False

    >>> isnarray(None)
    False

"""
    if x is None: return False
    return isinstance(x, N.ndarray)

#-----------
def isstr(x):
    """ Determine if a variable is of (one of the many) string types

    >>> isstr("hello")
    True

    >>> isstr(type("hello"))
    True

    >>> isstr(["hello",])
    False

    """

    if x is None: return False
    if type(x) == type: return x in STRTYPES

    for typer in STRTYPES:
        if isinstance(x, typer): return True

    return False


#-----------
def isbool(x):
    """ Determine if a variable is of (one of the many) bool types

    >>> isbool(False)
    True

    >>> isbool(type(True))
    True

    >>> isbool([True,])
    False

    >> isbool(1)
    False

    >> isbool("True")
    False

    """

    if x is None: return False
    if type(x) == type: return x in BOOLTYPES

    for typer in BOOLTYPES:
        if isinstance(x, typer): return True

    return False


#-----------
def isint(x):
    """ Determine if a variable is of (one of the many) integer types

    >>> isint(1)
    True

    >>> isint(1.0)
    False

    >>> isint(N.int64(1))
    True

    """

    if       x is None: return False
    if type(x) == type: return x in INTTYPES

    for typer in INTTYPES:
        if isinstance(x, typer): return True

    return False

#---------------
def isarray(x):
    """ Determine if a variable is of (one of the many) list/array types.

    >>> isarray([1,2])
    True

    >>> isarray((1,2))
    True

    >>> isarray(1.0)
    False

    >>> isarray(N.array((1,2,3)))
    True

    >>> isarray(None)
    False

    >>> isarray([])
    True

    >>> isarray(N.zeros((0,)))
    True
    """

    if       x is None: return False
    if type(x) == type: return x in ARRAYTYPES

    for typer in ARRAYTYPES:
        if isinstance(x, typer): return True

    return False

#---------------
def isfloat(x):
    """ Determine if a variable is of (one of the many) float types.

    >>> isfloat(1.0)
    True

    >>> isfloat(1)
    False

    >>> isfloat(N.float64(1))
    True
    """

    if       x is None: return False
    if type(x) == type: return x in FLOATTYPES

    for typer in FLOATTYPES:
        if isinstance(x, typer): return True

    return False

#---------------
def isintval(x):

    """ Determine if a variable is of (one of the many) integer types

    >>> isintval(1)
    True

    >>> isintval(1.0)
    True

    >>> isintval(1.5)
    False

    >>> isintval(N.int64(1))
    True

    """

    if  isint(x): return True
    if x is None: return False

    #check to see if the value itself is an integer even if the type is not
    return float(x).is_integer()


if __name__ == "__main__":
    import doctest
    doctest.testmod()
