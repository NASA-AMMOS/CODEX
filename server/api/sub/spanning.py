# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for spanning across high dimensional data
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import numpy as N
import scipy.spatial.distance as SD

# This scaling term "spaces out" decimal_year time measure to be directly comparible with lat/lon in degrees
# for the purpose of distance metrics, spanning, and other comparisons.
DECIMAL_YEAR_TO_LATITUDE_SCALING = 1736729.0  # (latitude degrees per decimal year)

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

def is_iterable(item):
    """ Checks whether an item is an iterable or a singleton.
    >>> is_iterable("hello")
    False
    >>> is_iterable(2)
    False
    >>> is_iterable([2,])
    True
    >>> print(is_not_iterable(2) == (not is_iterable(2)))
    True
    """
    return hasattr(item, '__iter__')

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
    return not hasattr(item,'__iter__')


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


def mask_spanning_subset(feature_array_list, number, progressbar=False, normalization='standardize', weight_array=None,
                         separate_values=False, distance_metric='sqeuclidean', preselected_indices=[]):
    """ Function iteratively selects data samples that are as distant from existing selected samples as possible.
    Designed for large dimensional space (N-dimensional).
    Uses a grid of min distances to all taken points as we iteratively update with each selection
    NOTE: If you are spanning lat, lon, decimal_year then multiply decimal_year by DECIMAL_YEAR_TO_LAT_SCALING
          to make harmonious with latitude and logitude (in degrees).
          Further, DO NOT NORMALIZE or the relative importance of time and space will change depending on time range used.
          This is caused because time is not a bounded feature: we never re-sample the same regions later in the data.
          Hence its support continuously changes with more data and the normalization concept breaks down.

    Args:
        feature_array_list : list of equal-length arrays containing the features to jointly span. MUST be a list, not singleton array.
        number             : The number of points to include in subset
        weight_array       : specifies relative weighting between features during scaling, how much consideration to give them during spanning
        separate_values    : applies separating_noise to each feature independently, to avoid degeneracies such as integer values
        normalization      : specifies kind of normalization to use, see normalize above for details. Ignored if input is 1D
        distance_metric    : can be sqeuclidean, euclidean, cityblock, or many others (see scipy cdist). Each has its own speed and weaknesses.
        preselected_indices: can be indices of already selected subsamples that are then spanned beyond
    Returns:
        mask               : Mask of the spanning subset
        indices            : Indices in order of acceptance

        >>> N.random.seed(0)
        >>> test=N.arange(10)
        >>> mask_spanning_subset([test,test^2,test^3,-test,test^5],4)
        (array([ True, False, False, False,  True, False, False,  True, False,  True], dtype=bool), array([0, 9, 7, 4]))

        Asking for first two points equal the first two in the list of 4 above
        >>> mask_spanning_subset([test,test^2,test^3,-test,test^5],2)
        (array([ True, False, False, False, False, False, False, False, False,  True], dtype=bool), array([0, 9]))

        Ask for no points (or negative), get nothing back
        >>> mask_spanning_subset([test,test^2,test^3,-test,test^5],0)
        (array([False, False, False, False, False, False, False, False, False, False], dtype=bool), array([], dtype=float64))

        >>> mask_spanning_subset([],2)
        Traceback (most recent call last):
        Exception: No features to span!

        Detailed 1-D test
        >>> vals = N.array([1,1,1,2,2,3,4,4,5,5,5,6,6,7,8,8,9,9,9])
        >>> mask, indxs = mask_spanning_subset([vals,],5)
        >>> indxs
        array([ 0, 16,  8,  5, 13])
        >>> [vals[x] for x in indxs]
        [1, 9, 5, 3, 7]

        Detailed 2-D test
        Make a grid of values with a higher density region
        Integers represent the number of points to allocate to that x,y coordinate
        >>> vals1 = [[1,1,1,1,1,1,0],
        ...          [1,2,2,1,1,1,1],
        ...          [1,2,2,1,1,1,1],
        ...          [1,1,1,3,1,1,1],
        ...          [1,1,1,1,1,1,1],
        ...          [1,1,1,1,1,1,1],
        ...          [1,1,1,1,1,1,1],]

        Unwrap into list of points, replicated at points > 1
        >>> valx = []
        >>> valy = []
        >>> for x in range(7):
        ...    for y in range(7):
        ...       for i in range(vals1[x][y]):
        ...          valx.append(x)
        ...          valy.append(y)
        >>> valx = N.array(valx)
        >>> valy = N.array(valy)

        Form spanning solution for 10 points
        >>> mask, indxs = mask_spanning_subset([valx,valy],10)

        Graphically display chosen points, labeling them by order of choice
        >>> vals2 = N.array(vals1)*0-1
        >>> for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
        ...    vals2[x,y] = 9e9 if vals2[x,y] >= 0 else i
        >>> vals2
        array([[ 0, -1, -1,  6, -1, -1, -1],
               [-1, -1, -1, -1, -1,  3, -1],
               [-1, -1,  7, -1, -1, -1, -1],
               [ 5, -1, -1, -1, -1, -1,  8],
               [-1, -1, -1,  4, -1, -1, -1],
               [-1, -1, -1, -1, -1, -1, -1],
               [ 2, -1,  9, -1, -1, -1,  1]])

        Detailed 2-D test with sufficient points to cover grid, but better not see doubling up (note corner that isn't populated)
        >>> mask, indxs = mask_spanning_subset([valx,valy],7*7-1)

        Graphically display chosen points, labeling them by order of choice
        >>> vals2 = N.array(vals1)*0-1
        >>> for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
        ...    vals2[x,y] = 9e9 if vals2[x,y] >= 0 else i
        >>> vals2
        array([[ 0, 23, 16,  6, 15, 24, -1],
               [25, 12, 34, 35, 26,  3, 21],
               [36, 37,  7, 17, 38, 39, 40],
               [ 5, 27, 28, 29, 11, 30,  8],
               [31, 13, 18,  4, 32, 14, 33],
               [41, 42, 43, 44, 45, 46, 47],
               [ 2, 19,  9, 20, 10, 22,  1]])


        Detailed 3-D test with sufficient points to cover grid many times over, but also linearly increasing time per obs.
        This emulates spanning lat, lon, time case. We have sufficient data to cover lat,lon many times over, but time is
        unique and always increasing.
        >>> vals1 = [[10,10,10,10,10,10,10],
        ...          [10,10,10,10,10,10,10],
        ...          [10,10,10,10,10,10,10],
        ...          [10,10,10,10,10,10,10],
        ...          [10,10,10,10,10,10,10],
        ...          [10,10,10,10,10,10,10],
        ...          [10,10,10,10,10,10,10],]

        Unwrap into list of points, replicated at points > 1
        >>> valx = []
        >>> valy = []
        >>> for x in range(7):
        ...    for y in range(7):
        ...       for i in range(vals1[x][y]):
        ...          valx.append(x)
        ...          valy.append(y)
        >>> valx = N.array(valx)
        >>> valy = N.array(valy)

        Now make ever-increasing time for each obs
        >>> valt = range(len(valx))

        First cover 2D grid without time to demonstrate spanning functionality
        >>> mask, indxs = mask_spanning_subset([valx,valy],7*7)

        Graphically display chosen points, labeling them by order of choice
        9e9 means we overlapped a selection
        -1  means we didn't select that location
        >>> vals2 = N.array(vals1)*0-1
        >>> for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
        ...    vals2[x,y] = 9e9 if vals2[x,y] >= 0 else i
        >>> vals2
        array([[ 0, 29, 17,  5, 18, 30,  2],
               [31, 13, 32, 33, 34, 14, 35],
               [19, 36,  9, 20, 10, 21, 37],
               [ 6, 38, 22,  4, 23, 39,  7],
               [24, 40, 11, 25, 12, 26, 41],
               [42, 15, 27, 43, 28, 16, 44],
               [ 3, 45, 46,  8, 47, 48,  1]])

        Now do same thing but including linear time as co-spanning feature
        >>> mask, indxs = mask_spanning_subset([valx,valy,valt],7*7)

        Graphically display chosen points, labeling them by order of choice
        9e9 means we overlapped a selection
        -1  means we didn't select that location
        NOTE: selection 2 & 3 aren't in the corners, because it gets too close to the similar-time selection in 0!
        Here, because we are normalizing, the effect of time is less important than x or y alone because of larger t range.
        >>> vals2 = N.array(vals1)*0-1
        >>> for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
        ...    vals2[x,y] = 9e9 if vals2[x,y] >= 0 else i
        >>> vals2
        array([[ 0, 35, 24,  5, 44,  9, 27],
               [39, 13, 22, 33, 17, 36,  2],
               [ 7, 45, 12, 32, 19, 40, 21],
               [28, 14, 43,  4, 42, 15, 29],
               [30, 20, 46, 25, 11, 47,  8],
               [ 3, 37, 18, 34, 23, 16, 41],
               [31, 10, 48,  6, 26, 38,  1]])


        Now introduce non-uniformity in time to replicate problem observations from QTS sets.
        >>> vals_u = [[ 2, 2, 2, 2, 2, 2, 2],
        ...           [ 2, 2, 2, 2, 2, 2, 2],
        ...           [ 2, 2, 2, 2, 2, 2, 2],
        ...           [ 2, 2, 2, 2, 2, 2, 2],
        ...           [ 2, 2, 2, 2, 2, 2, 2],
        ...           [ 2, 2, 2, 2, 2, 2, 2],
        ...           [ 2, 2, 2, 2, 2, 2, 2],]

        Unwrap into list of points, replicated at points > 1
        >>> valx = []
        >>> valy = []
        >>> valt = []
        >>> for x in range(7):
        ...    for y in range(7):
        ...       for i in range(vals_u[x][y]):
        ...          valx.append(x)
        ...          valy.append(y)
        ...          valt.append(x+y*7)

        Copy the above solution every uniform time for three times
        >>> valt = valt + [x+7*7 for x in valt] + [x+2*7*7 for x in valt]
        >>> valx = valx + valx + valx
        >>> valy = valy + valy + valy

        Add a second popution
        Add in a narrower region of update in-between the previous time samples
        >>> vals_nu = [[ 0, 0, 0, 0, 0, 0, 0],
        ...            [ 0, 0, 0, 0, 0, 0, 0],
        ...            [ 2, 2, 2, 2, 2, 2, 2],
        ...            [ 2, 2, 2, 2, 2, 2, 2],
        ...            [ 2, 2, 2, 2, 2, 2, 2],
        ...            [ 0, 0, 0, 0, 0, 0, 0],
        ...            [ 0, 0, 0, 0, 0, 0, 0],]
        >>> valx_nu = []
        >>> valy_nu = []
        >>> valt_nu = []
        >>> for x in range(7):
        ...    for y in range(7):
        ...       for i in range(vals_nu[x][y]):
        ...          valx_nu.append(x)
        ...          valy_nu.append(y)
        ...          valt_nu.append(x+y*7)

        >>> nut=[]
        >>> nux=[]
        >>> nuy=[]
        >>> for i in range(10):
        ...    nut += [x/49.0+49+i for x in valt_nu]
        ...    nux += valx_nu
        ...    nuy += valy_nu

        Add together
        >>> valx += nux
        >>> valy += nuy
        >>> valt += nut

        >>> valx=N.array(valx)
        >>> valy=N.array(valy)
        >>> valt=N.array(valt)

        First cover 2D grid without time to demonstrate spanning functionality
        >>> mask, indxs = mask_spanning_subset([valx,valy],7*7*2)

        Graphically display chosen points as a density plot
        >>> vals2 = N.array(vals_nu)*0
        >>> for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
        ...    vals2[x,y] += 1

        Sound be a field of density 2 (with random time distribution)
        >>> vals2
        array([[2, 2, 2, 2, 2, 2, 2],
               [2, 2, 2, 2, 2, 2, 2],
               [2, 2, 2, 2, 2, 2, 2],
               [2, 2, 2, 2, 2, 2, 2],
               [2, 2, 2, 2, 2, 2, 2],
               [2, 2, 2, 2, 2, 2, 2],
               [2, 2, 2, 2, 2, 2, 2]])

        Now take time into consideration
        >>> mask, indxs = mask_spanning_subset([valx,valy,valt],7*7*2, separate_values = True)

        Graphically display chosen points as a density plot
        >>> vals2 = N.array(vals_nu)*0
        >>> for i,x,y in zip(range(len(valx)),valx[indxs],valy[indxs]):
        ...    vals2[x,y] += 1

        Note that equispacing in lat/lon is no longer possible, and that some density enhancement has occurred in the dense region.
        >>> vals2
        array([[3, 1, 2, 2, 3, 0, 3],
               [2, 2, 1, 2, 1, 2, 3],
               [1, 2, 3, 2, 3, 1, 2],
               [2, 3, 2, 2, 2, 2, 3],
               [3, 1, 3, 3, 1, 2, 3],
               [2, 1, 2, 2, 2, 1, 3],
               [2, 2, 1, 2, 2, 1, 2]])

    """

    # Handle various degenerate cases when nothing to return or returning entire set is appropriate
    numfeat = len(feature_array_list)

    # No features to span!
    if numfeat < 1: raise Exception('No features to span!')

    numsample = len(feature_array_list[0])

    # No samples to process!
    if numsample < 1: return N.zeros(0, dtype='bool'), N.array([])

    # If user doesn't want any points, don't give them any
    if number < 1: return feature_array_list[0].astype('bool') * False, N.array([])

    # If we requested samples >= ALL, return them all and a meaningless ordering to save computation
    if number >= numsample: return N.ones(numsample, dtype='bool'), N.arange(numsample)

    # Copy features into array for processing
    sdata = N.vstack(feature_array_list).astype(N.float64).T

    # if requested, add separating noise
    if separate_values:
        for f in range(numfeat): sdata[:, f] += separating_noise(sdata[:, f])

    # But if data is 1D, normalization is irrelevant
    # if numfeat < 2: normalization = None
    # Assume equal weights if no weight_array specified
    if weight_array is None: weight_array = N.ones(numfeat)
    # We must scale the incoming data so we can use a distance metric usefully
    for f in range(numfeat): sdata[:, f] = normalize(sdata[:, f], kind=normalization) * weight_array[f]

    #    print L.log_time_and_mem(TST,"initialization, normalization, noise addition")

    # Initialize spanning metric recording which samples have been chosen and min distance to nearest chosen point
    max_p = [N.max(sdata[:, f]) for f in range(numfeat)]
    min_p = [N.min(sdata[:, f]) for f in range(numfeat)]
    MAX_DIST = SD.cdist((max_p,), (min_p,), distance_metric).squeeze() * 1.0e6
    shortest_dist_to_chosen_points = N.ones(numsample, dtype=N.float64) * MAX_DIST

    if len(preselected_indices) > 0:
        # if preselected indices are available, use them
        indices_chosen = list(preselected_indices)
    else:
        # Start by always selecting the first point (gotta start somewhere...)
        indices_chosen = [0, ]
    shortest_dist_to_chosen_points[indices_chosen] = -1  # mark these points as taken

    # Unfortunately, cdist gets very strange when there's only 1 dimensional data, so have to pretend there's 2D
    # by copying the x values into a fake y dimension. Crude.
    if sdata.shape[1] == 1:
        sdata = N.array((sdata.squeeze(), sdata.squeeze())).T

    # Initialize sdata for numerous incoming points already selected, except the last one
    # that will be picked up by the main loop
    if progressbar and len(indices_chosen) > 1:
        from mlib.progressbar import bar_nospam
        vals = bar_nospam(indices_chosen[:-1])
    else:
        vals = indices_chosen[:-1]

    for index in vals:
        new_d2 = SD.cdist(sdata, (sdata[index, :].squeeze(),), distance_metric).squeeze()
        shortest_dist_to_chosen_points = N.minimum(new_d2, shortest_dist_to_chosen_points)

    num_incoming = len(indices_chosen)

    if progressbar:
        from mlib.progressbar import bar_nospam
        vals = bar_nospam(range(number - num_incoming))
    else:
        vals = range(number - num_incoming)

    for i in vals:
        new_d2 = SD.cdist(sdata, (sdata[indices_chosen[-1], :].squeeze(),), distance_metric).squeeze()
        shortest_dist_to_chosen_points = N.minimum(new_d2, shortest_dist_to_chosen_points)

        # Update the list of minimum distances to chosen points by reducing some because of new chosen point

        # Select most remote point
        chosen_index = N.argmax(shortest_dist_to_chosen_points)
        indices_chosen.append(chosen_index)
        shortest_dist_to_chosen_points[chosen_index] = -1  # mark this point as taken

    indices_chosen = N.array(indices_chosen)

    # Convert indices to mask
    mask = N.zeros(numsample, dtype='bool')
    mask[N.arange(numsample)[indices_chosen]] = True

    return mask, indices_chosen


if __name__ == "__main__":
    import doctest

    N.set_printoptions(linewidth=130, legacy='1.13')
    doctest.testmod()
