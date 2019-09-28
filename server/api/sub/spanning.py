# -----------------------------------------------------------------
# -----------------------------------------------------------------
#
#  Mandrake lib (mlib) for spanning across high dimensional data
#
# -----------------------------------------------------------------
# -----------------------------------------------------------------

import logging
logger = logging.getLogger(__name__)

import numpy as N
import scipy.spatial.distance as SD

# This scaling term "spaces out" decimal_year time measure to be directly comparible with lat/lon in degrees
# for the purpose of distance metrics, spanning, and other comparisons.
DECIMAL_YEAR_TO_LATITUDE_SCALING = 1736729.0  # (latitude degrees per decimal year)

def normalize(vals, kind='standardize'):
    '''
    Normalize an array of data in various ways
    kind determines which normalization style to use:
    None, 'none', False                = Do not alter data, a noop
    'standardize','standard','z', True = utilizes (v-mean)/std (range -Inf to Inf for outliers, std = 1, mean = 0)
    'scaling','scale', 'flat'          = utilizes (v-vmin)/(vmax-vmin) (range 0-1 guarenteed, outliers may push bulk/mean to similar values)
    '''
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

    """
    if is_iterable(var) and len(var) == 0: return []

    std = N.std(N.array(var, dtype=N.float64), ddof=1)
    return (N.array(var) - N.mean(var)) / std

def is_iterable(item):
    """ Checks whether an item is an iterable or a singleton.
    """
    return hasattr(item,'__iter__')

def is_not_iterable(item):
    """ Checks whether an item is not an iterable or a singleton.
    """
    return not hasattr(item,'__iter__')


def scale(var):
    """ Scale a variable to fit between 0 and 1, alternate normalization.
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

