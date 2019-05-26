# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for performing numeric analysis
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import numpy as N
import collections as C

from numpy.core.multiarray import ndarray

from mlib.iterable import is_iterable
from mlib.iterable import is_not_iterable
import mlib.mtypes
import scipy.stats as SPS
from pprint import pprint as PP
from scipy.signal import medfilt
from scipy.spatial.distance import cdist
import mlib.progressbar
from sklearn.metrics import r2_score

import warnings

warnings.filterwarnings("ignore", "FutureWarning: pd.rolling_median is deprecated")
warnings.filterwarnings("ignore", "FutureWarning: pd.rolling_mean is deprecated")
warnings.simplefilter(action="ignore", category=FutureWarning)


# HINT: python -W error (code).py permits warnings to be treated like errors

# -----------------------
def mahalanobis(X, Y, inverse_covariance=None):
    """An example of how to compute the mahalanobis distance using a pre-computed covariance

    An example of using datadicts to precompute suitable inverse covariance
    featdata = H.read(filename, usecols = features).as_array().T
    inverse_covariance_matrix = N.linalg.inv( N.cov( featdata ) )

    >>> X = N.random.random((10,10))
    >>> Y = N.random.random((10,10))

    >>> dist1 = mahalanobis(X, Y)

    >>> VI = N.linalg.inv( N.cov( N.concatenate((X, Y)).T ) )
    >>> dist2 = mahalanobis(X, Y, VI)

    >>> N.testing.assert_allclose(dist1, dist2)
    """

    return cdist(X, Y, 'mahalanobis', VI=inverse_covariance)


# -----------------------
def split_list_into_equal_chunks(inlist, chunk_size=2):
    """ Splits an incoming list into specified chunk sizes. Last group may or may not be of the appropriate size.

    >>> split_list_into_equal_chunks(range(10),3)
    [[0, 1, 2], [3, 4, 5], [6, 7, 8], [9]]

    >>> split_list_into_equal_chunks(range(10),1)
    [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9]]

    >>> split_list_into_equal_chunks(range(10),10)
    [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]

    >>> split_list_into_equal_chunks(range(10),100)
    [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]]

    >>> split_list_into_equal_chunks(range(10),0)
    Traceback (most recent call last):
    ValueError: range() step argument must not be zero

    >>> split_list_into_equal_chunks([],10)
    [[]]

    """

    if len(inlist) < 1: return [[]]

    ret = [inlist[i:i + chunk_size] for i in range(0, len(inlist), chunk_size)]
    if i + chunk_size < len(inlist): retval += [inlist[i + chunk_size:], ]
    return ret


# -----------------------
def split_ranges(length, num_groups=2):
    """ Creates ranges that split an array into the specified number of groups without missing any elements.

    >>> split_ranges(10, 2)
    [(0, 5), (5, 10)]

    >>> split_ranges(10, 10)
    [(0, 1), (1, 2), (2, 3), (3, 4), (4, 5), (5, 6), (6, 7), (7, 8), (8, 9), (9, 10)]

    >>> split_ranges(19, 5)
    [(0, 4), (4, 8), (8, 12), (12, 16), (16, 19)]

    Too many sublists requested results in empty lists appended
    >>> split_ranges(10, 11)
    Traceback (most recent call last):
    Exception: Cannot split a list into more ranges than elements

    Zero lists requested
    >>> split_ranges(10, 0)
    Traceback (most recent call last):
    Exception: Cannot split a list into less than 1 list

    Negative lists requested
    >>> split_ranges(10, -1)
    Traceback (most recent call last):
    Exception: Cannot split a list into less than 1 list

    Empty list
    >>> split_ranges(0, 2)
    Traceback (most recent call last):
    Exception: Cannot split a list into more ranges than elements
    """

    if length < num_groups: raise Exception("Cannot split a list into more ranges than elements")

    return [(N.min(x), N.max(x) + 1) for x in split_list_equally(range(length), num_groups)]


# -----------------------
def split_list_equally(inlist, num_groups=2):
    """ Receives a list and returns (yields) the same elements as a series of smaller lists.
    Lists may not be the same size due to lack of divisibility into the group number requested.

    >>> split_list_equally(range(10), 2)
    [[0, 1, 2, 3, 4], [5, 6, 7, 8, 9]]

    >>> split_list_equally(range(10), 10)
    [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9]]

    Too many sublists requested results in empty lists appended
    >>> split_list_equally(range(10), 11)
    [[0], [1], [2], [3], [4], [5], [6], [7], [8], [9], []]

    Zero lists requested
    >>> split_list_equally(range(10), 0)
    Traceback (most recent call last):
    Exception: Cannot split a list into less than 1 list

    Negative lists requested
    >>> split_list_equally(range(10), -1)
    Traceback (most recent call last):
    Exception: Cannot split a list into less than 1 list

    Empty list
    >>> split_list_equally([], 2)
    [[], []]

    """

    if num_groups < 1: raise Exception("Cannot split a list into less than 1 list")

    start = 0
    answer = []
    for i in range(num_groups):
        stop = start + len(inlist[i::num_groups])
        answer.append(inlist[start:stop])
        start = stop
    return answer


# -----------------------
def randnum(low, high, size=None):
    """ Return random floats in interval [low,high). size returns dimensions of returned singleton, array, or matrix.
    if low > high, re-ordered to make sensible.

    >>> N.random.seed(0)

    Default Singleton
    >>> randnum(-1,1)
    0.0976270078546495

    Explicit 1-length array
    >>> randnum(-1,1,1)
    array([ 0.43037873])

    Array
    >>> randnum(-1,1,10)
    array([ 0.20552675,  0.08976637, -0.1526904 ,  0.29178823, -0.12482558,
            0.783546  ,  0.92732552, -0.23311696,  0.58345008,  0.05778984])

    Matrix
    >>> randnum(-1,1,(4,4))
    array([[ 0.13608912,  0.85119328, -0.85792788, -0.8257414 ],
           [-0.95956321,  0.66523969,  0.5563135 ,  0.7400243 ],
           [ 0.95723668,  0.59831713, -0.07704128,  0.56105835],
           [-0.76345115,  0.27984204, -0.71329343,  0.88933783]])

    """

    return N.random.random(size) * N.abs(high - low) + N.min((high, low))


# -----------------------
def indices_per_group_id(group_ids, sort_indices=False):
    """ Given an array of group_ids in any order, returns lists of indices for each unique group_id.

    Args:
        group_ids   : An iterable of the ids to locate
        sort_indices: Should the list of returned indices be itself sorted? Default False for speed.
    Returns:
        indices     : A list of lists, indices[per group_id_index] = (indices into group_ids of this group id)
        unique_ids  : A list of the unique_ids, in the same order as indices above

    >>> test_ids = N.linspace(-2,2,10).astype(int)
    >>> test_ids
    array([-2, -1, -1,  0,  0,  0,  0,  1,  1,  2])

    Basic use case
    >>> indices, unique_ids = indices_per_group_id(test_ids)

    Notice return indices are not themselves sorted!
    >>> PP(indices)
    [array([0]), array([1, 2]), array([3, 4, 5, 6]), array([7, 8]), array([9])]

    >>> unique_ids
    [-2, -1, 0, 1, 2]

    >>> len(unique_ids) == len(indices)
    True

    Empty use case
    >>> indices_per_group_id([])
    (array([], dtype=int64), array([], dtype=float64))

    Very large case (~1e7) with group_ids that, even after base subtraction, require int64 representation (like sounding ids)
    >>> BASE = 200101010101011
    >>> group_ids = N.array( sorted(range(BASE, BASE + int(1e6*1e4), int(1e4))), dtype = N.int64 )
    >>> len(group_ids)
    1000000
    >>> group_ids
    array([200101010101011, 200101010111011, 200101010121011, ...,
           200111010071011, 200111010081011, 200111010091011])
    >>> indices, unique_ids = indices_per_group_id( group_ids, sort_indices = True )
    >>> unique_ids[0:10]
    [200101010101011, 200101010111011, 200101010121011, 200101010131011, 200101010141011, 200101010151011, 200101010161011, 200101010171011, 200101010181011, 200101010191011]
    >>> len(indices[0]), len(indices[1])
    (1, 1)

    """

    if len(group_ids) == 0: return N.array([]).astype(int), N.array([])

    from scipy.ndimage.measurements import find_objects

    group_ids = N.array(group_ids)

    idx = N.argsort(group_ids)
    # Beware, group_ids of zero would be ignored by find_objects
    # Let's perform a dictionary replacement of all unique entries with advancing integers from 1 to N
    unique_ids = sortunique(group_ids)

    if len(unique_ids) > 2147483647:
        raise Exception(
            "find_objects cannot handle more than int32.maxint group_ids. Reduce number of potential groups.")

    repdict = dict(zip(unique_ids, range(1, 1 + len(unique_ids))))
    sorted_ids = [repdict[x] for x in group_ids[idx]]

    # Process each group
    ret_indices = []
    ret_ids = []

    for area in find_objects(sorted_ids):
        if area is None: continue
        ret_ids.append(group_ids[idx[area][0]])
        ret_indices.append(idx[area])

    if not sort_indices:
        return ret_indices, ret_ids
    else:
        return [sorted(_indices) for _indices in ret_indices], ret_ids


# -----------------------
def subtract_median(array):
    """ Subtracts off the median from an array.
    >>> subtract_median(range(10))
    array([-4.5, -3.5, -2.5, -1.5, -0.5,  0.5,  1.5,  2.5,  3.5,  4.5])
    >>> subtract_median(1)
    0.0
    >>> subtract_median([])
    []

    """
    if mlib.mtypes.isarray(array) and len(array) == 0: return array
    return N.array(array) - N.median(array)


# -----------------------
def subtract_mean(array):
    """ Subtracts off the mean from an array.
    >>> subtract_mean(range(10))
    array([-4.5, -3.5, -2.5, -1.5, -0.5,  0.5,  1.5,  2.5,  3.5,  4.5])
    >>> subtract_mean(1)
    0.0
    >>> subtract_mean([])
    array([], dtype=float64)
    """
    return N.array(array) - N.mean(array)


# -----------------------
def function_on_groups(vector, group_indices, func):
    """ Performs an operation on groups given by group_indices using the data in vector.
    Args:
        vector: array of values to process as groups
        group_indices: a list of arrays specifying the indices of individual groups, as returned by indices_per_group_id
        func  : a function that takes in an array of values (within a group) and returns a similarly sized answer vector.
                Examples would be subtract_median or divide_by_std.
                If function returns a single value, it is mapped to the length of vector elements

    >>> test_ids = N.linspace(-2,2,10).astype(int)
    >>> test_ids
    array([-2, -1, -1,  0,  0,  0,  0,  1,  1,  2])

    >>> test_vals = N.arange (100,110)
    >>> test_vals
    array([100, 101, 102, 103, 104, 105, 106, 107, 108, 109])

    >>> indices, unique_ids = indices_per_group_id(test_ids)
    >>> indices
    [array([0]), array([1, 2]), array([3, 4, 5, 6]), array([7, 8]), array([9])]

    >>> function_on_groups(test_vals, indices, func = N.min)
    array([ 100.,  101.,  101.,  103.,  103.,  103.,  103.,  107.,  107.,  109.])

    >>> function_on_groups(test_vals, indices, func = N.max)
    array([ 100.,  102.,  102.,  106.,  106.,  106.,  106.,  108.,  108.,  109.])

    >>> function_on_groups(test_vals, indices, func = subtract_mean)
    array([ 0. , -0.5,  0.5, -1.5, -0.5,  0.5,  1.5, -0.5,  0.5,  0. ])

    >>> function_on_groups(test_vals, indices, func = subtract_median)
    array([ 0. , -0.5,  0.5, -1.5, -0.5,  0.5,  1.5, -0.5,  0.5,  0. ])

    """

    # Cast integers as floats to maintain accuracy
    if mlib.mtypes.isint(vector[0]):
        result = N.array(vector, dtype=float)
    else:
        result = vector[:]

    # Iterate on each group of indices and apply function
    for group in group_indices:
        group_result = func(vector[group])
        if is_not_iterable(group_result):
            result[group] = [group_result, ] * len(vector[group])
        else:
            result[group] = group_result

    return result


# --------------------
def mean_top_percentile(array, percent):
    """ Take the mean of the top 'percent' percentile and above.
    Args:
        percent: the percentage to integrate from up to 100%

    >>> mean_top_percentile(range(101), 50)
    75.0
    >>> mean_top_percentile(range(101), 90)
    95.0

    >>> mean_top_percentile([],90)
    nan

    """

    return N.mean(sorted(array)[int(len(array) * percent / 100.0):])


# --------------------
def mean_bottom_percentile(array, percent):
    """ Take the mean of the bottom 'percent' percentile and below.
    Args:
        percent: the percentage to integrate from down to 0%

    >>> mean_bottom_percentile(range(101), 50)
    24.5
    >>> mean_bottom_percentile(range(101), 10)
    4.5

    >>> mean_bottom_percentile([],90)
    nan

    """

    return N.mean(sorted(array)[: int(len(array) * percent / 100.0)])


# --------------------
def group_array_by_array(array_groups, array_elements):
    """ Takes the matching elements in array_groups and array_elements and transforms them
    into a default dictionary of {'group1':(element1, element2,...), 'group2':(element1, element 2,...)}
    Like itertools.groupby, except no need to pre-sort array_groups

    >>> array_groups   = [1,1,2,2,3,3,2,2,1,1]
    >>> array_elements = [1,2,1,2,1,2,3,4,3,4]
    >>> group_array_by_array(array_groups, array_elements)
    defaultdict(<class 'list'>, {1: [1, 2, 3, 4], 2: [1, 2, 3, 4], 3: [1, 2]})

    >>> empty = group_array_by_array([],[])
    >>> empty
    defaultdict(<class 'list'>, {})

    Default dicts are neat... attempting to access a missing key value obtains the empty set
    >>> empty[5]
    []

    >>> group_array_by_array([1,2],[3,4,5])
    Traceback (most recent call last):
    Exception: arrays for groups and elements must match length
    """
    sortkeyfn = key = lambda s: s[0]

    if len(array_groups) != len(array_elements):
        raise Exception("arrays for groups and elements must match length")

    # Sort by group  # Make a function that returns the zeroth (group) element
    sorted_groups = sorted(zip(array_groups, array_elements), key=sortkeyfn)

    from itertools import groupby
    # Convert groupby iterator output into dictionary
    result = C.defaultdict(list)
    for key, valuesiter in groupby(sorted_groups, key=sortkeyfn):
        result[key] = list(x[1] for x in valuesiter)

    return result


# --------------------
def dict_to_object(dictionary):
    """ Converts a dictionary to an object with attributes named/valued precisely like dictionary.
    Mainly useful for creating a return object where one is expected by convention.

    >>> obj = dict_to_object({'test1': 1, 'test2': 'hello', 'test3':N.array(range(3)), 'test4':{'a':1,'b':2}})
    >>> obj.test1
    1
    >>> obj.test2
    'hello'
    >>> obj.test3
    array([0, 1, 2])
    >>> obj.test4
    {'a': 1, 'b': 2}

    """

    from collections import namedtuple

    fields = ' '.join(dictionary.keys())
    tempobj = namedtuple('tempobj', fields)
    instance = tempobj(**dictionary)

    return instance


# --------------------
def monotonic(indata, check_type=""):
    """ Evaluates an interable to check whether it is monotonic and, if requested, is increasing or decreasing.
    Valid check_types are "increasing", "decreasing", or simply to leave blank for either kind of monotonicity.
    May also add "strict" meaning equal elements are not acceptable.

    Test open case monotonic
    >>> monotonic(range(0,10))
    True
    >>> monotonic(range(10,0,-1))
    True
    >>> monotonic(range(0,10)+[8,])
    False
    >>> monotonic(range(10,0,-1)+[9,])
    False

    Test strict case monotonic
    >>> monotonic(range(0,10),'strict')
    True
    >>> monotonic(range(0,10)+[9,],'strict')
    False
    >>> monotonic(range(0,10)+[9,])
    True
    >>> monotonic(range(10,0,-1),'strict')
    True
    >>> monotonic(range(10,0,-1)+[1,],'strict')
    False
    >>> monotonic(range(10,0,-1)+[1,])
    True

    Test increasing cases
    >>> monotonic(range(0,10),'increasing')
    True
    >>> monotonic(range(0,10)+[9,],'increasing')
    True
    >>> monotonic(range(0,10)+[9,],'increasing strict')
    False
    >>> monotonic(range(10,0,-1),'increasing strict')
    False

    Test decreasing cases
    >>> monotonic(range(0,10),'decreasing')
    False
    >>> monotonic(range(10,0,-1),'decreasing')
    True
    >>> monotonic(range(10,0,-1)+[1,],'decreasing')
    True
    >>> monotonic(range(10,0,-1)+[1,],'decreasing strict')
    False
    """

    check_type = check_type.lower()

    if "non" in check_type: raise Exception(
        "Do not specify non-increasing etc. Specify the positive indication desired.")

    increasing = "incre" in check_type
    decreasing = "decre" in check_type
    strict = "strict" in check_type

    # Handle strict cases (strictly increasing, strictly decreasing)
    if strict and increasing: return all(x < y for x, y in zip(indata, indata[1:]))
    if strict and decreasing: return all(x > y for x, y in zip(indata, indata[1:]))
    # Handle open cases (non_decreasing, non_increasing)
    if increasing: return all(x <= y for x, y in zip(indata, indata[1:]))
    if decreasing: return all(x >= y for x, y in zip(indata, indata[1:]))
    # Handle either increasing or decreasing cases
    if strict:
        return all(x < y for x, y in zip(indata, indata[1:])) or all(x > y for x, y in zip(indata, indata[1:]))
    else:
        return all(x <= y for x, y in zip(indata, indata[1:])) or all(x >= y for x, y in zip(indata, indata[1:]))


# --------------------
def sortunique(seq, reverse=False):
    """ Makes elements of the list unique and sorts them.

    >>> sortunique([1,1,1,2,3,4,4,4,4,5,6,100], reverse = True)
    [100, 6, 5, 4, 3, 2, 1]

    >>> sortunique([9,2,1,6,1,100,1])
    [1, 2, 6, 9, 100]

    """

    return sorted(unique(seq), reverse=reverse)


# --------------------
def unique(seq):
    """ Makes elements of the list unique while preserving original order.

    >>> unique([1,1,1,2,3,4,4,4,4,5,6,100])
    [1, 2, 3, 4, 5, 6, 100]

    >>> unique([1,2,1,6,1,100,1])
    [1, 2, 6, 100]
    """
    seen = set()
    seen_add = seen.add  # this is a speed optimization, non-intuitive
    return [x for x in seq if not (x in seen or seen_add(x))]


# --------------------
def rsquared(y_true, y_predict):
    """ Return R^2 (coefficient of determination) between two (linearly related) series.
    Non-linear fits can be compared by computing R^2 between Y_pred and Y_actual after the fit.
    Can be interpretted as %Variance Explained

    Standard problem
    >>> rsquared([1,2,3,4,5,6],[1,2,1,2,3,4])
    0.085714285714285743

    Just predict the mean of Y defines R2 = 0
    >>> rsquared([1,2,3,4,5,6],[3.5,]*6)
    0.0

    Predicting worse than the mean of Y
    >>> rsquared([1,2,3,4,5,6],[0,0,0,0,0,0])
    -4.2000000000000002
    """

    #    import scipy.stats as S
    #    slope, intercept, r_value, p_value, std_err = S.linregress(y_true, y_predict)
    #    return r_value**2

    return r2_score(y_true, y_predict, multioutput='uniform_average')


# --------------------
def mask_right_elements_in_left_array(left_array, right_array):
    """ Returns a mask for the left_array selecting elements that are present in the right array.

    >>> mask_right_elements_in_left_array(range(10),[1,3,5])
    array([False,  True, False,  True, False,  True, False, False, False, False], dtype=bool)

    >>> mask_right_elements_in_left_array(range(10),[])
    array([False, False, False, False, False, False, False, False, False, False], dtype=bool)

    >>> mask_right_elements_in_left_array(N.arange(10),[-1])
    array([False, False, False, False, False, False, False, False, False, False], dtype=bool)

    >>> mask_right_elements_in_left_array([],[1,2,3])
    []

    """

    if len(left_array) < 1: return []

    # use a dictionary for fast lookup
    fastlookup = dict(zip(right_array, [True, ] * len(right_array)))
    return N.array([x in fastlookup for x in left_array])


# --------------------
def subsample_indices(num_available, num_desired, with_replacement=False, preselect=None, randomseed=None):
    """ Creates a list of indices that produce a sub(super)sample to user specifications. Shuffles index order upon return.

    Args:
        num_available    : number of elements available to select
        num_desired      : number of elements desired in subset, may be larger than num_available (guarenteeing duplicates)
        with_replacement : boolean, selects with replacement (for bootstrapping) or without (for non-overlapping subsamples)
        preselect: boolean mask or integer indices that pre-select specified points before random draws begin, ignored if with_replacement
        randomseed       : None retains numpy's global seed, while an integer sets it to a specified configuration (usually 0)

    Return vals:
        Ndarray(int) of indices to subsampled points

    Basic usage

    >>> subsample_indices(100,10,randomseed = 0)
    array([75, 16, 54, 86, 73, 95, 55, 93, 26,  2])

    Forcing preselection indices

    >>> subsample_indices(100,10,randomseed = 0, preselect = [1,3,5])
    array([87, 58, 84,  3, 71, 19, 29,  4,  1,  5])

    with_replacement (can) repeat selections

    >>> subsample_indices(15,10,randomseed = 0,with_replacement=True)
    array([ 3,  5,  5,  3,  3, 12,  7,  9, 11,  0])

    Same call, but without replacement

    >>> subsample_indices(15,10,randomseed = 0,with_replacement=False)
    array([ 4,  8,  9, 14,  7,  1, 10, 13,  2,  6])

    Selecting all the elements returns, of course, the entire span of indices

    >>> subsample_indices(5,5,randomseed = 0)
    array([0, 2, 1, 4, 3])

    Selecting twice as many elements as exist doubles each element

    >>> subsample_indices(5,10,randomseed = 0)
    array([1, 0, 4, 0, 2, 3, 1, 2, 4, 3])

    Specifying 2.5 times the number of elements automatically selects all indices twice, then randomly draws the remaining

    >>> subsample_indices(5,15,randomseed = 0)
    array([0, 1, 3, 1, 3, 0, 4, 2, 0, 2, 4, 2, 4, 1, 3])

    Specifying 2.5 times the number of elements is trivial with replacement... just a list of random indices with nothing guarenteed

    >>> subsample_indices(5,15,randomseed = 0,with_replacement=True)
    array([3, 0, 0, 3, 2, 1, 4, 4, 3, 3, 2, 4, 0, 1, 0])

    """

    num_desired = int(num_desired)

    if randomseed is not None: N.random.seed(randomseed)

    # if a preselect is present, ensure it is Narray and boolean mask (convert indices)
    if preselect is not None:
        preselect = N.array(preselect)
        newmask = N.zeros(num_available, dtype='bool')
        newmask[preselect] = True
        preselect = newmask
        num_preselected = N.sum(preselect)

    if not with_replacement:

        selected_idx = []
        # Keep copying the entire Dataset as long as needed
        while num_desired >= num_available:
            selected_idx.extend(range(num_available))
            num_desired -= num_available

        # If we duplicated more than the sample, we have already covered our bases, so preselection is irrelevant
        if len(selected_idx) > 0:
            # Copy a random subset without replacement for the remaining desired samples
            selected_idx.extend(N.random.permutation(num_available)[:num_desired])

        # We have not yet added anything, normal regime, so do the preselection (if relevant) and residual random sampling
        else:
            # If there's a preselect, include them immediately
            if preselect is not None:
                # We can satisfy the entire request just from the preselect
                if num_desired <= num_preselected:
                    preselect_idx = N.where(preselect)[0]
                    N.random.shuffle(preselect_idx)
                    selected_idx = preselect_idx[:num_desired]
                # Use the entire preselect and pack with additional sampling
                else:
                    selected_idx = list(N.where(preselect)[0])
                    num_desired -= num_preselected
                    potential_idx = N.where(~preselect)[0]
                    N.random.shuffle(potential_idx)
                    selected_idx.extend(potential_idx[:num_desired])
            # No preselection mask, so just do the random sampling directly and simply
            else:
                selected_idx = N.random.permutation(num_available)[:num_desired]

    # We DO want replacement, so preselection is irrelevant
    else:

        # Simply create num_desired random draws
        selected_idx = N.random.randint(0, num_available, num_desired)

    # Perform a final random ordering of the selection
    selected_idx = N.array(selected_idx)
    N.random.shuffle(selected_idx)

    return selected_idx


# -------------------------
def center_of_mass(nd_points, weights=None):
    """ Finds the center of mass of an N-dimensional point cloud

    Args:
        nd_points: (numsamples x numdimensions) array
        weights  : (numsamples) array to multiply against each point during calculation (optional)
    Returns:
        NdArray of coordinates of center of mass

    Simple usage

    >>> center_of_mass(((1,2),(2,3),(4,5)))
    array([ 2.33333333,  3.33333333])

    Weighting more distance points more heavily

    >>> center_of_mass(((1,2),(2,3),(4,5)), weights = (1,2,3) )
    array([ 2.83333333,  3.83333333])

    """

    return N.average(nd_points, axis=0, weights=weights)


# -------------------------
def point_nearest_center_of_mass(nd_points, weights=None):
    """ Return the point nearest the centroid of a point cloud.
    Weights used to calculate center of mass.

    Points in a 1D line embedded in 4D, easy
    >>> point_nearest_center_of_mass([ [1, 1, 1, 1], [2, 2, 2, 2], [3, 3, 3, 3] ])
    1

    Points in a square plane with obvious center
    >>> point_nearest_center_of_mass([ [1,0], [0,1], [1,1], [0,0], [0.5,0.5] ])
    4

    Re-weight to shit towards upper right corner
    >>> point_nearest_center_of_mass([ [1,0], [0,1], [1,1], [0,0], [0.5,0.5] ], [0, 0, 1, 0, 0])
    2

    >>> point_nearest_center_of_mass([])
    Traceback (most recent call last):
    ValueError: XA must be a 2-dimensional array.

    """

    COM = center_of_mass(nd_points, weights)
    return N.argmin(cdist(nd_points, (COM,), 'sqeuclidean'))


# Quick function to return a dictionary of every stat about an array of values you could want
def stats_all(indata):
    return {'count': len(indata),  # Count
            'nanmin': N.nanmin(indata),  # min
            'nanmax': N.nanmax(indata),  # max
            'nanmean': N.nanmean(indata),  # mean
            'median': median_element(indata),  # median
            'mode': mode(indata),  # mode
            'nanstd': N.nanstd(indata),  # std
            'rms': N.linalg.norm(indata) / N.sqrt(len(indata)),  # rms
            'nans': N.sum(N.isnan(indata)),  # number of nans
            'infs': N.sum(N.isinf(indata)),  # number of infs
            }


# -------------------------
def count(var):
    """ Count how many items are in a list. Useful for passing to histogram functions. """
    return len(var)


def nancount(var):
    return N.sum(~N.isnan(var))


def log10count(var):
    return N.log10(count(var) + 1)


def log10nancount(var):
    return N.log10(nancount(var) + 1)


# Just returns values passed to it, used in case statements to do nothing
def noop(var):
    return var


def rolling_window_func_3D(func, var, windowsize=4, last_most_significant=True, weights=True):
    """ Take the weighted function of passed values, using only the last few values, and de-weighting more distant values.

    Args:
        func      : Numpy array function to apply to window values (or weighted window values).
                    Examples N.min N.max N.median. Must support axis param.
        var       : NDarray containing values to process. Must be 3D, and last axis is the "time" axis to roll over.
        windowsize: The window size to include with the current index on the right(left)-hand side
        weights   : If True, multiplies values in var by a linearly decreasing weighting function. Otherwise just take func directly
        last_most_significant: Reverses current index to be on the left-hand-side of the window
    Returns:
        array     : Ndarray the same shape as var with the sliding window func applied at each index. Values near edges use as many values as available.

    >>> testvals = N.zeros((3,4,5))
    >>> testvals[:,:,0] = 9
    >>> testvals[:,:,1] = 1
    >>> testvals[:,:,2] = 2
    >>> testvals[:,:,3] = 3
    >>> testvals[:,:,4] = 2

    Test max function from index to the left
    >>> val = rolling_window_func_3D( N.max, testvals, 5)
    >>> val[0,0,:]
    array([ 9. ,  7.2,  5.4,  3.6,  2.4])
    >>> val[:,:,0]
    array([[ 9.,  9.,  9.,  9.],
           [ 9.,  9.,  9.,  9.],
           [ 9.,  9.,  9.,  9.]])

    >>> val = rolling_window_func_3D( N.max, testvals, 5, weights = False)
    >>> val[0,0,:]
    array([ 9.,  9.,  9.,  9.,  9.])

    >>> val = rolling_window_func_3D( N.max, testvals, 3, weights = False)
    >>> val[0,0,:]
    array([ 9.,  9.,  9.,  3.,  3.])

    Test max function from index to the right
    >>> val = rolling_window_func_3D( N.max, testvals, 5, last_most_significant = False, weights = False)
    >>> val[0,0,:]
    array([ 9.,  3.,  3.,  3.,  2.])
    >>> val[:,:,0]
    array([[ 9.,  9.,  9.,  9.],
           [ 9.,  9.,  9.,  9.],
           [ 9.,  9.,  9.,  9.]])

    >>> val = rolling_window_func_3D( N.max, testvals, 5, last_most_significant = False, weights = True )
    >>> val[0,0,:]
    array([ 9. ,  1.8,  2.4,  3. ,  2. ])

    >>> val = rolling_window_func_3D( N.max, testvals, 2, last_most_significant = False, weights = False)
    >>> val[0,0,:]
    array([ 9.,  2.,  3.,  3.,  2.])

    Test min function instead
    >>> val = rolling_window_func_3D( N.min, testvals, 5)
    >>> val[0,0,:]
    array([ 9. ,  1. ,  0.8,  0.6,  0.4])

    >>> val = rolling_window_func_3D( N.max, testvals, 3)
    >>> val[0,0,:]
    array([ 9.,  6.,  3.,  3.,  2.])

    >>> rolling_window_func_3D( N.max, testvals, 0)
    Traceback (most recent call last):
    Exception: No general default for zero window size

    >>> testvals[0,0,0] = N.nan
    >>> val = rolling_window_func_3D( N.max, testvals, 3)
    >>> val[0,0,:]
    array([ nan,  nan,  nan,   3.,   2.])

    >>> rolling_window_func_3D( N.max, N.array([]), 3)
    Traceback (most recent call last):
    Exception: Must provide 3D data

    """

    # Sanity check inputs
    if not mlib.mtypes.isnarray(var): raise Exception('Must provide an NDarray of at least 1 dimension')
    if len(var.shape) != 3: raise Exception('Must provide 3D data')
    if windowsize == 0: raise Exception('No general default for zero window size')

    # Reduce windowsize if necessary
    if windowsize > var.shape[-1]: windowsize = var.shape[-1]

    # Prellocate answer
    answer = var.copy()
    # Pre-calculate weights if needed
    if weights:
        if last_most_significant:
            wval = N.linspace(0, 1, windowsize + 1)[1:]
        else:
            wval = N.linspace(1, 0, windowsize + 1)[:-1]

    if last_most_significant:

        for i in range(var.shape[2]):
            # Decide on left edge of current rolling window
            left = N.max((i + 1 - windowsize, 0))
            # grab working values to process
            vals = var[:, :, left:i + 1]
            # multiply by weights if requested
            if weights:
                _wval = wval[windowsize - (i + 1 - left):].reshape((1, 1, i + 1 - left))
                vals = vals * _wval
            # Calculate function supporting axis argument
            ans = func(vals, axis=2)
            # Insert into global answer array
            answer[:, :, i] = ans[:]

    else:

        for i in range(var.shape[2]):
            # Decide on left edge of current rolling window
            right = N.min((i + windowsize, var.shape[2]))
            # grab working values to process
            vals = var[:, :, i:right]
            # multiply by weights if requested
            if weights:
                _wval = wval[:(right - i)].reshape((1, 1, right - i))
                vals = vals * _wval
            # Calculate function supporting axis argument
            ans = func(vals, axis=2)
            # Insert into global answer array
            answer[:, :, i] = ans[:]

    return answer


def weighted_window_func(func, var, size=4, last_most_significant=True, weights=True):
    """ Take the weighted function of passed values, using only the last few values, and de-weighting more distant values.

    Args:
        func: Function to apply to window values (or weighted window values). Examples N.min N.max N.median
        var : Variable containing values to process
        size: The window size to include with the current index on the right-hand side
        last_most_significant: Reverses current index to be on the left-hand-side of the window
        weights: If True, multiplies values in var by a linearly decreasing weighting function. Otherwise just take func directly
    Returns:
        func_array: An array the same size as var with the sliding window func applied at each index. Values near edges use as many values as available.

    >>> testvals = [9, 1, 2, 3, 2]

    Test max function from index to the left
    >>> weighted_window_func( N.max, testvals, 5, last_most_significant = True)
    array([ 9. ,  7.2,  5.4,  3.6,  2.4])

    Test max function from index to the right
    >>> weighted_window_func( N.max, testvals, 5, last_most_significant = False)
    array([ 9. ,  1.8,  2.4,  3. ,  2. ])

    Test min function instead
    >>> weighted_window_func( N.min, testvals, 5, last_most_significant = True)
    array([ 9. ,  1. ,  0.8,  0.6,  0.4])

    >>> weighted_window_func( N.max, testvals + testvals, 5)
    array([ 9. ,  7.2,  5.4,  3.6,  2.4,  9. ,  7.2,  5.4,  3.6,  2.4])

    >>> weighted_window_func( N.max, testvals + testvals, 5, weights = False)
    array([ 9.,  9.,  9.,  9.,  9.,  9.,  9.,  9.,  9.,  9.])

    >>> weighted_window_func( N.max, [N.nan,] + testvals, 3)
    array([ nan,  nan,  nan,   3.,   3.,   2.])

    >>> weighted_window_func( N.max, [], 3)
    Traceback (most recent call last):
    Exception: weighted_window_func must be passed a non-empty list

    >>> weighted_window_func( N.max, [1,2], 0)
    array([ nan,  nan])

    """

    if len(var) == 0: raise Exception('weighted_window_func must be passed a non-empty list')
    if size == 0: return N.nan * N.array(var)
    if size == 1: return var
    if size > len(var): size = len(var)

    var = N.array(var, dtype=N.float64)
    retval = var.copy()

    if last_most_significant:

        weights = N.linspace(0, 1, size + 1)[1:] if weights else N.ones(size)
        for i in range(len(var)):
            left = N.max((i + 1 - size, 0))
            retval[i] = func(var[left:i + 1] * weights[size - (i + 1 - left):])

    else:

        weights = N.linspace(1, 0, size + 1)[:-1] if weights else N.ones(size)
        for i in range(len(var)):
            right = N.min((i + size, len(var)))
            retval[i] = func(var[i:right] * weights[:right - i])

    return retval


def scaled_standardize(var, sig_to_keep=2):
    """ Standardize (to the median), then truncate at a given # stdev, then scale from 0-1.
    Gets rid of outlier effects more than standardization.

    >>> scaled_standardize (N.arange(5))
    array([ 0.18377223,  0.34188612,  0.5       ,  0.65811388,  0.81622777])

    >>> scaled_standardize (N.arange(10,5,-1))
    array([ 0.81622777,  0.65811388,  0.5       ,  0.34188612,  0.18377223])

    >>> scaled_standardize (N.arange(5)+1)
    array([ 0.18377223,  0.34188612,  0.5       ,  0.65811388,  0.81622777])

    >>> scaled_standardize([1,N.nan])
    array([ nan,  nan])

    >>> scaled_standardize([])
    []

    """

    if len(var) < 1: return var

    if N.any(N.isnan(var)): return N.array(var) * N.nan

    # Normalize via standardization
    std = N.std(N.array(var, dtype=N.float64), ddof=1)
    var = (var - N.median(var)) / std

    # Scale 2 sigma range back into 0-255
    var[var < -sig_to_keep] = -sig_to_keep
    var[var > sig_to_keep] = sig_to_keep
    var += sig_to_keep
    var /= 2.0 * sig_to_keep

    return var


def standardize(var):
    """ Standardize a variable (unit standard deviation, szero mean).

    >>> standardize (N.arange(5))
    array([-1.26491106, -0.63245553,  0.        ,  0.63245553,  1.26491106])

    >>> standardize (N.arange(10,5,-1))
    array([ 1.26491106,  0.63245553,  0.        , -0.63245553, -1.26491106])

    >>> standardize (N.arange(5)+1)
    array([-1.26491106, -0.63245553,  0.        ,  0.63245553,  1.26491106])

    >>> standardize([1,N.nan])
    array([ nan,  nan])

    >>> standardize([])
    []

    """

    if is_iterable(var) and len(var) == 0: return []

    std = N.std(N.array(var, dtype=N.float64), ddof=1)
    return (N.array(var) - N.mean(var)) / std


def scale(var):
    """ Scale a variable to fit between 0 and 1, alternate normalization.

    >>> scale (N.arange(5))
    array([ 0.  ,  0.25,  0.5 ,  0.75,  1.  ])

    >>> scale (N.arange(10,5,-1))
    array([ 1.  ,  0.75,  0.5 ,  0.25,  0.  ])

    >>> scale (N.arange(5)+1)
    array([ 0.  ,  0.25,  0.5 ,  0.75,  1.  ])

    >>> scale([1,N.nan])
    array([ nan,  nan])

    >>> scale([])
    []

    """

    if is_iterable(var) and len(var) == 0: return []

    nmax = N.max(var)
    nmin = N.min(var)
    return (N.array(var, dtype='float64') - nmin) / (nmax - nmin)


# Normalize an array of data in various ways
# kind determines which normalization style to use:
#  None, 'none', False                = Do not alter data, a noop
#  'standardize','standard','z', True = utilizes (v-mean)/std (range -Inf to Inf for outliers, std = 1, mean = 0)
#  'scaling','scale', 'flat'          = utilizes (v-vmin)/(vmax-vmin) (range 0-1 guarenteed, outliers may push bulk/mean to similar values)
def normalize(vals, kind='standardize'):
    # various ways to say I don't want to normalize at all
    if (kind is None) or (kind == False) or (kind.lower() in ('none', 'no')): kind = 'none'

    # Default value is standardization (safest of all methods)
    if kind == True: kind = 'standardize'

    request = kind.lower()
    if request in ('none'): return vals
    if request in ('standardize', 'standard', 'z'): return standardize(vals)
    if request in ('scale', 'scaling', 'flat'): return scale(vals)

    raise Exception("Unknown normalization requested", kind)


def choice_with_weights(array, weights, num=1, singleton=False):
    """ Performs a random choice as per N.choice, but permits user to weight each entry.

    Args:
        array    : an iterable of the potential choices
        weights  : a weight vector indicating the relative weight of each item in the list
        num      : the number of draws from array desired
        singleton: Whether to return a single choice or a list of choices. Returns only the first matched element.
    Returns:
        element: list of elements chosen

    >>> N.random.seed(0)
    >>> choice_with_weights([1,2,3,4,5],[1,2,3,4,5],num=10)
    [4, 5, 4, 4, 4, 4, 4, 5, 5, 3]
    >>> choice_with_weights([1,2,3,4,5],[1,0,0,0,0],num=10)
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
    >>> choice_with_weights([1,2,3,4,5],[1,0,0,0,0],num=0)
    []
    >>> choice_with_weights([1,2,3,4,5],[1,0,0,0,0],num=1)
    [1]
    >>> choice_with_weights([1,2,3,4,5],[1,0,0,0,0],num=1, singleton = True)
    1
    >>> choice_with_weights([],[],num=2, singleton = True)
    []

    >>> C.Counter(choice_with_weights(['a','b','c','d'],[1,10,100,1000],num=100000))
    Counter({'d': 89917, 'c': 9082, 'b': 925, 'a': 76})

    """

    if num == 0: return []
    if len(array) != len(weights): raise Exception("weight vector length must match choice vector length")
    if len(array) < 1: return []

    weights = N.array(weights, dtype=N.float64)
    weights /= N.sum(weights)
    if singleton:
        return N.random.choice(array, 1, p=weights)[0]
    else:
        return list(N.random.choice(array, num, p=weights))


# -----------------------
def cupola_transform(indata):
    """ Modifies the data density of a vector to a uniform distribution.
    indata may be (numrows,) vector or (numrows,numfeats) matrix

    >>> cupola_transform(range(10))
    array([ 0.        ,  0.11111111,  0.22222222,  0.33333333,  0.44444444,
            0.55555556,  0.66666667,  0.77777778,  0.88888889,  1.        ])

    >>> cupola_transform([1,1,1,2,3,4,5,6,7,8,9,10,10])
    array([ 0.        ,  0.08333333,  0.16666667,  0.25      ,  0.33333333,
            0.41666667,  0.5       ,  0.58333333,  0.66666667,  0.75      ,
            0.83333333,  0.91666667,  1.        ])

    >>> cupola_transform([ [1,2,3],[3,2,1],[1,3,2],[2,1,3] ] )
    array([[ 0.        ,  0.33333333,  0.66666667],
           [ 1.        ,  0.66666667,  0.        ],
           [ 0.33333333,  1.        ,  0.33333333],
           [ 0.66666667,  0.        ,  1.        ]])

    """

    indata = N.array(indata)

    # Handle empty array
    if indata.size == 0: return indata

    # Handle NaN's
    if N.isnan(indata).any(): return indata * N.nan

    # Handle single vector case
    if len(indata.shape) < 2: return N.linspace(0, 1, indata.size)[N.argsort(N.argsort(indata))]

    # Handle matrix case
    cops = []
    for col in indata.T:
        cop = N.linspace(0, 1, col.size)[N.argsort(N.argsort(col))]
        cops.append(cop)
    return N.column_stack(cops)


# -----------------------
def separating_noise(vals, divisor=100.0):
    """ Separating noise is uniform random noise that separates all values in an array from each other maximally without causing
    ambiguation even between the two closest points (ignoring truly redundant points).
    The maximum noise added is default 1/100.0 the minimum datapoint spacing (divisor = 100).
    This is extremely useful when attempting to span a list of similar integers, as almost immediately all distances between
    sampled and remaining points reduces to zero due to the small number of permitted array values.

    Args:
        vals   : (possibly redundant) values to separate
        divisor: how much smaller the separating noise interval should be than the smallest non-zero distance between neighbors

    Return:
        separating_noise: Properly scaled noise ready to add to the source vals for separation

    >>> N.random.seed(0)
    >>> separating_noise( (1,1,1,2,2,3,4,5,9) )
    array([ 0.00048814,  0.00215189,  0.00102763,  0.00044883, -0.00076345,
            0.00145894, -0.00062413,  0.00391773,  0.00463663])

    >>> N.random.seed(0)
    >>> separating_noise( (1,1,1,2,2,3,4,5,9), divisor = 100000 )
    array([  4.88135039e-07,   2.15189366e-06,   1.02763376e-06,
             4.48831830e-07,  -7.63452007e-07,   1.45894113e-06,
            -6.24127887e-07,   3.91773001e-06,   4.63662761e-06])

    >>> N.random.seed(0)
    >>> separating_noise ( (1,1,1) )
    array([ 0.0488135 ,  0.21518937,  0.10276338])

    >>> N.random.seed(0)
    >>> separating_noise( (1,1,1,2,2,3,4,5,N.nan) )
    array([ 0.00048814,  0.00215189,  0.00102763,  0.00044883, -0.00076345,
            0.00145894, -0.00062413,  0.00391773,  0.00463663])

    """

    # First step is to decide on the lowest decimal required to represent actual change in the data
    # To do so, find the points with the smallest delta in the problem, ignoring redundant values

    # remove redundant values, sort them, look for the minimum delta
    # heapsort is the fastest sort if no stability is desired, and requires no additional workspace memory
    sorted_unique_list = N.sort(
        N.array(list(set([x for x in vals if (x is not None and x is not N.nan)])), dtype=N.float64), kind='heapsort')
    if len(sorted_unique_list) < 2:
        smallest_delta = divisor
    else:
        smallest_delta = N.min(N.diff(sorted_unique_list))
    #    print "Separating noise magnitude:",smallest_delta / divisor

    return smallest_delta / float(divisor) * (N.random.random(len(vals)) - 0.5)


# -----------------------
def find_breaks_in_list(values, maxdelta):
    """Look for breaks in an ascending/descending array larger than given delta.

    Args:
        values  : list of sorted values to examine for gaps
        maxdelta: report deltas larger than this value
    Returns:
        indices : Indices that bracket regions with only permitted deltas within (includes 0 and last index automatically)
                  Indices refer to the start of new regions

    >>> find_breaks_in_list( [1,2,3,4,7,8,9], 2 )
    [0, 4, 7]

    >>> find_breaks_in_list( [1,2,3,4,7,8,9], 10 )
    [0, 7]

    >>> find_breaks_in_list( [1,2,3,4,7,8,9], 0 )
    [0, 1, 2, 3, 4, 5, 6, 7]

    >>> find_breaks_in_list( [1,2,3,4,7,8,9], -1 )
    [0, 1, 2, 3, 4, 5, 6, 7]

    Redundant case still works, as long as monotonic
    >>> find_breaks_in_list( [1,2,2,3,4,7,8], 2 )
    [0, 5, 7]

    >>> find_breaks_in_list( [1,], 2 )
    [0, 1]

    >>> find_breaks_in_list( [], 2 )
    []

    """

    if len(values) < 1: return []

    break_indices = [0, ]
    for i in range(len(values) - 1):
        if N.abs(values[i + 1] - values[i]) > maxdelta:
            break_indices.append(i + 1)
    break_indices.append(len(values))
    return break_indices


# -----------------------
def list_to_intervals(indices):
    """Converts a list of indices defining regions to bracketting interval pairs.

    Args:
        indices: the intervals that define the beginnings of each region (plus the last index)
    Returns:
        pairs : the interval-defining pairs of indices. Pairs are python notation (last index is not included).

    >>> list_to_intervals( [0, 4, 6, 7] )
    [(0, 4), (4, 6), (6, 7)]

    >>> list_to_intervals( [0, 4, 7] )
    [(0, 4), (4, 7)]

    >>> list_to_intervals( [0, 1] )
    [(0, 1)]

    >>> list_to_intervals ( [1,] )
    []

    >>> list_to_intervals ( [] )
    []

    """
    # now form intervals
    intervals = []
    for i in range(len(indices) - 1):
        intervals.append((indices[i], indices[i + 1]))
    return intervals


# -----------------------
def flatten(*array_list):
    """
    Takes a list of arbitrary sublists and combines all elements into a single list.
    Can handle multiple arguments as well as arbitrarily complex lists.
    Will not iterate down into strings or dictionaries.

    >>> flatten ( [1,2,3] )
    [1, 2, 3]

    >>> flatten ( [ [1,2,3], [4,5,6] ] )
    [1, 2, 3, 4, 5, 6]

    >>> flatten ( [1,2,3], [ [4,5,6], [7,8,9] ], [10,] )
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

    >>> flatten ( [] )
    []

    >>> flatten ( [ [], [], ], [] )
    []

    >>> flatten ()
    []

    >>> flatten ( [ {1:2}, {3:4}, ( {5:6}, {7:8} ) ] )
    [{1: 2}, {3: 4}, {5: 6}, {7: 8}]

    """

    return [x for x in flatten_iterator(array_list)]


# Same as flatten, but can only handle a single argument and returns an iterator
def flatten_iterator(array_list):
    for el in array_list:
        if isinstance(el, C.Iterable) and not isinstance(el, str) and not isinstance(el, dict):
            for sub in flatten_iterator(el):
                yield sub
        else:
            yield el


# take the max and min of an arbitrary list of arrays, works even if all but one is empty
def armin(*array_list):
    return N.min(flatten(array_list))


def arnanmin(*array_list):
    return N.nanmin(flatten(array_list))


def armax(*array_list):
    return N.max(flatten(array_list))


def arnanmax(*array_list):
    return N.nanmax(flatten(array_list))


def arsum(*array_list):
    return N.sum(flatten(array_list))


def arnansum(*array_list):
    return N.nansum(flatten(array_list))


def armean(*array_list):
    return N.mean(flatten(array_list))


def arnanmean(*array_list):
    return N.nanmean(flatten(array_list))


def arstd(*array_list):
    return N.std(N.float64(flatten(array_list)), ddof=1)


def arnanstd(*array_list):
    return N.nanstd(flatten(array_list))


def first_decimal_of_sig(x):
    """ Determine the first decimal of significance (left to right) in a list of numbers.

    >>> first_decimal_of_sig((100, 10, 97.2, -97.2))
    2

    A rather undefined case, could get in trouble here
    >>> first_decimal_of_sig(0)
    Traceback (most recent call last):
    Exception: Must provide at least one non-zero for significant decimal calculation

    >>> first_decimal_of_sig((100, 0, 0.001, 1e-15))
    2

    >>> first_decimal_of_sig((0, 0.001, 1e-15))
    -3

    >>> first_decimal_of_sig((0, 1e-15))
    -15

    >>> first_decimal_of_sig(())
    Traceback (most recent call last):
    Exception: Must provide at least one non-zero for significant decimal calculation

    """
    if is_not_iterable(x): x = [x, ]

    # Can't handle zeroes, they have no sig fig information
    x = [x1 for x1 in x if not x1 == 0]

    if len(x) == 0: raise Exception("Must provide at least one non-zero for significant decimal calculation")

    return N.max(N.floor(N.log10(N.abs(x))).astype(int))


def min_sigfig_format(x, numsig):
    """ Formats a float series to the same decimal point, defind by the largest value having numsig significant digits.

    >>> min_sigfig_format([1,19,193],0)
    ['000', '000', '000']

    >>> min_sigfig_format([1,19,193],1)
    ['000', '000', '200']

    >>> min_sigfig_format([1,19,193],2)
    ['000', '020', '190']

    >>> min_sigfig_format([1,19,193],3)
    ['001', '019', '193']

    >>> min_sigfig_format([0.001, 0.019, 0.193],0)
    ['0', '0', '0']

    >>> min_sigfig_format([0.001, 0.019, 0.193],1)
    ['0.0', '0.0', '0.2']

    >>> min_sigfig_format([0.001, 0.019, 0.193],2)
    ['0.00', '0.02', '0.19']

    >>> min_sigfig_format([0.001, 0.019, 0.193],3)
    ['0.001', '0.019', '0.193']

    >>> min_sigfig_format([193, 19, 1, 0, 0.001, 0.019, 0.193],1)
    ['200', '000', '000', '000', '000', '000', '000']

    >>> min_sigfig_format([193, 19, 1, 0, 0.001, 0.019, 0.193],2)
    ['190', '020', '000', '000', '000', '000', '000']

    >>> min_sigfig_format([193, 19, 1, 0, 0.001, 0.019, 0.193],3)
    ['193', '019', '001', '000', '000', '000', '000']

    >>> min_sigfig_format([193, 19, 1, 0, 0.001, 0.019, 0.193],4)
    ['193.0', '19.0', '1.0', '0.0', '0.0', '0.0', '0.2']

    >>> min_sigfig_format([193, 19, 1, 0, 0.001, 0.019, 0.193],5)
    ['193.00', '19.00', '1.00', '0.00', '0.00', '0.02', '0.19']

    >>> min_sigfig_format([193, 19, 1, 0, 0.001, 0.019, 0.193],6)
    ['193.000', '19.000', '1.000', '0.000', '0.001', '0.019', '0.193']

    >>> min_sigfig_format([],1)
    Traceback (most recent call last):
    Exception: Must provide at least one non-zero for significant decimal calculation

    """

    first_decimal = first_decimal_of_sig(x)
    lowest_decimal_to_maintain = -first_decimal + (numsig - 1)

    # Handle case where lowest decimals to maintain are indeed below 0, standard case
    if lowest_decimal_to_maintain > 0:
        fmt = "%%0.%df" % lowest_decimal_to_maintain
        return [fmt % y for y in x]

    # Handle case where lowest decimals to maintain are above zero
    fmt = "%%0%dd" % (first_decimal + 1)
    return [fmt % N.round(y, lowest_decimal_to_maintain) for y in x]


def round_to_nearest_base(x, base=1.0, prec=2):
    """ Round the series x to the nearest 'base' value, given precision 'prec'

    >>> round_to_nearest_base(N.arange(1,10), base = 5)
    array([  0.,   0.,   5.,   5.,   5.,   5.,   5.,  10.,  10.])

    >>> round_to_nearest_base(N.arange(0,1,0.1), base = 0.25)
    array([ 0.  ,  0.  ,  0.25,  0.25,  0.5 ,  0.5 ,  0.5 ,  0.75,  0.75,  1.  ])

    >>> round_to_nearest_base(2.5)
    2.0

    >>> round_to_nearest_base([])
    array([], dtype=float64)

    """

    return N.round(base * N.round(N.array(x, dtype=N.float64) / base), prec)


def round_to_n_sigfigs(x, n):
    """ Rounds a series of values to n digits of accuracy for the largest value present.

    >>> round_to_n_sigfigs([0,10,100],1)
    array([  0,   0, 100])

    >>> round_to_n_sigfigs([0,10,100],2)
    array([  0,  10, 100])

    >>> round_to_n_sigfigs([0,10],1)
    array([ 0, 10])

    >>> round_to_n_sigfigs([],1)
    Traceback (most recent call last):
    Exception: Must provide at least one non-zero for significant decimal calculation

    >>> round_to_n_sigfigs(0,1)
    Traceback (most recent call last):
    Exception: Must provide at least one non-zero for significant decimal calculation

    >>> round_to_n_sigfigs(10,1)
    10

    >>> round_to_n_sigfigs([1,19,193],1)
    array([  0,   0, 200])

    >>> round_to_n_sigfigs([1,19,193],2)
    array([  0,  20, 190])

    >>> round_to_n_sigfigs([1,19,193],3)
    array([  1,  19, 193])


    """

    lowest_decimal_to_maintain = -first_decimal_of_sig(x) + (n - 1)
    return N.round(x, lowest_decimal_to_maintain)


def stderr(array):
    return N.std(N.float64(array)) / N.sqrt(len(array), ddof=1)


def std(array):
    """ A safe STD function that uses ddof = 1 convention as well as float64-safe math.
    Nan returned if less than two points provided."""
    if len(array) < 2: return N.nan
    return N.std(N.float64(array), ddof=1)


# inrange function
def inr(array, lv, hv, makework=True, closed_lower=False, closed_upper=False):
    """ Calculates which members of an array are within an interval specified by lv to hv.
    Defaults to an open interval.

    Args:
        array: elements to examine
        lv   : lower range boundary
        hv   : upper range boundary
        makework: flag that reverses lv/hv if necessary and continues silently
        closed_lower: closed interval on left  side, < instead of <=
        closed_upper: closed interval on right side, > instead of >=

    Returns:
        mask : a mask for array that includes only those points within range

    >>> inr((),1,2)
    array([], dtype=bool)

    >>> inr(range(10), 2, 8).astype(int)
    array([0, 0, 1, 1, 1, 1, 1, 1, 1, 0])

    >>> inr(range(10), 8, 2).astype(int)
    array([0, 0, 1, 1, 1, 1, 1, 1, 1, 0])

    >>> inr(range(10), 8, 2, makework = False).astype(int)
    array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

    >>> inr(range(10), 8, 2, closed_lower  = True).astype(int)
    array([0, 0, 0, 1, 1, 1, 1, 1, 1, 0])

    >>> inr(range(10), 8, 2, closed_upper = True).astype(int)
    array([0, 0, 1, 1, 1, 1, 1, 1, 0, 0])

    >>> inr(range(10), 8, 2, closed_lower = True, closed_upper = True).astype(int)
    array([0, 0, 0, 1, 1, 1, 1, 1, 0, 0])

    Test floats vs ints
    >>> inr(N.arange(10).astype(float), int(2), int(4)).astype(int)
    array([0, 0, 1, 1, 1, 0, 0, 0, 0, 0])

    """

    array = N.array(array)

    # Return empty mask if empty array provided
    if array.size == 0: return array.astype(bool)

    # reverse limits if presented in wrong order
    if makework:
        if lv > hv: lv, hv = hv, lv

    if not closed_lower and not closed_upper: return (array <= hv) & (array >= lv)
    if closed_lower and not closed_upper: return (array <= hv) & (array > lv)
    if not closed_lower and closed_upper: return (array < hv) & (array >= lv)
    if closed_lower and closed_upper: return (array < hv) & (array > lv)


# Calculate the rms error between two arrays
def rms_error(array1, array2):
    if len(array1) == 0: return N.nan
    return rms(array1 - array2)


# Calculate the rss error between two arrays
def rss_error(array1, array2):
    if len(array1) == 0: return N.nan
    return N.sqrt(N.dot(array1 - array2, array1 - array2))


# Make predictions based on X data, coefficients, and bias terms as from linear_regression
def make_predictions(data, coefficients, bias):
    return N.dot(data, coefficients) + bias  # x*m+b


def binned_stat(x, bins=50, y=None, limits=None, func=None, ignore_outliers=False):
    """ Binning statistics including histogram (counting) and functions of data bins.
    Major customization is bins are specified by CENTER, not by edges. #bins = specified bin values.

    Args:
        x     : One dimensional iterable containing values to bin. Nans, infs, and other special values will be ignored.
        bins  : number of bins to use (integer) or the bin centers to use directly (iterable). If not monotonically increasing, will fail.
        y     : The weights to apply (for histogramming) or the input values to be reduced by func into bins grouped by x.
        limits: The maximum extent to include in the binning. None will automatically include the full range of x. Ignored if bins specified.
        func  : The function to use to reduce the y's grouped into bins.
                'count' (default if y not given) just counts how many x's are in the bins and returns the histogram (y is ignored)
                'sum'   sums up the y's. Can be used to perform a weighted histogram.
                'mean'  (default if y given    ) takes the mean of the binned y's
                Most other functions respected, function may be passed explicitly that takes a single array as input
        ignore_outliers: Points beyond specified "limits" variable will be ignored and not plotted. Automatic if func is not 'count'.
                         If set to False and func is None or 'count', will add up outliers beyond limits and add to extreme bin values.

    Returns:
        bins, values: The bin centers used, and the values (counts) within each bin

    Simple histogram case, notice integers are aligned perfectly with bin centers
    >>> binned_stat(range(10), bins = range(10))
    (array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), array([ 1.,  1.,  1.,  1.,  1.,  1.,  1.,  1.,  1.,  1.]))

    Note that providing bins = 10 causes a slight shift in the array, as the bin centers treat max/min(limits) as edges of right(left) most bins
    >>> binned_stat(range(10), bins = 10)
    (array([ 0.45,  1.35,  2.25,  3.15,  4.05,  4.95,  5.85,  6.75,  7.65,  8.55]), array([ 1.,  1.,  1.,  1.,  1.,  1.,  1.,  1.,  1.,  2.]))

    Supplying y defaults to taking the mean of y's binned by x
    >>> binned_stat(range(10), bins = 4, y = range(10,20))
    (array([ 1.125,  3.375,  5.625,  7.875]), array([ 11. ,  13.5,  15.5,  18. ]))
    >>> binned_stat(range(10), bins = 4, y = range(10,20), func = 'mean')
    (array([ 1.125,  3.375,  5.625,  7.875]), array([ 11. ,  13.5,  15.5,  18. ]))

    Instead specify "sum" to treat the y's as weights to a histogram
    >>> binned_stat(range(10), bins = 4, y = range(10,20), func = 'sum')
    (array([ 1.125,  3.375,  5.625,  7.875]), array([ 33.,  27.,  31.,  55.]))

    Or "median" by text ref, which uses an unknown median function that is neither scipy nor Numpy
    >>> binned_stat(range(10), bins = 4, y = range(10,20), func = 'median')
    (array([ 1.125,  3.375,  5.625,  7.875]), array([ 11. ,  13.5,  15.5,  18. ]))

    or by function ref, which produces different results because now you know which median function is being used
    >>> binned_stat(range(10), bins = 4, y = range(10,20), func = N.median)
    (array([ 1.125,  3.375,  5.625,  7.875]), array([ 11. ,  13.5,  15.5,  19. ]))

    or even our own function
    >>> binned_stat(range(10), bins = 4, y = range(10,20), func = median_element)
    (array([ 1.125,  3.375,  5.625,  7.875]), array([ 11.,  13.,  15.,  19.]))

    Limits narrow the range, and since we're performing a plain histogram, the outliers are stacked on the wings
    >>> binned_stat(range(10), bins = 4, limits = [4,6])
    (array([ 4.25,  4.75,  5.25,  5.75]), array([ 5.,  0.,  1.,  5.]))

    Unless we tell it not to
    >>> binned_stat(range(10), bins = 4, limits = [4,6], ignore_outliers = True)
    (array([ 4.25,  4.75,  5.25,  5.75]), array([ 1.,  0.,  1.,  1.]))

    Specify specific bins to use, beyond range of data. Zeros filled where no data present in histogram case.
    >>> binned_stat(range(10,20), bins = range(0,30,3))
    (array([ 0,  3,  6,  9, 12, 15, 18, 21, 24, 27]), array([ 0.,  0.,  0.,  1.,  3.,  3.,  3.,  0.,  0.,  0.]))

    But in function case, can't know what function value exists in empty bins
    >>> binned_stat(range(10,20), y = range(10,20), bins = range(0,30,3), func = 'mean')
    (array([ 0,  3,  6,  9, 12, 15, 18, 21, 24, 27]), array([ nan,  nan,  nan,  10.,  12.,  15.,  18.,  nan,  nan,  nan]))

    Limits ignored if bins specified
    >>> binned_stat(range(10,20), y = range(10,20), bins = range(0,30,3), limits = [0,15], func = 'mean')
    (array([ 0,  3,  6,  9, 12, 15, 18, 21, 24, 27]), array([ nan,  nan,  nan,  10.,  12.,  15.,  18.,  nan,  nan,  nan]))

    Non-monotonically-increasing bins specified
    >>> binned_stat(range(10,20), bins = [0,1,2,3,4,4,5])
    Traceback (most recent call last):
    Exception: Specified bins must be monotonically increasing to be valid
    >>> binned_stat(range(10,20), bins = [0,1,2,3,4,5])
    (array([0, 1, 2, 3, 4, 5]), array([  0.,   0.,   0.,   0.,   0.,  10.]))
    >>> binned_stat(range(10,20), bins = [0,1,2,-3,4,5])
    Traceback (most recent call last):
    Exception: Specified bins must be monotonically increasing to be valid
    >>> binned_stat(range(10,20), bins = [0,1,2,N.nan,4,5])
    Traceback (most recent call last):
    Exception: Specified bins must be monotonically increasing to be valid

    Must match x & y array lengths
    >>> binned_stat(range(10), bins = 4, y = range(10,15))
    Traceback (most recent call last):
    Exception: x & y array lengths must match

    If you don't pass any data in, we can still do a few things...
    >>> binned_stat( (), bins = 4)
    (array([ nan,  nan,  nan,  nan]), array([0, 0, 0, 0]))

    >>> binned_stat( (), bins = range(5) )
    (array([0, 1, 2, 3, 4]), array([0, 0, 0, 0, 0]))

    """

    # assume function "count" unless specified, and always if no y is supplied
    if (func is None) and (y is not None):
        func = "mean"
    if (y is None) or (len(y) == 0):
        func = "count"
        y = None

    # Handle empty x cases for singleton bin specification
    if len(x) == 0 and is_not_iterable(bins):
        if func.lower() == "count":
            return N.array([N.nan, ] * bins), N.array([0, ] * bins)
        else:
            return N.array([N.nan, ] * bins), N.array([N.nan, ] * bins)

    # Process limits
    if limits is None:
        if len(x) > 0:
            limits = [N.min(x), N.max(x)]

    # deduce x & y length matching
    x = N.array(x, dtype=N.float64)
    if y is not None:
        if len(x) != len(y):
            raise Exception("x & y array lengths must match")
        y = N.array(y, dtype=N.float64)

    # bins must be monotonically increasing
    if is_iterable(bins) and not monotonic(bins, 'strictly increasing'):
        raise Exception("Specified bins must be monotonically increasing to be valid")

    # Remove any nans from consideration
    nanmask = ~N.isnan(x)
    if y is not None: nanmask = nanmask & (~N.isnan(y))
    x = x[nanmask]
    if y is not None: y = y[nanmask]

    # outliers ignored unless we're explicitly just counting
    if mlib.mtypes.isstr(func) and not func.lower() in ("count", "sum"):
        ignore_outliers = True

    # Define our bin centers (or use user-supplied ones)
    # A single length array is not usable, so add another 10% away
    if is_iterable(bins) and len(bins) == 1: bins = [bins[0], bins[0] * 0.1]

    if is_iterable(bins):
        delta = bins[1] - bins[0]
        limits = [N.min(bins) - delta / 2.0, N.max(bins) + delta / 2.0]
        mn, mx = limits
    else:
        if limits is None: raise Exception("Cannot specify limits None if no data or bins provided")
        mn, mx = limits
        delta = (mx - mn) / float(bins)
        if delta == 0.0: delta = 0.1  # must be able to differentiate bins, even if the input data is all identical
        bins = [mn + delta / 2.0 + delta * t for t in range(bins)]

    bins = N.array(bins)

    # Handle empty value case
    if len(x) == 0: return bins, bins * 0

    bin_edges = bins - delta / 2.0
    bin_edges = list(bin_edges) + [bin_edges[-1] + delta]

    values, bin_edges, binnumber = SPS.binned_statistic(x, y, statistic=func, bins=bin_edges)

    # Now we have to add back in values beyond the limits, as numpy ignores them annoyingly
    if not ignore_outliers:
        values[0] += N.sum(x < bin_edges[0])
        values[-1] += N.sum(x >= bin_edges[-1])

    # return bin centers, not edges
    return bins, values


# func supports mean, median, count, sum, or any user-specified function!
# count returns the ordinary histogram in 2D
# Bins are CENTERED, instead of edges or other nonsense
# what we've always wanted!
def binned_stat_2d(x, y, binsx=None, binsy=None, z=None, limitsx=None, limitsy=None, func=None, ignore_outliers=False):
    # Handle singleton case
    if is_not_iterable(x): x = [x, ]
    if is_not_iterable(y): y = [y, ]
    if z is not None and is_not_iterable(z): z = [z, ]

    x = N.array(x, dtype=N.float64)  # type: ndarray
    y = N.array(y, dtype=N.float64)
    if z is not None: z = N.array(z, dtype=N.float64)

    # assume function "count" unless specified, and always if no z is supplied
    if func is None:
        func = "mean" if z is not None else "count"

    # Handle no z or length zero z
    #    if (z is None) or (len(z) == 0):
    #        func = "count"
    #        z = None

    # if we're not performing count/sum function, outliers make no sense and cannot be included
    if mlib.mtypes.isstr(func) and not func.lower() in ("count", "sum"):
        # not currently implemented, assumed True
        ignore_outliers = True

    # Process defaults
    if limitsx is None:
        limitsx = [N.min(x), N.max(x)]
    if limitsy is None:
        limitsy = [N.min(y), N.max(y)]
    if binsx is None:
        binsx = 50
    if binsy is None:
        binsy = 50

    # Define our bin centers (or use user-supplied ones)
    if is_iterable(binsx):
        deltax = binsx[1] - binsx[0]
        limitsx = [N.min(binsx) - deltax / 2.0, N.max(binsx) + deltax / 2.0]
        mn, mx = limitsx
    else:
        mn, mx = limitsx
        deltax = (mx - mn) / float(binsx)
        if deltax == 0.0: deltax = 0.1  # must be able to differentiate bins, even if the input data is all identical
        binsx = [mn + deltax / 2.0 + deltax * t for t in range(binsx)]
    if is_iterable(binsy):
        deltay = binsy[1] - binsy[0]
        limitsx = [N.min(binsy) - deltay / 2.0, N.max(binsy) + deltay / 2.0]
        mn, mx = limitsy
    else:
        mn, mx = limitsy
        deltay = (mx - mn) / float(binsy)
        if deltay == 0.0: deltay = 0.1  # must be able to differentiate bins, even if the input data is all identical
        binsy = [mn + deltay / 2.0 + deltay * t for t in range(binsy)]

    binsx = N.array(binsx)
    binsy = N.array(binsy)

    bin_edgesx = binsx - deltax / 2.0
    bin_edgesx = list(bin_edgesx) + [bin_edgesx[-1] + deltax]
    bin_edgesy = binsy - deltay / 2.0
    bin_edgesy = list(bin_edgesy) + [bin_edgesy[-1] + deltay]

    if (len(x) == 0) and mlib.mtypes.isstr(func) and (func.lower() == 'count'):
        return binsx, binsy, N.zeros((len(binsx), len(
            binsy)))  # forcibly return zeros for count function, binned_statistic can't handle empty input list
    if len(x) == 0:
        return binsx, binsy, N.zeros(
            (len(binsx), len(binsy))) * N.nan  # forcibly return NaN's for all other functions (ill-defined)

    z_grid, x_edges, y_edges, assignments = SPS.binned_statistic_2d(x, y, z, statistic=func,
                                                                    bins=(bin_edgesx, bin_edgesy))

    # FIX THIS TO THE GRID
    # Now we have to add back in values beyond the limits, as scipy ignores them annoyingly
    #    if not ignore_outliers:
    #        values[ 0] += N.sum(x <  bin_edges[ 0])
    #        values[-1] += N.sum(x >= bin_edges[-1])

    # return bin centers, not edges
    return binsx, binsy, z_grid


# --------------------------
def mismatch_between_series(test_series, parent_series, p=1):
    """ Compute how closely spaced one series is to another.
    p specifies the norm used to express the distance between the arrays.
    p = 1 is just the sum(abs(diff)).
    p = 2 is euclidean distance
    p ~ len(series) is effectively the maximum function, focussing entirely on the largest disagreeing point.

    Base usage case, equivalent series
    >>> mismatch_between_series( (1,2,3,4,5,6,7), (1,2,3,4,5,6,7) )
    0.0

    Base usage case, p = 1
    >>> mismatch_between_series( (1,2,3,4,5,6,7), (1,2,3,9,5,6,7) )
    5.0

    Demonstrating different p metrics
    Note that there are three disagreements of delta 1, 2, and 1
    >>> mismatch_between_series( (1,2,3,4,5,6,7), (1,2,4,6,6,6,7), p=1  )
    4.0
    >>> mismatch_between_series( (1,2,3,4,5,6,7), (1,2,4,6,6,6,7), p=2  )
    2.4494897427831779
    >>> mismatch_between_series( (1,2,3,4,5,6,7), (1,2,4,6,6,6,7), p=5  )
    2.0243974584998852
    >>> mismatch_between_series( (1,2,3,4,5,6,7), (1,2,4,6,6,6,7), p=10 )
    2.0003902821013289

    Nan case... return nan
    >>> mismatch_between_series( (1,2,3,4,5,6,7), (1,2,3,9,N.nan,6,7) )
    nan

    Mismatching sizes
    >>> mismatch_between_series( (), (1,2) )
    Traceback (most recent call last):
    Exception: Cannot compare lists of differing lengths 0 vs 2

    >>> mismatch_between_series( (1,2), () )
    Traceback (most recent call last):
    Exception: Cannot compare lists of differing lengths 2 vs 0

    >>> mismatch_between_series( (1,2), (1,) )
    Traceback (most recent call last):
    Exception: Cannot compare lists of differing lengths 2 vs 1

    Empty case
    >>> mismatch_between_series( (), () )
    0.0

    DOGO_DIRECT like case
    >>> WANT = [10,20,30,40,50,60,70,80,90]
    >>> HAVE = [11,19,32,38,53,60,68,80,95]
    >>> mismatch_between_series( WANT, HAVE, p = 2 )
    6.9282032302755088

    DOGO_DIRECT like case for partial WL's
    >>> WANT = [50,60,70,80,90]
    >>> HAVE = [53,60,68,80,95]
    >>> mismatch_between_series( WANT, HAVE, p = 2 )
    6.164414002968976

    Indepenent of additive constants... good property!
    >>> WANT = N.array([50,60,70,80,90]) - 50
    >>> HAVE = N.array([53,60,68,80,95]) - 50
    >>> mismatch_between_series( WANT, HAVE, p = 2 )
    6.164414002968976

    """

    # Actually can define a maximum mismatch between empty sets. They are perfectly equal.
    if len(test_series) == 0 and len(parent_series) == 0: return 0.0

    if len(test_series) != len(parent_series):
        raise Exception("Cannot compare lists of differing lengths %d vs %d" % (len(test_series), len(parent_series)))

    return cdist((test_series,), (parent_series,), 'minkowski', p)[0][0]


# --------------------------
def deviation_from_expected_spacing(test_series, expected_spacing, p=1):
    """ Compute the spacing between list elements and how it deviates from an expected value.
    p specifies the norm used to express the distance between the arrays.
    p = 1 is just the sum(abs(diff)).
    p = 2 is euclidean distance
    p ~ len(series) is effectively the maximum function, focussing entirely on the largest disagreeing point.

    Base usage case, perfect spacing
    >>> deviation_from_expected_spacing( (0, 1,2,3,4,5,6,7), 1 )
    0.0

    Base usage case, p = 1
    >>> deviation_from_expected_spacing( (0, 1,2,3,9,5,6,7), 1 )
    10.0

    Demonstrating different p metrics
    Note that there are three disagreements of delta 1, 2, and 1
    >>> deviation_from_expected_spacing( (0, 1,2,4,6,6,6,7), 1, p=1  )
    4.0
    >>> deviation_from_expected_spacing( (0, 1,2,4,6,6,6,7), 1, p=2  )
    2.0
    >>> deviation_from_expected_spacing( (0, 1,2,4,6,6,6,7), 1, p=5  )
    1.3195079107728942
    >>> deviation_from_expected_spacing( (0, 1,2,4,6,6,6,7), 1, p=10 )
    1.1486983549970351

    Nan case... return nan
    >>> deviation_from_expected_spacing( (0,1,2,3,9,N.nan,6,7), 1 )
    nan

    Empty case
    >>> deviation_from_expected_spacing( (), 1 )
    0.0
    """

    # Actually can define a maximum mismatch between empty sets. They are perfectly equal.
    if len(test_series) == 0: return 0.0

    # Form the difference vector
    deltas = N.diff(test_series).astype(float)

    # Calculate the pnorm distance from observed deltas an expected deltas
    return cdist((deltas,), (N.ones_like(deltas) * expected_spacing,), 'minkowski', p)[0][0]


# --------------------------
def running_mean(x, window_num, median=False):
    """ Compute a very fast running mean/median.
    Args:
        X: Data to process
        window_num: size of processing window, odd makes most sense
        median    : if True, use median. Otherwise mean.

    >>> X = range(10)+range(10,-1,-1)
    >>> running_mean(X, 1)
    array([  0.,   1.,   2.,   3.,   4.,   5.,   6.,   7.,   8.,   9.,  10.,
             9.,   8.,   7.,   6.,   5.,   4.,   3.,   2.,   1.,   0.])

    >>> running_mean(X, 3)
    array([ 0.5       ,  1.        ,  2.        ,  3.        ,  4.        ,
            5.        ,  6.        ,  7.        ,  8.        ,  9.        ,
            9.33333333,  9.        ,  8.        ,  7.        ,  6.        ,
            5.        ,  4.        ,  3.        ,  2.        ,  1.        ,
            0.5       ])

    >>> running_mean(X, 3, median = True)
    array([ 0.5,  1. ,  2. ,  3. ,  4. ,  5. ,  6. ,  7. ,  8. ,  9. ,  9. ,
            9. ,  8. ,  7. ,  6. ,  5. ,  4. ,  3. ,  2. ,  1. ,  0.5])

    """

    import pandas as PA
    x = N.array(x)
    df = PA.DataFrame(x).rolling(window=window_num, center=True, min_periods=1)
    if median:
        return df.median().values.squeeze()
    else:
        return df.mean().values.squeeze()


# Sorts all provided arrays by the first
# Works on all iterables, but returns Narrays for convenience
# All elements must have the same number of elements
def sort_arrays_by_first(*args):
    """ Sorts all provided arrays by the first.
    Works on all iterables, returns Narrays for convenience
    All arrays must have the same length.

    >>> sort_arrays_by_first([1,3,2], [5,7,6])
    [array([1, 2, 3]), array([5, 6, 7])]

    >>> sort_arrays_by_first(N.array([1,3,2]), N.array([5,7,6]))
    [array([1, 2, 3]), array([5, 6, 7])]

    >>> sort_arrays_by_first([],[],[])
    ([], [], [])

    >>> sort_arrays_by_first([1,],[2,],[3,])
    ([1], [2], [3])

    """

    # empty lists and length 1 lists just get the original lists unmodified
    if len(args[0]) < 2: return args
    ret_list = unzip(sorted(zip(*args)))
    return [N.array(x).squeeze() for x in ret_list]


def sort_arrays_by_first_reverse(*args):
    # empty lists and length 1 lists just get the original lists unmodified
    if len(args[0]) < 2: return args
    ret_list = unzip(sorted(zip(*args), reverse=True))
    return [N.array(x).squeeze() for x in ret_list]


# Calculate Percent Variance Explained from RSS values
# RSS_base is the RSS from no fitting or corrective attempt (the total variance of the signal)
# RSS_current are the reduced values due to fitting or otherwise reducing variance
# Handles nan gracefully
# RSS is defined by the function of the same name in this library
# NOTE: percent_variance_explained = 100.0 * R^2
def percent_variance_explained_RSS(RSS_current, RSS_base):
    return (1.0 - RSS_current * RSS_current / RSS_base / RSS_base) * 100.0


def linear_regression_no_intercept(target, data, dropnan=False, test_target=None, test_data=None):
    """ Identical to linear_regression save that no intercept can be handled. Tested and documented in
    linear_regression. """
    import statsmodels.api as SM

    PREDICTS = test_target is not None

    model = SM.OLS(target, data, missing='drop' if dropnan else 'none')
    results = model.fit()

    slopes = results.params
    slope_errors = results.bse

    # There are a huge number of stats in this object. aic, bic, bse, centered_tss, compare_f_test,
    # cov_HCn, cov_params, cov_type, mse_model, mse_resid, mse_total, pvalues, rsquared_adj, tvalues

    # If no test data, just return train results
    if not PREDICTS: return slopes, slope_errors, results

    # Handle the test data
    test_data = N.array(test_data)
    if len(test_data.shape) == 1: test_data = N.atleast_2d(test_data).T
    target_predict = model.predict(params=results.params, exog=test_data)
    testmodel = SM.OLS(test_target, target_predict, missing='drop' if dropnan else 'none')
    testresults = testmodel.fit()
    return slopes, slope_errors, results, target_predict, testresults


def simple_linear_fit(y, x, intercept=True):
    """ Simple linear fit that fits given y values to a single dimension of x's.
    Args:
        y        : y values to fit (MUST be 1D numsamp)
        x        : x values to fit (MUST be 1D numsamp)
        intercept: whether to include an intercept in the fit
    Returns:
        slope    : The slope of the fit
        intercept: The intercept (optional)
        Ypred    : The predicted Y after fitting
        R2_adj   : The adjusted R2

    >>> Y=N.linspace(11, 20, 10)
    >>> X=N.linspace(1 , 10, 10)
    >>> slope, Ypred, R2_adj = simple_linear_fit(Y, X, intercept = False)
    >>> slope
    2.4285714285714288
    >>> Ypred
    array([  2.42857143,   4.85714286,   7.28571429,   9.71428571,
            12.14285714,  14.57142857,  17.        ,  19.42857143,
            21.85714286,  24.28571429])
    >>> R2_adj
    0.91376832423110088
    >>> slope, interc, Ypred, R2_adj = simple_linear_fit(Y, X, intercept = True)
    >>> round( slope, 14)
    1.0
    >>> Ypred
    array([ 11.,  12.,  13.,  14.,  15.,  16.,  17.,  18.,  19.,  20.])
    >>> R2_adj
    1.0
    >>> round (interc, 14)
    10.0

    A constructed signal to retrieve
    >>> X = N.arange(10)
    >>> Y = 5*X+2
    >>> slope, intercept, Ypred, R2_adj = simple_linear_fit(Y, X, intercept = True)
    >>> slope
    4.9999999999999982
    >>> intercept
    1.9999999999999...
    >>> Y
    array([ 2,  7, 12, 17, 22, 27, 32, 37, 42, 47])
    >>> Ypred
    array([  2.,   7.,  12.,  17.,  22.,  27.,  32.,  37.,  42.,  47.])

    What about an empty X?
    >>> X = []
    >>> Y = range(4)
    >>> slope, intercept, Ypred, R2_adj = simple_linear_fit(Y, X, intercept = True)
    >>> slope
    []
    >>> intercept
    1.5
    >>> Y
    [0, 1, 2, 3]
    >>> Ypred
    array([ 1.5,  1.5,  1.5,  1.5])
    >>> R2_adj
    0.0

    What about an empty X when that's appropriate?
    >>> X = []
    >>> Y = [4,4,4,4]
    >>> slope, intercept, Ypred, R2_adj = simple_linear_fit(Y, X, intercept = True)
    >>> R2_adj
    1.0
    >>> intercept
    4.0

    >>> X = []
    >>> Y = range(4)
    >>> slope, intercept, Ypred, R2_adj = simple_linear_fit(Y, X, intercept = False)
    Traceback (most recent call last):
    Exception: No degrees of freedom to fit!

    """

    if len(x) == 0 and not intercept: raise Exception("No degrees of freedom to fit!")
    if len(x) == 0 and intercept:
        ypred = N.array([N.mean(y), ] * len(y))
        return [], N.mean(y), ypred, rsquared(y, ypred)

    if intercept:
        slopes, slope_errors, interc, interc_error, results = linear_regression(y, N.atleast_2d(x).T, intercept=True)
    else:
        slopes, slope_errors, _, _, results = linear_regression(y, N.atleast_2d(x).T, intercept=False)

    if intercept:
        return slopes[0], interc, results.fittedvalues, results.rsquared
    else:
        return slopes[0], results.fittedvalues, results.rsquared


# This parses linear_regression output and returns the bias seperately, as is often desired
# Adds a column of ones to get the intercept. Otherwise, you can just call linear_regression
# for an assumed zero intercept.
# Input data must be SAMPLES x FEATURES
def linear_regression(target, data, dropnan=False, intercept=True, test_target=None, test_data=None):
    """ A more robust, reliable linear gression than other methods tested.

    Args:
        target     : 1-D array of dependent variables to regress
        data       : SAMPLES x FEATURES array of independent data. MUST be 2D or ambiguity exists between 1 feat[N] or N x feat[1]
        dropnan    : if True, will drop data that contains NaN's before regressing. Otherwise ignores NaN's and explodes if they're present.
        intercept  : Whether to add a column of 1's to the input X data to permit a scalar intercept term
        test_target: Target data for testing the model trained on target/data
        test_data  : independent data for the testing statistics
    Returns:
        slopes       : The slope coefficient for each feature
        slope_errors : The uncertainty in each slope coefficient
        intercept    : The intercept term (if requested, otherwise None)
        intercept_err: The error in the intercept (if requested, otherwise None)
        results      : A complex object with virtually any statistic regarding a linear regression you could want (training error)
        pred_target  : Predicted target using the test data
        results_test : (optional) Results object for testing data, if provided

    Plug in a known answer and retrieve
    >>> X1=N.array((0,1,2,3,4,5,6,7,8,9))
    >>> X2=N.array((1,2,1,2,1,2,1,2,1,2))
    >>> X =N.array((X1,X2)).T
    >>> Y =10 * X1 - 10 * X2 + 5
    >>> slopes, slope_errors, interc, interc_error, results = linear_regression(Y, X, intercept = True)
    >>> slopes
    array([ 10., -10.])
    >>> interc
    4.9999999999999...

    >>> Y=(8,8,8,7,7,7,6,6)
    >>> X=N.array(((1,2,3,4,5,6,7,8),(1,1,2,2,3,3,4,4),(5,6,5,6,5,6,5,1))).T
    >>> X.shape
    (8, 3)
    >>> X
    array([[1, 1, 5],
           [2, 1, 6],
           [3, 2, 5],
           [4, 2, 6],
           [5, 3, 5],
           [6, 3, 6],
           [7, 4, 5],
           [8, 4, 1]])
    >>> slopes, slope_errors, interc, interc_error, results = linear_regression(Y, X, intercept = False)
    >>> slopes
    array([-0.49887133,  1.63047404,  1.03386005])
    >>> slope_errors
    array([ 1.33937579,  2.6235828 ,  0.23783457])
    >>> interc is None
    True
    >>> interc_error is None
    True
    >>> results.rsquared
    0.95645043471574587

    >>> slopes, slope_errors, interc, interc_error, results = linear_regression(Y, X, intercept = True)
    >>> slopes
    array([-0.24761905, -0.14761905,  0.00952381])
    >>> slope_errors
    array([ 0.25709876,  0.52499865,  0.09988656])
    >>> round(interc, 15)
    8.56190476190476...
    >>> round(interc_error, 15)
    0.74329962401830...
    >>> round(results.rsquared, 15)
    0.89255189255189...

    Mismatching data/target lengths
    >>> Y=(1,2,3)
    >>> X  = N.array( ((1,2,3,4),)).T
    >>> Xg = N.array( ((1,2,3  ),)).T
    >>> stuff = linear_regression(Y, X, intercept = False)
    Traceback (most recent call last):
    Exception: data (numsamp x numfeat) must match target (numsamp): 4 vs 3

    >>> stuff = linear_regression(Y, Xg, intercept = False, test_data = X, test_target = Y)
    Traceback (most recent call last):
    Exception: testdata (numsamp x numfeat) must match testtarget (numsamp): 4 vs 3

    Single feature case (8 samples x 1 feature)
    >>> Y=(8,8,8,7,7,7,6,6)
    >>> X=N.array( ((5,6,5,6,5,6,5,1),) ).T
    >>> slopes, slope_errors, _, _, results = linear_regression(Y, X, intercept = False)
    >>> slopes
    array([ 1.35406699])
    >>> slope_errors
    array([ 0.13784555])
    >>> round(results.rsquared, 15)
    0.93236242563941...

    Rsquared should be better with an intercept than without
    >>> slopes, slope_errors, interc, interc_error, results = linear_regression(Y, X, intercept = True)
    >>> slopes
    array([ 0.27152318])
    >>> slope_errors
    array([ 0.17538211])
    >>> round(interc, 15)
    5.80132450331126...
    >>> round(interc_error, 15)
    0.89642393238665...
    >>> round(results.rsquared, 15)
    0.28544744438784...

    BAD Single feature case, tried to pass single vector data, illegal
    >>> Y=(8,8,8,7,7,7,6,6)
    >>> X=(5,6,5,6,5,6,5,1)
    >>> slopes, slope_errors, _, _, results = linear_regression(Y, X, intercept = False)
    Traceback (most recent call last):
    Exception: Malformed training data, must be numsamples x numfeatures. Instead got: 8

    Zero feature case
    >>> Y=(8,8,8,7,7,7,6,6)
    >>> X=N.array( ((),) )
    >>> slopes, slope_errors, _, _, results = linear_regression(Y, X, intercept = False)
    >>> slopes
    array([], dtype=float64)
    >>> slope_errors
    array([], dtype=float64)
    >>> results.rsquared
    nan

    Zero feature case with intercept works!
    >>> slopes, slope_errors, interc, interc_error, results = linear_regression(Y, X, intercept = True)
    >>> slopes
    array([], dtype=float64)
    >>> slope_errors
    array([], dtype=float64)
    >>> round(interc, 14)
    7.125
    >>> round(interc_error, 14)
    0.2950484221760...
    >>> N.abs(round(results.rsquared, 14))
    0.0

    Verify the testing capability by feeding in training data and comparing (one dim input)
    >>> Y=(8,8,8,7,7,7,6,6)
    >>> X=N.array(((5,6,5,6,5,6,5,1),)).T
    >>> slopes, slope_errors, _, _, results = linear_regression(Y, X, intercept = False)
    >>> round(results.rsquared, 15)
    0.93236242563941...
    >>> slopes, slope_errors, _, _, results, Y_pred, results_pred = linear_regression(Y, X, intercept = False, test_target = Y, test_data = X)
    >>> round(results     .rsquared, 15)
    0.93236242563941...
    >>> round(results_pred.rsquared, 15)
    0.93236242563941...

    Verify the testing capability by feeding in training data and comparing (two dim input)
    >>> Y=(8,8,8,7,7,7,6,6)
    >>> X=N.array(((5,6,5,6,5,6,5,1),(1,2,3,4,3,2,1,0))).T
    >>> slopes, slope_errors, _, _, results = linear_regression(Y, X, intercept = False)
    >>> round(results.rsquared, 15)
    0.93399321683993...
    >>> slopes, slope_errors, _, _, results, Y_pred, results_pred = linear_regression(Y, X, intercept = False, test_target = Y, test_data = X)
    >>> round(results     .rsquared, 15)
    0.93399321683993...
    >>> round(results_pred.rsquared, 15)
    0.93399321683993...

    Verify the testing capability by feeding in easy pattern
    >>> x1 = N.array((1,2,3,4,5,6,7,8))
    >>> x2 = N.array((2,1,2,1,2,1,2,3))
    >>> X  = N.vstack((x1 ,x2 )).T
    >>> Y  = 3*x1  - 2*x2  + 5
    >>> xt1= N.array((8,7,6,5,4,3,2,1))
    >>> xt2= N.array((1,2,3,1,2,3,1,2))
    >>> Xt = N.vstack((xt1,xt2)).T
    >>> Yt = 3*xt1 - 2*xt2 + 5

    Neglect intercept at first
    >>> slopes, slope_errors, _, _, results, Y_pred, results_pred = linear_regression(Y, X, intercept = False, test_target = Yt, test_data = Xt)
    >>> Yt
    array([27, 22, 17, 18, 13,  8,  9,  4])
    >>> [round(x,4) for x in Y_pred]
    [25.933..., 22.551..., 19.169..., 16.161..., 12.779..., 9.397..., 6.389..., 3.007...]
    >>> results.rsquared
    0.98948101754773199

    Include intercept
    >>> slopes, slope_errors, _, _, results, Y_pred, results_pred = linear_regression(Y, X, intercept = True , test_target = Yt, test_data = Xt)
    >>> Yt
    array([27, 22, 17, 18, 13,  8,  9,  4])
    >>> [round(x,4) for x in Y_pred]
    [27.0, 22.0, 17.0, 18.0, 13.0, 8.0, 9.0, 4.0]
    >>> results.rsquared
    1.0

    Test case from SVEGO that was exploding for some reason
    >>> targ_train = N.array([1, 2, 5, 6, 7])
    >>> data_train = N.array([[0, 0],[1, 1],[1, 0],[2, 1],[1, 3]])
    >>> targ_test  = N.array([3, 4, 7, 7, 7])
    >>> data_test  = N.array([[2, 2],[0, 3],[0, 2],[2, 0],[0, 1]])
    >>> slopes, slope_errors, interc, interc_error, results, Y_pred, results_pred = linear_regression(targ_train, data_train, intercept = True, test_target = targ_test, test_data = data_test)
    >>> slopes
    array([ 2.,  1.])
    >>> slope_errors
    array([ 1.54919334,  0.89442719])
    >>> interc
    1.200000000000001...
    >>> interc_error
    1.81107702762748...
    >>> results.rsquared
    0.671641791044776...
    >>> results.rsquared_adj
    0.343283582089552...
    >>> Y_pred
    array([ 7.2,  4.2,  3.2,  5.2,  2.2])
    >>> results_pred.rsquared
    0.66051721263649243
    >>> results_pred.rsquared_adj
    0.57564651579561554

    """

    data = N.array(data)
    target = N.array(target)

    # Validate input data dimensions
    if len(data.shape) != 2:
        raise Exception('Malformed training data, must be numsamples x numfeatures. Instead got: ' + ' '.join(
            ["%d" % x for x in data.shape]))

    NODATA = data.shape[0] * data.shape[1] == 0

    if not NODATA and data.shape[0] != len(target):
        raise Exception('data (numsamp x numfeat) must match target (numsamp): %d vs %d' % (data.shape[0], len(target)))

    PREDICTS = test_target is not None

    if PREDICTS:
        test_data = N.array(test_data)
        NOTESTDATA = test_data.shape[0] * test_data.shape[1] == 0
        if len(test_data.shape) != 2:
            raise Exception('Malformed testing  data, must be numsamples x numfeatures. Instead got: ' + ' '.join(
                ["%d" % x for x in test_data.shape]))

        if not NOTESTDATA and test_data.shape[0] != len(test_target):
            raise Exception('testdata (numsamp x numfeat) must match testtarget (numsamp): %d vs %d' % (
                test_data.shape[0], len(test_target)))

    numsamp, numfeat = data.shape

    # Handle other invalid input cases

    BLANKDICT = dict_to_object({'rsquared_adj': N.nan, 'rsquared': N.nan, 'pvalue': N.nan})

    # If there's no target data, can't do anything
    if len(target) == 0:
        if not PREDICTS:
            return N.array([]), N.array([]), None, None, BLANKDICT
        else:
            return N.array([]), N.array([]), BLANKDICT, N.array([]), BLANKDICT

    # If there's no X data and not permitted an intercept, can't do anything
    if NODATA and not intercept:
        if not PREDICTS:
            return N.array([]), N.array([]), None, None, BLANKDICT
        else:
            return N.array([]), N.array([]), BLANKDICT, N.array([]), BLANKDICT

    if intercept:
        if NODATA:
            # Nothing but the column of 1's
            numsamp = len(target)
            newdata = N.ones((numsamp, 1), dtype=N.float64)
        # 2D Add column of 1's to handle intercept
        else:
            newdata = N.hstack((data, N.ones((numsamp, 1))))
    else:
        newdata = data

    # If the user only requested training fits
    if not PREDICTS:

        # perform actual calculation
        slopes, slope_errors, results = linear_regression_no_intercept(target, newdata, dropnan=dropnan)

        if intercept:
            retslope = slopes[:-1]
            retslope_errors = slope_errors[:-1]
            retinterc = slopes[-1]
            retinterc_error = slope_errors[-1]
        else:
            retslope = slopes
            retslope_errors = slope_errors
            retinterc = None
            retinterc_error = None

        # Returns m, m_error, b, b_error
        return retslope, retslope_errors, retinterc, retinterc_error, results

    # PREDICT is true: User requested testing/prediction statistics

    if intercept:
        numsamp, numfeat = test_data.shape
        if numfeat == 0:
            # Nothing but the column of 1's
            numsamp = len(test_target)
            newtestdata = N.ones((numsamp, 1), dtype=N.float64)
        # 2D Add column of 1's to handle intercept
        else:
            newtestdata = N.hstack((test_data, N.ones((numsamp, 1))))
    else:
        newtestdata = test_data

    # perform actual calculation
    slopes, slope_errors, trainresults, predtarget, predresults = linear_regression_no_intercept(target,
                                                                                                 newdata,
                                                                                                 dropnan=dropnan,
                                                                                                 test_target=test_target,
                                                                                                 test_data=newtestdata)
    if intercept:
        retslope = slopes[:-1]
        retslope_errors = slope_errors[:-1]
        retinterc = slopes[-1]
        retinterc_error = slope_errors[-1]
    else:
        retslope = slopes
        retslope_errors = slope_errors
        retinterc = None
        retinterc_error = None

    # Returns m, m_error, b, b_error, predict_target, predict_results
    return retslope, retslope_errors, retinterc, retinterc_error, trainresults, predtarget, predresults


# ------------------------
def linear_regression_rfe(target, data, dropnan=False, intercept=True, feature_names=None, progressbar=False):
    """ Performs linear regressions wrapped within reverse feature elimination to preserve pairwise relationships.
    Brute force but insightful way to perform feature selection.

    Args:
        target   : 1-D array of dependent variables to regress
        data     : SAMPLES x FEATURES array of independent data
        dropnan  : if True, will drop data that contains NaN's before regressing. Otherwise ignores NaN's and explodes if they're present.
        intercept: Whether to add a column of 1's to the input X data to permit a scalar intercept term
        feature_names: Optional. If provided, will return the names of features as they are dropped. Otherwise only indices into X.
        progressbar: Display progress bar as working
    Returns:
        gen_slopes       : A list of fit slopes for each feature per generation
        gen_intercept    : A list of the fit intercept per generation
        gen_rmse         : A list of the RMSE per generation
        gen_pve          : A list of the Percent Variance Explained per generation
        gen_feat_dropped : A list of the feature dropped to produce this generation

    >>> feat1 = [1,2,3,4,5,6,7,8]
    >>> feat2 = [1,1,2,2,3,3,4,4]
    >>> feat3 = [5,6,5,6,5,6,5,1]

    >>> Y = 0.5 * N.array(feat1) - 0.25 * N.array(feat3) + 4

    >>> X=N.array((feat1, feat2, feat3)).T
    >>> X
    array([[1, 1, 5],
           [2, 1, 6],
           [3, 2, 5],
           [4, 2, 6],
           [5, 3, 5],
           [6, 3, 6],
           [7, 4, 5],
           [8, 4, 1]])
    >>> features = ['more_important','not_important','less_important']
    >>> gen_slopes, gen_intercept, gen_rmse, gen_pve, gen_feat_dropped = linear_regression_rfe(Y, X, feature_names = features)

    >>> PP([x.round(14) for x in gen_slopes])
    [array([ 0.5 ,  0.  , -0.25]),
     array([ 0.5 , -0.25]),
     array([ 0.5922619]),
     array([], dtype=float64)]

    >>> N.array(gen_intercept).round(14)
    array([ 4.        ,  4.        ,  2.36607143,  5.03125   ])

    >>> N.array(gen_rmse).round(13)
    array([ 0.        ,  0.        ,  0.37017397,  1.49067039])

    >>> N.array(gen_pve).round(14)
    array([ 100.        ,  100.        ,   94.71430963,    0.        ])

    >>> gen_feat_dropped
    [None, 'not_important', 'less_important', 'more_important']

    """

    Y = target
    X = data

    generation_slopes = []
    generation_intercept = []
    generation_rmse = []
    generation_pve = []
    generation_feature_dropped = []

    numfeats = data.shape[1]

    feature_mask = N.ones(numfeats, dtype=bool)

    if progressbar:
        bar = mlib.progressbar.ProgressBar(numfeats * numfeats / 2)
        bar.start()

    # Main loop to reduce features
    c = 0
    for i_reduce in range(numfeats):

        # Score all features together if first time
        if i_reduce == 0:
            slopes, slope_errors, intercept, intercept_error, results = linear_regression(Y, X)

            generation_slopes.append(slopes)
            generation_intercept.append(intercept)
            generation_rmse.append(N.sqrt(results.mse_resid))
            generation_pve.append(results.rsquared * 100)
            generation_feature_dropped.append("" if feature_names is None else None)

        # Perform experiments to see which feature should be dropped
        exp_slopes = []
        exp_intercept = []
        exp_rmse = []
        exp_pve = []
        exp_feature_dropped = []
        exp_i_drop = []

        for i_drop in N.where(feature_mask)[0]:

            if progressbar: bar.update(c)
            c += 1

            exp_mask = N.array(feature_mask)
            exp_mask[i_drop] = False

            slopes, slope_errors, intercept, intercept_error, results = linear_regression(Y, X[:, exp_mask])

            exp_slopes.append(slopes)
            exp_intercept.append(intercept)
            exp_rmse.append(N.sqrt(results.mse_resid))
            exp_pve.append(results.rsquared * 100)
            exp_feature_dropped.append(i_drop if feature_names is None else feature_names[i_drop])
            exp_i_drop.append(i_drop)

        # Judge experiments and choose feature to remove based on rsquared minimization
        i_min = N.argmax(exp_pve)
        i_drop = exp_i_drop[i_min]
        feature_mask[i_drop] = False

        generation_slopes.append(exp_slopes[i_min])
        generation_intercept.append(exp_intercept[i_min])
        generation_rmse.append(exp_rmse[i_min])
        generation_pve.append(exp_pve[i_min])
        generation_feature_dropped.append(exp_feature_dropped[i_min])

    if progressbar: bar.finish()

    return generation_slopes, generation_intercept, generation_rmse, generation_pve, generation_feature_dropped


# ------------------------
def apply_func_to_elements(array, func):
    """ Apply a function to every element of a Numpy array of any shape or size.

    >>> apply_func_to_elements ( [1, 2, 3, 4, 5], N.sqrt )
    array([ 1.        ,  1.41421356,  1.73205081,  2.        ,  2.23606798])

    >>> apply_func_to_elements ( [ [1,2], [3,4] ], N.sqrt )
    array([[ 1.        ,  1.41421356],
           [ 1.73205081,  2.        ]])

    >>> apply_func_to_elements ( [], N.sqrt )
    array([], dtype=float64)

    >>> apply_func_to_elements ( [ [], [] ], N.sqrt )
    array([], shape=(2, 0), dtype=float64)

    """

    if N.size(array) == 0:
        return N.array(array)
    vecfunc = N.vectorize(func)
    return vecfunc(array)


# ------------------------
def wrap_val_to_range(vals, low, high_wrap):
    """ Ensures a value is within a given periodic range by subtracting or adding spans until it is.
        Useful for wrapping angles, for instance.

    Args:
        vals     : A singleton or iterable of values to wrap
        low      : The lowest permitted value
        high_wrap: The first non-permitted high value that is equivalent to low
    Returns:
        A singleton or list of wrapped values.

    >>> wrap_val_to_range ( 360   , 0, 360 )
    0

    >>> wrap_val_to_range ( [0, 90, 180, 270, 360], -180, 180 )
    [0, 90, -180, -90, 0]

    >>> wrap_val_to_range ( [1, N.nan], 0, 9  )
    [1, nan]

    >>> wrap_val_to_range ( [1, 2, 3, 4, 5], 0, 3)
    [1, 2, 0, 1, 2]

    >>> wrap_val_to_range ( [1.1, 1.2, 1.3, 1.4, 1.5], 1.0, 1.3)
    [1.1, 1.2, 1.0, 1.0999999999999999, 1.2]

    >>> wrap_val_to_range ( [], 0, 3)
    []

    """

    singleton = is_not_iterable(vals)
    if singleton: vals = [vals, ]

    span = high_wrap - low

    answer = []
    for val in vals:
        while val < low: val += span
        while val >= high_wrap: val -= span
        answer.append(val)

    return answer[0] if singleton else answer


# ------------------------
def median_element(vals):
    """This median is guarenteed to be a member of the input set.
    When there are even numbers of inputs, it does NOT take the average of the central two as Numpy does.
    Instead it returns the first of the pair.
    Ignores Nan's, as they have undefined behavior in sorting.

    Args:
        vals       : any iterable, sortable input
    Returns:
        element: the median element value itself

    Unambiguous case
    >>> median_element([ 1,1,1,2,3,3,3])
    2

    Ambiguous case
    >>> median_element([ 1,1,1,2,3,4,4,4])
    2

    >>> median_element([ N.nan, 1,2,3] )
    2

    >>> median_element([])
    nan

    """

    if len(vals) == 0: return N.nan

    nans = N.isnan(vals)
    if N.any(nans): vals = [x for x, nflag in zip(vals, nans) if not nflag]
    s = sorted(vals)
    return s[(len(vals) - 1) // 2]


# these are "safe" numeric functions that return 0 as an error if something goes wrong
# Cannot be used in all circumstances but nicely handle empty set issues
def safemean(vals):
    if len(vals) > 0: return N.mean(vals)
    return 0.0


def safemedian(vals):
    if len(vals) > 0: return median_element(vals)
    return 0.0


def safemax(vals):
    if len(vals) > 0: return N.max(vals)
    return 0.0


def safemin(vals):
    if len(vals) > 0: return N.min(vals)
    return 0.0


def safestd(vals):
    if len(vals) > 0: return N.std(N.float64(vals), ddof=1)
    return 0.0


# ------------------------
def mask_out_duplicates(vals, keep_first=True):
    """ Return a boolean mask that removes any duplicates in a list.
    If keep_first is set to True, will keep first example of a duplicate element (normal behavior). Otherwise won't list them at all.

    >>> mask_out_duplicates( [1,2,3,4,5] )
    array([ True,  True,  True,  True,  True], dtype=bool)

    >>> mask_out_duplicates( [1,2,3,4,5], keep_first = False )
    array([ True,  True,  True,  True,  True], dtype=bool)

    >>> mask_out_duplicates( [1,2,3,3,3] )
    array([ True,  True,  True, False, False], dtype=bool)

    >>> mask_out_duplicates( [1,2,3,3,3], keep_first = False )
    array([ True,  True, False, False, False], dtype=bool)

    >>> mask_out_duplicates( [1,1,1] )
    array([ True, False, False], dtype=bool)

    >>> mask_out_duplicates( [1,1,1], keep_first = False )
    array([False, False, False], dtype=bool)

    >>> mask_out_duplicates( [1,N.nan,1] )
    array([ True,  True, False], dtype=bool)

    >>> mask_out_duplicates( [1,N.nan,1], keep_first = False )
    array([False,  True, False], dtype=bool)

    >>> mask_out_duplicates( [1,] )
    array([ True], dtype=bool)

    >>> mask_out_duplicates( [1,], keep_first = False )
    array([ True], dtype=bool)

    >>> mask_out_duplicates( [] )
    array([], dtype=bool)

    >>> mask_out_duplicates( [], keep_first = False )
    array([], dtype=bool)

    """

    if len(vals) == 0:
        return N.array([], dtype=bool)

    if keep_first:
        seen = {}
        for i, val in enumerate(vals):
            if not val in seen:
                seen[val] = i
        # Process into a mask
        answer = N.zeros(len(vals), dtype=bool)
        for i in seen.values():
            answer[i] = True
        return answer

    else:
        count = C.Counter(vals)
        return N.array([count[x] == 1 for x in vals])


# ------------------------
def unzip(array):
    """ The opposite of zip... takes a list of n-pairs and makes n lists

    >>> unzip([(1,2),(3,4),(5,6)])
    [[1, 3, 5], [2, 4, 6]]

    >>> unzip([(1,2,3),(4,5,6),(7,8,9)])
    [[1, 4, 7], [2, 5, 8], [3, 6, 9]]

    >>> unzip([(1,),(2,),(3,)])
    [[1, 2, 3]]

    >>> unzip ([])
    []

    """

    if len(array) == 0: return []

    return [[x[t] for x in array] for t in range(len(array[0]))]


# ------------------------
def find_nearest_element(array, value):
    """Look for nearest match in array to specified value and return that nearest element.
    Will ignore any nans present in array.

    >>> find_nearest_element( [1, 2, 3, 4, 5], 2.1 )
    2

    >>> find_nearest_element( [1, 2, 3, 4, 5], 99 )
    5

    >>> find_nearest_element( [1, 2, 3, 4, 5], N.nan )
    nan

    >>> find_nearest_element( [1, 2, N.nan, 4, 5], 1 )
    1

    >>> find_nearest_element( [1,], -9 )
    1

    >>> find_nearest_element( [], -9 )
    nan

    """

    # sanitize input
    if len(array) == 0: return N.nan
    if N.isnan(value): return N.nan
    if N.any(N.isnan(array)): array = N.array([x for x in array if not N.isnan(x)])
    if not mlib.mtypes.isnarray(array): array = N.array(array)

    return array.flat[N.abs(array - value).argmin()]


# ------------------------
def nearest_matches(destination_array, source_array):
    """ Look for nearest match in destination for each element of source. Useful to re-align a grid or limit sig figs.

    Standard case
    >>> nearest_matches( [ 1, 2, 3], [1.1, 1.9, 3.5] )
    array([1, 2, 3])

    Handles redundant inputs fine
    >>> nearest_matches( [ 1, 1, 2], [1.1, 1.1, 60] )
    array([1, 1, 2])

    Ignores nans
    >>> nearest_matches( [ 1, N.nan, 3], [1.1, N.nan, 2.6] )
    array([  1.,  nan,   3.])

    Undefined output if no elements to select
    >>> nearest_matches( [], [1,2] )
    array([ nan,  nan])

    >>> nearest_matches( [1,2,3], [] )
    array([], dtype=float64)

    """

    if len(source_array) == 0: return N.array([])

    return N.array([find_nearest_element(destination_array, x) for x in source_array])


# ------------------------
def linear_interpolation_weights(elements, element):
    """Calculates interpolation indices and weights for linear case of a new element into a sorted list of elements.
    Refuses to match to outliers beyond the list (will not extrapolate)

    Args:
        elements : sorted list of valid elements (consecutive, linear, monotonicly growing values)
        element  : new item to properly locate in elements

    Returns:
        left_element :  left neighbor of element
       right_element : right neighbor of element
        left_index   :  left neighbor index
       right_index   : right neighbor index
        left_weight  :  left linear weight to apply to  left neighbor when interpolating
       right_weight  : right linear weight to apply to right neighbor when interpolating

    >>> linear_interpolation_weights( range(5), 2 )
    (1, 2, 1, 2, 0.0, 1.0)

    >>> linear_interpolation_weights( range(5), 2.25 )
    (2, 3, 2, 3, 0.75, 0.25)

    >>> linear_interpolation_weights( range(5), 2.5 )
    (2, 3, 2, 3, 0.5, 0.5)

    >>> linear_interpolation_weights( range(5), 2.75 )
    (2, 3, 2, 3, 0.25, 0.75)

    >>> linear_interpolation_weights( [], 5 )
    nan

    """

    if len(elements) == 0: return N.nan

    # find the spacing of elements
    spacing = elements[2] - elements[1]

    # find where to insert this element
    right = N.searchsorted(elements, element)
    # check for left-most case
    if right == 0:
        # check for element not in the list at all
        if elements[0] - element > 2.0 * spacing:
            return N.nan, N.nan, N.nan, N.nan
        left = 0
        rw = 1
        lw = 0
        return elements[left], elements[right], lw, rw

    # check for right-most case
    if right == len(elements):
        # check for element not in the list at all
        if element - elements[-1] > 2.0 * spacing:
            return N.nan, N.nan, N.nan, N.nan
        right -= 1
        left = right
        lw = 0
        rw = 1
        return elements[left], elements[right], lw, rw

    # handle bracketted case
    left = right - 1
    rw = (element - elements[left]) / (elements[right] - elements[left])
    lw = 1.0 - rw
    return elements[left], elements[right], left, right, lw, rw


# ------------------------
def consecutive_boolean_region_ranges(array, minsize=1):
    """ Returns an array of (start,end) ranges where an array is True, ignoring False regions
    Args:
        array  : boolean array to process
        minsize: filter out any ranges that have less than minsize elements within
    Returns:
        ranges : INCLUSIVE ranges (start, end), thus must often use start:end+1 to access array contants

    >>> consecutive_boolean_region_ranges( [] )
    []

    >>> consecutive_boolean_region_ranges( [True, ]*10 )
    [(0, 9)]

    >>> consecutive_boolean_region_ranges( [False,]*10 )
    []

    >>> consecutive_boolean_region_ranges( [True, ]*3 + [False,]*2 + [True,]*5 )
    [(0, 2), (5, 9)]

    >>> consecutive_boolean_region_ranges( [True, ]*1 + [False,]*3 + [True,]*5 + [False,]*10 + [True,]*1 )
    [(0, 0), (4, 8), (19, 19)]

    >>> consecutive_boolean_region_ranges( [True, ]*1 + [False,]*3 + [True,]*5 + [False,]*10 + [True,]*1, minsize = 2 )
    [(4, 8)]

    """

    # Handle null case
    if len(array) == 0: return []

    # Handle all True case
    if N.sum(array) == len(array): return [(0, len(array) - 1), ]

    import scipy.ndimage.measurements as SNDIM
    # Label the consecutive regions with an integer
    area_labels, maxlabel = SNDIM.label(array)
    valid_labels = list(set(area_labels))
    # form the ranges for return by simple masking
    # These ranges are INCLUSIVE
    ranges = []
    # Ignore the leading 0 of unlabeled space
    for label in sorted(valid_labels)[1:]:
        indices = N.where(area_labels == label)[0]
        left = N.min(indices)
        right = N.max(indices)
        if (right - left + 1) < minsize: continue
        ranges.append((left, right))
    return ranges


##Helper function for piecewise_linear_fit
##Returns a function that can be optimized to find segments
# ------------------------
global Y_PIECEWISE_GLOBAL_HACK


def make_piecewise_linear_function(segments):
    # We must add a bunch of nastiness to this routine to prevent degenerate solutions
    # For instance, we must disallow very small segments of < 0.5% data span
    MIN_SEGMENT_PERCENT_RANGE = 0.05

    # We must construct a worker function with sufficient segments and parameters matching
    funcdef = "def piecewise_linear_func(x"
    # add inflection point x locations to optimize
    for i in range(segments - 1): funcdef += ", x%04d" % (i + 1)
    funcdef += "):\n"

    #    funcdef+=" if "
    #    for i in range(segments-2): funcdef += "(x%04d > x%04d) or "%(i+1,i+2)
    #    funcdef = funcdef[:-4]
    #    funcdef+=": return N.random.random(x.shape)\n"
    funcdef += " global Y_PIECEWISE_GLOBAL_HACK\n"
    funcdef += " yp = Y_PIECEWISE_GLOBAL_HACK.copy()\n"
    funcdef += " x0000 = x[ 0]\n"
    funcdef += " x%04d = x[-1]\n" % (segments)
    for i in range(segments):
        funcdef += " mask = (x%04d<=x) & (x<=x%04d)\n" % (i, i + 1)
        funcdef += " ypred, coefs, error = fitline(x[mask],Y_PIECEWISE_GLOBAL_HACK[mask])\n"
        funcdef += " yp[mask] = ypred\n"
    funcdef += " return yp"

    exec(funcdef)
    return piecewise_linear_func


# ------------------------
def piecewise_linear_fit(x, y, x_break_points, fit_type='raw', bins=4):
    """Fits a specified number of linear segments to the data y(x).

    Args:
        x: independent data
        y: dependent   data
        x_break_points: The x-locations where two line segments must share a value
        fit_type      : 'raw': Use the raw data in the line fits
                        'binned median': Use the binned median values of y in the fits (reduces outlier effects strongly)
                        'binned mean'  : Use the binned mean   values of y in the fits (reduces outlier effects somewhat)
        bins      : how many bins to use to fit each line segment. Default 4. Must be < number of samples per linear segment region.
    Returns:
        xp: Predicted x values for line fits
        yp: Predicted y values for line fits
        coefficients: The defining line segment coefficients

    Three segment case
    >>> X = range(10)
    >>> Y = [1,1,1,2,2,2,3,4,5,6]

    Fit with a single line
    >>> Xp, Yp, coefs = piecewise_linear_fit(X, Y, [])
    >>> N.all(Xp == X)
    True
    >>> print N.array_str(Yp, precision = 3)
    [ 0.218  0.77   1.321  1.873  2.424  2.976  3.527  4.079  4.63   5.182]

    How did we do fitting?
    >>> round ( rsquared(Y, Yp) , 14)
    0.89302275423272

    Fit with two lines meeting in the middle
    >>> Xp, Yp, coefs = piecewise_linear_fit(X, Y, [5,])
    >>> print N.array_str(Yp, precision = 3)
    [ 0.857  1.114  1.371  1.629  1.886  2.     3.     4.     5.     6.   ]

    >>> round ( rsquared(Y, Yp), 14)
    0.98852494734549

    Fit with three lines meeting in the optimal locations
    >>> Xp, Yp, coefs = piecewise_linear_fit(X, Y, [2.5, 5.5])
    >>> print N.array_str(Yp, precision = 3)
    [ 1.  1.  1.  2.  2.  2.  3.  4.  5.  6.]

    >>> round ( rsquared(Y, Yp), 14)
    1.0

    >>> Xp, Yp, coefs = piecewise_linear_fit(X, Y, [2.5, 5.5], fit_type = 'binned median', bins = 2)
    >>> print N.array_str(Yp, precision = 3)
    [ 1.   1.   2.   2.   3.5  5.5]

    >>> Xp, Yp, coefs = piecewise_linear_fit(X, Y, [2.5, 5.5], fit_type = 'binned mean'  , bins = 2)
    >>> print N.array_str(Yp, precision = 3)
    [ 1.   1.   2.   2.   3.5  5.5]

    """

    x = N.array(x)
    y = N.array(y)

    # Add artificial breakpoint at end of data record
    x_break_points = list(x_break_points) + [N.max(x) + 1.0, ]

    # Currently, we just use x_break_points to control this function
    x_last = N.min(x)
    yp = []
    xp = []
    coef_arr = []
    for breakpoint in x_break_points:
        mask = (x_last <= x) & (x <= breakpoint)

        # Raw mode do nothing
        if "raw":
            xt, yt = x[mask], y[mask]
        if "binned median" == fit_type.lower():
            xt, yt = binned_stat(x[mask], bins=bins, limits=[x_last, breakpoint], y=y[mask], func='median')
        if "binned mean" == fit_type.lower():
            xt, yt = binned_stat(x[mask], bins=bins, limits=[x_last, breakpoint], y=y[mask], func='mean')

        ypred, coefs, error = fitline(xt, yt)
        x_last = breakpoint

        # We only add all the line segment points the first time
        # Sequential line segments have a redundant starting point that is not needed
        yp.extend(ypred)
        xp.extend(xt)
        coef_arr.append(coefs)

    # Handle overlaps at joins between lines by removing redundancies in predicted X-values
    dicter = dict(zip(xp, yp))
    xp, yp = sort_arrays_by_first(dicter.keys(), dicter.values())

    return xp, yp, N.array(coef_arr)


# def piecewise_linear_fit_autonumber(x, y, max_breaks = 4, fit_type = 'raw', bins = 4, break_bins = 100):
#     """Fits a specified number of linear segments to the data y(x).

# Args: x: independent data y: dependent   data x_break_points: The x-locations where two line segments must share a
# value fit_type      : 'raw': Use the raw data in the line fits 'binned median': Use the binned median values of y
# in the fits (reduces outlier effects strongly) 'binned mean'  : Use the binned mean   values of y in the fits (
# reduces outlier effects somewhat) bins      : how many bins to use to fit each line segment. Default 4. Must be <
# number of samples per linear segment region. break_bins: How far to sub-divide the X-range of the data while
# looking for optimal breakpoints Returns: xp: Predicted x values for line fits yp: Predicted y values for line fits
# coefficients: The defining line segment coefficients

#     Three segment case
#     >>> X = range(10)
#     >>> Y = [1,1,1,2,2,2,3,4,5,6]

#     Fit with a single line
#     >>> Xp, Yp, coefs = piecewise_linear_fit_autonumber(X, Y, max_breaks = 0)
#     >>> N.all(Xp == X)
#     True
#     >>> print N.array_str(Yp, precision = 3)
#     [ 0.218  0.77   1.321  1.873  2.424  2.976  3.527  4.079  4.63   5.182]

#     How did we do fitting?
#     >>> rsquared(Y, Yp)
#     0.89302275423271882


#     """

#     best_Xp = N.nan
#     best_Yp = N.nan
#     best_R2 = 0.0
#     best_breaks = N.nan

#     xmin = N.min(x)
#     xmax = N.max(y)
#     break_bins = N.linspace(xmin, xmax, break_bins)

#     for n_breaks in range(max_breaks):


#         for ibreak in range(n_breaks):
#             breaks.append(

#         breaks = [0,]*n_breaks
#         for break

# evaluate a polynomial with known coefficients
# ------------------------
def polyeval(x, coefs):
    x = N.array(x)
    c = reverse(coefs)
    return sum([pow(x, order) * c[order] for order in range(0, len(c))])


# reverse a list
# ------------------------
def reverse(lister):
    a = list(lister)
    a.reverse()
    return a


# return best fit line in 1D (only one independent variable) and associated stats
# coefs are slope, bias
# ------------------------
def fitline(x, y, order=1):
    if len(x) == 0:
        return ((), (0, 0), 0)
    coefs = N.polyfit(x, y, order).tolist()
    ypredict = polyeval(x, coefs)
    error = N.sqrt(N.mean((N.array(y) - N.array(ypredict)) ** 2))
    return (ypredict, coefs, error)


# ------------------------
def mode_with_count(list):
    """ Mode function, single most frequent element in a list and its count.

    >>> mode_with_count(range(10) + range(15,25) + [16,16])
    (16, 3)

    >>> mode_with_count([])
    (nan, 0)

    >>> mode_with_count([1,2,2,2,N.nan])
    (2, 3)

    >>> mode_with_count([1,2,N.nan,N.nan])
    (nan, 2)

    """

    if len(list) == 0: return (N.nan, 0)

    # The C.Counter object goes excessively slow if any NaN's are present, so patch it
    numnans = N.sum(N.isnan(list))

    if numnans > 0:
        counter = C.Counter([x for x in list if not N.isnan(x)])
    else:
        counter = C.Counter(list)

    (most_frequent_element, times_seen) = counter.most_common()[0]

    if numnans > times_seen:
        most_frequent_element = N.nan
        times_seen = numnans

    return most_frequent_element, times_seen


# ------------------------
def mode(list):
    """ Strips off mode values from mode_with_count.

    >>> mode(range(10) + range(15,25) + [16,16])
    16

    >>> mode([])
    nan

    >>> mode([1,2,2,2,N.nan])
    2

    >>> mode([1,2,N.nan,N.nan])
    nan

    """

    return mode_with_count(list)[0]


# ------------------------
def ensure_list(element):
    """ Ensure a variable is at least a list of length 1 (iterable) for functions that can't handle singletons.

    >>> ensure_list(1)
    [1]

    >>> ensure_list(None)
    [None]

    >>> ensure_list([1,])
    [1]

    >>> ensure_list(N.array((1,2,3)))
    array([1, 2, 3])

    >>> ensure_list((1,))
    (1,)

    """

    if is_not_iterable(element): return [element, ]
    return element


# ------------------------
def most_common_elements(lister):
    """ Return breakdown of counts per element, sorted by most frequent first.

    >>> most_common_elements((1,1,1,2,2,3,3,4,5))
    (array([1, 3, 2, 5, 4]), array([3, 2, 2, 1, 1]))

    >>> most_common_elements(())
    ([], [])

    >>> most_common_elements((None,1,2,None,None,-1))
    (array([None, 2, 1, -1], dtype=object), array([3, 1, 1, 1]))

    >>> most_common_elements((None, N.nan, 0, 0))
    (array([0, nan, None], dtype=object), array([2, 1, 1]))

    """

    counter = C.Counter(lister)
    counts, items = sort_arrays_by_first_reverse(counter.values(), counter.keys())
    return items, counts


# ------------------------
def rms(list):
    list = N.array(list)
    return N.sqrt(N.mean(list * list))


# ------------------------
def rss(list):
    list = N.array(list)
    return N.sqrt(N.sum(list * list))


# ------------------------
def MLStats(truepos, falsepos, trueneg, falseneg, fmeasure_beta=1):
    """ Returns precision, recall, and f-measure based on true positives, false positives, and false negatives.
    Fix to zero cases of no positive labels, no negative labels, or no results at all will report 0's everywhere.

    Args: (can be individual floats/integers)
        truepos : absolute number of true  positives
        falsepos: absolute number of false positives
        trueneg : absolute number of true  negatives
        falseneg: absolute number of false negatives
        fmeasure_beta: The beta term in the fmeasure calculation. 1 is equal balance. 0.5 emphasizes precision over recall, 2 vice versa.

    Returns:
        precision: number from 0 to 1 "how many returned positives were correct?"             (purity       of positives)
        recall   : number from 0 to 1 "how many of the total positives were returned at all?" (completeness of positives)
        fmeasure : number from 0 to 1, harmonic mean of precision and recall (also square of geometric mean / arithmetic mean)
        accuracy : number from 0 to 1, "how many times were you correct in guessing positive or negative?"

    >>> MLStats( 60, 140, 9760, 40 )
    (0.3, 0.6, 0.4, 0.982)

    >>> MLStats( 60, 140, 9760, 40, fmeasure_beta = 0.5)
    (0.3, 0.6, 0.3333333333333333, 0.982)

    >>> MLStats( 60, 140, 9760, 40, fmeasure_beta = 2  )
    (0.3, 0.6, 0.5, 0.982)

    >>> MLStats( 0, 0, 0, 0 )
    (0.0, 0.0, 0.0, 0.0)

    """

    SMALL = 1e-19
    truepos = float(truepos)
    B2 = fmeasure_beta * float(fmeasure_beta)
    precision = truepos / (truepos + falsepos + SMALL)
    recall = truepos / (truepos + falseneg + SMALL)
    fmeasure = (1.0 + B2) * precision * recall / (B2 * precision + recall + SMALL)
    accuracy = (truepos + trueneg) / (truepos + trueneg + falsepos + falseneg + SMALL)
    return precision, recall, fmeasure, accuracy


# -----------------
def percentile90(x):
    return N.percentile(x, 90)


# -----------------
def percentile10(x):
    return N.percentile(x, 10)


# -----------------
def separate_array_by_ranges(array_to_separate, array_to_range, ranges):
    """Masks out regions of array_to_separate by the specified ranges in array_to_range.
    Specified ranges are inclusive.

    Args:
        array_to_separate: list or array of values to separate
        array_to_range   : separate array that will be compared to ranges to determine mask
        ranges           : array of pairs (low, high) of values that define the masks for each range
    Returns:
        list of NDarrays that match the ranges

    >>> separate_array_by_ranges([8,9,10,11,12,13,14],[1,2,3,4,5,6,7],[[0,2],[3,5],[6,7]])
    [array([8, 9]), array([10, 11, 12]), array([13, 14])]

    >>> separate_array_by_ranges([8,9,10,11,12,13,14],[1,2,3,4,5,6,7],[])
    []

    >>> separate_array_by_ranges([8,9,10,11,12,13,14],[1,2],[[0,2],[3,5],[6,7]])
    Traceback (most recent call last):
    Exception: separation and range arrays must match in length

    """

    if len(array_to_separate) != len(array_to_range): raise Exception(
        "separation and range arrays must match in length")

    array_to_separate = N.array(array_to_separate)
    array_to_range = N.array(array_to_range)

    retval = []

    for ranger in ranges:
        mask = inr(array_to_range, ranger[0], ranger[1])
        retval.append(array_to_separate[mask])

    return retval


# --------------------
def booleans_to_integer(booleans):
    """ Converts a boolean iterable into an integer bit-wise.
    Note that the LSB is at index 0.

    Standard case
    >>> booleans_to_integer([True, False, True, False])
    5

    Verify Numpy array
    >>> booleans_to_integer(N.array([True, False, True, False]))
    5

    Empty case
    >>> booleans_to_integer([])
    0

    1-length array
    >>> booleans_to_integer([True,])
    1

    Non-iterable passed
    >>> booleans_to_integer(5)
    Traceback (most recent call last):
    Exception: Only iterables may be transformed into integers: 5
    """

    if is_not_iterable(booleans): raise Exception("Only iterables may be transformed into integers: " + str(booleans))

    intval = 0
    for i, boolval in enumerate(booleans):
        if boolval: intval += int(boolval) << i
    return intval


# --------------------
def base10_to_baseN(intval, digits_to_use="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"):
    """ Converts a boolean iterable into a uniquely identifying alphanumeric string bit-wise.
    Effectively converts into base of digits + alpha + ALPHA = 10 + 26 + 26 = 62.
    Note that the LSB is at index 0. Changing digits_to_use automatically changes base accordingly.

    Standard case
    >>> base10_to_baseN(5)
    '5'

    >>> base10_to_baseN(62)
    '10'

    Verify Numpy array
    >>> base10_to_baseN(N.array(5))
    '5'

    Stress test a very large value
    >>> base10_to_baseN(booleans_to_integer([True,]*800))
    '4oPPXhCZsHLTW96ahHGDfXBZxOZYixGBnignbTzQ6XF06L1fAHysU0YsBiUppygzjGKQndYGRRlKRw9vYmWTUqml2eeFw79iiICumWME6gHKwov6FLS4iHnuIUQCte02Pfupr2v'

    Stress test a very large value
    >>> base10_to_baseN(booleans_to_integer([True,]*100))
    'qADiGrP0AKRA2S8Uv'

    >>> base10_to_baseN(N.nan)
    Traceback (most recent call last):
    Exception: Cannot process Nan: no general string representation available that isn't actual transform

    >>> base10_to_baseN(N.inf)
    Traceback (most recent call last):
    Exception: Cannot process Inf: no general string representation available that isn't actual transform

    """

    if N.isnan(float(intval)):
        raise Exception("Cannot process Nan: no general string representation available that isn't actual transform")
    if N.isinf(float(intval)):
        raise Exception("Cannot process Inf: no general string representation available that isn't actual transform")

    base = len(digits_to_use)

    if intval == 0:
        return digits_to_use[0]

    digits = []
    while intval:
        digits.append(digits_to_use[intval % base])
        # updated to keep integer divide in python3
        intval //= base
    digits.reverse()
    return ''.join(digits)


# --------------------
def mean_monthly_standard_deviation(target, decimal_years, min_samples_per_month=100,
                                    return_bins=False, use_bins=None):
    """ Calculates the mean monthly standard deviation of a target vector given associated decimal_years for grouping.
    Args:
        target       : the values to perform the MMS upon
        decimal_years: time measure where values 0.0 through 1.0 represent an entire year's span, with arbitrary integer added for current year
        min_samples_per_month: if less than this number of samples presentin a month, do not include that month in the calculation
        return_bins  : return the time bins used, useful to ensure bin stability between different sample sets
        use_bins     : pass in an existing bins structure to use, otherwise one is calculated

    Returns:
        mms          : the calculated mms
        bins         : (optional) the bin ranges (array of range pairs) used for monthly binning
        means        : (optional) the means  per month
        stdevs       : (optional) the stdevs per month
        counts       : (optional) the counts per bin

    A smooth case, very easy, nice uniform coverage, low spread in each bin making a low mms
    >>> decimal_years = N.linspace(2014,2015,100000)
    >>> target        = N.linspace(   0, 100,100000)
    >>> mms, bins, means, stdevs, counts = mean_monthly_standard_deviation(target, decimal_years, return_bins = True)
    >>> mms
    2.4057704563006119
    >>> bins[0],bins[-1]
    ((2014.0, 2014.0824175824175), (2015.0, 2015.0824175824175))
    >>> stdevs
    array([ 2.45881504,  2.22065567,  2.45881504,  2.37913991,  2.45881504,
            2.37913991,  2.45881504,  2.45852636,  2.37942859,  2.45852636,
            2.37942859,  2.37913991,         nan])
    >>> means
    array([   4.25804258,   12.36262363,   20.46720467,   28.84628846,
             37.22537225,   45.60445604,   53.98353984,   62.500125  ,
             70.87920879,   79.25829258,   87.63737637,   95.87895879,
            100.        ])
    >>> [int(N.round(x)) for x in counts]
    [8517, 7692, 8517, 8241, 8517, 8241, 8517, 8516, 8242, 8516, 8242, 8241, 1]

    A rough case with clustered data availability between 0.0 and 0.3, 0.6 and 0.8, and huge density between 0.9 and 1.0
    >>> decimal_years = ( list(N.linspace(2014.0, 2014.3, 10000)) +
    ...                   list(N.linspace(2014.6, 2014.8, 10000)) +
    ...                   list(N.linspace(2014.9, 2015.0, 80000)) )
    >>> mms, bins, means, stdevs, counts = mean_monthly_standard_deviation(target, decimal_years, return_bins = True)
    >>> mms
    3.2076458237334373
    >>> bins[0],bins[-1]
    ((2014.0, 2014.0824175824175), (2015.0, 2015.0824175824175))
    >>> stdevs
    array([  0.81970123,   0.74031477,   0.81941255,   0.50792896,
                    nan,          nan,          nan,   0.97558736,
             1.18978646,   0.72183938,   4.06068939,  19.03355232,          nan])
    >>> means
    array([   1.41901419,    4.12054121,    6.82156822,    9.1200912 ,
                     nan,           nan,           nan,   11.68911689,
             15.43915439,   18.7496875 ,   27.03277033,   67.03267033,
            100.        ])
    >>> [int(N.round(x)) for x in counts]
    [2839, 2564, 2838, 1759, 0, 0, 0, 3379, 4121, 2500, 14066, 65933, 1]

    A case of total sparsity except for a single very dense month with huge range making a large mms
    >>> decimal_years = ( list(N.linspace(2010.0 , 2014.4 , 100)) +
    ...                   list(N.linspace(2014.5 , 2014.55, 10000)) +
    ...                   list(N.linspace(2014.55, 2018.0 , 100)) )
    >>> target        = N.linspace(0, 100, 10200)
    >>> mms, bins, means, stdevs, counts = mean_monthly_standard_deviation(target, decimal_years, return_bins = True)
    >>> mms
    28.308504314561453
    >>> bins[0],bins[-1]
    ((2010.0, 2010.0824175824175), (2018.0, 2018.0824175824175))
    >>> [N.round(x) for x in stdevs]
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, nan, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, nan, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, nan, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, nan, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, nan, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, nan, 0.0, 0.0, 0.0, 0.0, 0.0, nan, 28.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, nan]
    >>> [N.round(x) for x in means]
    [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, nan, 50.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 99.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0, 100.0]
    >>> [int(N.round(x)) for x in counts]
    [2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 0, 10001, 3, 2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 2, 3, 2, 3, 2, 2, 3, 2, 2, 3, 2, 3, 2, 3, 2, 2, 3, 2, 2, 1]

    A sparse case with too little data per month and thus a NaN output
    >>> decimal_years = N.linspace(2014,2015,12)
    >>> target        = N.linspace(2014,2015,12)
    >>> mean_monthly_standard_deviation(target, decimal_years)
    nan

    Empty case
    >>> decimal_years = N.array(())
    >>> target        = N.array(())
    >>> mean_monthly_standard_deviation(target, decimal_years)
    nan

    Nan case
    >>> mean_monthly_standard_deviation([1,2,N.nan],[1,2,3])
    nan

    """

    # handle (mostly) empty case or Nans present in decimal_years
    if (len(target) < min_samples_per_month) or N.isnan(decimal_years).any():
        if return_bins: return N.nan, [], [], []
        return N.nan

    # form bins by month, or use those passed in

    if use_bins is not None:
        bins = use_bins
    else:
        from mlib.mtime import decimal_year_bins
        bins = decimal_year_bins(decimal_years, 'month')

    # reduce the range formulation of bins above to that used by SPS (left-most edges plus the last right-most edge)
    bin_edges = [x[0] for x in bins] + [bins[-1][1], ]

    # Calculate binning (ignores NaN's in target values)
    stdevs, bin_edges, indices = SPS.binned_statistic(decimal_years, target, statistic=std, bins=bin_edges)
    counts, bin_edges, indices = SPS.binned_statistic(decimal_years, target, statistic='count', bins=bin_edges)
    if return_bins:
        means, bin_edges, indices = SPS.binned_statistic(decimal_years, target, statistic='mean', bins=bin_edges)

    # Only use values with binnumber > min samples
    mask = counts >= min_samples_per_month

    # Take the literal mean of the monthly standard deviations, sampled only from sufficient data density
    # Check for no acceptable ranges
    mms = N.mean(stdevs[mask]) if N.sum(mask) > 0 else N.nan

    if return_bins:
        return mms, bins, means, stdevs, counts
    else:
        return mms


# --------------------
def subtract_monthly_mean(target, decimal_years, min_samples_per_month=100, use_bins=None):
    """ Subtracts off the monthly mean from a target set of data given associated decimal_years for grouping.

    Args:
        target       : the values to subtract off the monthly mean
        decimal_years: time measure where values 0.0 through 1.0 represent an entire year's span, with arbitrary integer added for current year
        min_samples_per_month: if less than this number of samples presentin a month, do not include that month in the calculation and return NaN for all target data in that bin
        use_bins     : pass in an existing bins structure to use, otherwise one is calculated

    Returns:
        target_minus_monthly_means: the target values with monthly means subtracted

    A smooth case, very easy, nice uniform coverage, low spread in each bin making a low mms
    >>> decimal_years = N.linspace(2014,2015,100000)
    >>> target        = N.linspace(   0, 100,100000)
    >>> target
    array([  0.00000000e+00,   1.00001000e-03,   2.00002000e-03, ...,
             9.99980000e+01,   9.99990000e+01,   1.00000000e+02])
    >>> subtract_monthly_mean(target, decimal_years)
    array([-4.25804258, -4.25704257, -4.25604256, ...,  4.11904119,
            4.1200412 ,         nan])

    """

    # handle (mostly) empty case or Nans present in decimal_years
    if (len(target) < min_samples_per_month) or N.isnan(decimal_years).any():
        return N.nan * target

    # form bins by month, or use those passed in

    if use_bins is not None:
        bins = use_bins
    else:
        from mlib.mtime import decimal_year_bins
        bins = decimal_year_bins(decimal_years, 'month')

    # reduce the range formulation of bins above to that used by SPS (left-most edges plus the last right-most edge)
    bin_edges = [x[0] for x in bins] + [bins[-1][1], ]

    # Calculate binning (ignores NaN's in target values)
    counts, bin_edges, indices = SPS.binned_statistic(decimal_years, target, statistic='count', bins=bin_edges)
    means, bin_edges, indices = SPS.binned_statistic(decimal_years, target, statistic='mean', bins=bin_edges)

    # Only use values with binnumber > min samples
    means[counts < min_samples_per_month] = N.nan

    # Subtract the appropriate binned mean from all relevant data points
    target_subtracted = N.array(target)  # ensures deep copy

    for bin_id, left, right in zip(range(len(bin_edges) - 1), bin_edges[:-1], bin_edges[1:]):
        target_subtracted[(decimal_years >= left) & (decimal_years < right)] -= means[bin_id]

    return target_subtracted


# Calculate STD of list with associated uncertainties def std_error_uncertainties(y,dy): ymean = N.sum(y/dy)/N.sum(
# 1/dy) print "stats mean/median/num:",ymean,N.mean(y),N.mean(dy),N.std(y),N.std(dy),len(y),"metric:",N.sqrt(N.sum(((
# y-ymean)/dy)**2)/N.sum((1/dy)**2)) return N.sqrt(N.sum(((y-ymean)/dy)**2)/N.sum((1/dy)**2))

# Calculate RMS of list with associated uncertainties
# def rms_error_uncertainties(y,dy):
#    return N.sqrt(N.sum((y/dy)**2)/N.sum((1/dy)**2))

# --------------------------------
def reverse_operator(operator):
    """ Reverses operators, + to -, > to <, * to /, etc.

    >>> reverse_operator('+')
    '-'

    >>> reverse_operator('>')
    '<'

    >>> reverse_operator('invalid operator')
    Traceback (most recent call last):
    KeyError: 'invalid operator'

    """

    rev_dict = {
        '+': '-',
        '-': '+',
        '>': '<',
        '<': '>',
        '*': '/',
        '/': '*',
        '==': '!=',
        '>=': '<=',
        '<=': '>=',
    }

    return rev_dict[operator]


# --------------------------------
# --------------------------------
# --------------------------------

if __name__ == "__main__":
    import doctest
    from mlib._doctest import repo_path

    N.set_printoptions(legacy='1.13')
    doctest.testmod(optionflags=doctest.ELLIPSIS)
