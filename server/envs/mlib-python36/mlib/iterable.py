# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
# Mandrake lib (mlib) for dealing with iterables
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------


# ---------------------------
def is_not_iterable(item):
    """ Checks whether an item is not an iterable or a singleton.
    >>> is_not_iterable("hello")
    True
    >>> is_not_iterable(2)
    True
    >>> is_not_iterable([2,])
    False
    >>> print is_not_iterable([2,]) == (not is_iterable([2,]))
    True
    """
    return not hasattr(item, '__iter__')


# ---------------------------
def is_iterable(item):
    """ Checks whether an item is an iterable or a singleton.
    >>> is_iterable("hello")
    False
    >>> is_iterable(2)
    False
    >>> is_iterable([2,])
    True
    >>> print is_not_iterable(2) == (not is_iterable(2))
    True
    """
    return hasattr(item, '__iter__')


# ---------------------------
def makeiter(item):
    """ Forces an item (of any kind) to be a 1D list if it isn't an interable already.

    >>> makeiter(2)
    [2]
    >>> makeiter([3,])
    [3]
    >>> makeiter([3,4,5])
    [3, 4, 5]
    >>> import numpy as N
    >>> makeiter(N.array((1,2,3)))
    array([1, 2, 3])
    >>> makeiter("hello")
    ['hello']
    """
    if item is None: return None
    if is_not_iterable(item): return [item, ]
    return item


# ---------------------------
def merge_dicts(*dict_args):
    '''
    Given any number of dicts, shallow copy and merge into a new dict,
    precedence goes to key value pairs in latter dicts.

    >>> merge_dicts( {1:2, 2:3, 3:4}, {2:4, 3:6, 4:8} )
    {1: 2, 2: 4, 3: 6, 4: 8}

    >>> merge_dicts( {} )
    {}

    >>> merge_dicts ( {}, {} )
    {}

    >>> merge_dicts ( {1:2}, {} )
    {1: 2}

    >>> merge_dicts ( {1:2} )
    {1: 2}

    '''
    result = {}
    for dictionary in dict_args:
        result.update(dictionary)
    return result


# ---------------------------
def parameter_range_to_instances(params):
    """ Takes a dictionary of potential parameter settings and returns an array
    of dictionaries for each combination.

    >>> parameters = {'n_estimators'     : [1   ,10   ,100],
    ...               'max_leaf_nodes'   : [None, 1       ],
    ...               'min_samples_leaf' : [1   , 1000    ], }

    >>> PP(parameter_range_to_instances(parameters))
    [{'max_leaf_nodes': None, 'min_samples_leaf': 1, 'n_estimators': 1},
     {'max_leaf_nodes': None, 'min_samples_leaf': 1000, 'n_estimators': 1},
     {'max_leaf_nodes': 1, 'min_samples_leaf': 1, 'n_estimators': 1},
     {'max_leaf_nodes': 1, 'min_samples_leaf': 1000, 'n_estimators': 1},
     {'max_leaf_nodes': None, 'min_samples_leaf': 1, 'n_estimators': 10},
     {'max_leaf_nodes': None, 'min_samples_leaf': 1000, 'n_estimators': 10},
     {'max_leaf_nodes': 1, 'min_samples_leaf': 1, 'n_estimators': 10},
     {'max_leaf_nodes': 1, 'min_samples_leaf': 1000, 'n_estimators': 10},
     {'max_leaf_nodes': None, 'min_samples_leaf': 1, 'n_estimators': 100},
     {'max_leaf_nodes': None, 'min_samples_leaf': 1000, 'n_estimators': 100},
     {'max_leaf_nodes': 1, 'min_samples_leaf': 1, 'n_estimators': 100},
     {'max_leaf_nodes': 1, 'min_samples_leaf': 1000, 'n_estimators': 100}]

    >>> parameters = {'n_estimators'     : [1,            ],
    ...               'max_leaf_nodes'   : [None,         ],
    ...               'min_samples_leaf' : [1   , 1000    ], }

    >>> PP(parameter_range_to_instances(parameters))
    [{'max_leaf_nodes': None, 'min_samples_leaf': 1, 'n_estimators': 1},
     {'max_leaf_nodes': None, 'min_samples_leaf': 1000, 'n_estimators': 1}]

    >>> parameters = {'n_estimators'     : [1,            ] }

    >>> parameter_range_to_instances(parameters)
    [{'n_estimators': 1}]

    >>> parameters = {'n_estimators'     : [] }

    >>> parameter_range_to_instances(parameters)
    [{}]

    >>> parameter_range_to_instances({})
    [{}]

    """

    if len(params.keys()) == 0: return [{}]

    import itertools
    from mlib.numeric import flatten
    import mlib.numeric as NUM

    # Convert each line of the parameter dictionary to key value pairs per candidate value
    vals_to_consider = []
    for key in params.keys():
        param_dicts = [x for x in itertools.product((key,), params[key])]
        # Convert to dictionary elements
        param_dicts = [dict(((x[0], x[1]),)) for x in param_dicts]
        vals_to_consider.append(param_dicts)

    # Make the product of the lists of dictionaries
    param_instances = vals_to_consider[0]
    for v_to_c in vals_to_consider[1:]:
        param_instances = [flatten(x) for x in itertools.product(param_instances, v_to_c)]
    # Singleton parameter sweep requires additional list layer to emulate more general case
    if len(vals_to_consider) == 1: param_instances = [param_instances, ]

    # Merge the dictionaries for each instance
    param_instances = [merge_dicts(*x) for x in param_instances]

    return param_instances


# ---------------------------
# ---------------------------
# ---------------------------

if __name__ == "__main__":
    import doctest
    from pprint import pprint as PP

    doctest.testmod()
