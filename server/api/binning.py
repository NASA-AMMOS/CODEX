'''
Author: Jack Lightholder
Date  : 6/20/17

Brief : 1d binning algorithms, formatted for CODEX ingestion

Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import time
import collections
import traceback
import inspect
import logging

import numpy as N

from scipy import stats

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_time_log    import logTime
from api.sub.return_code       import logReturnCode
from api.sub.codex_hash        import get_cache

def ml_binning(
        inputHash,
        hashList,
        subsetHashName,
        algorithmName,
        downsampled,
        parms,
        result,
        session=None):
    '''
    Inputs:

    Outputs:

    '''
    ch = get_cache(session)

    data = ch.mergeHashResults(hashList)
    inputHash = ch.hashArray('Merged', data, "feature")
    if(inputHash is not None):
        inputHash = inputHash["hash"]
    else:
        logging.warning("Feature hash failure in ml_cluster")
        result['message'] = "Feature hash failure in ml_cluster"
        return None

    if(subsetHashName is not None):
        subsetHash = ch.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    if(algorithmName == '1d'):

        try:
            result = codex_binned_stat(inputHash, subsetHash, session=session)
        except BaseException:
            logging.warning("Failed to run 1-d binned statistics")
            result['message'] = "Failed to run 1-d binned statistics"
            logging.warning(traceback.format_exc())
            return None

    else:
        result['message'] = "Cannot find requested binning algorithm"

    return result


def is_iterable(elements):
    '''
    Inuputs:

    Outputs:

    '''
    if isinstance(elements, collections.Iterable):
        return True
    else:
        return False


def monotonic(bins, monotonicType):
    '''
    Inuputs:

    Outputs:

    '''
    if(monotonicType == 'strictly increasing'):
        return N.all(N.diff(bins) > 0)


def codex_binned_stat(
        inputHash,
        subsetHash=False,
        bins=50,
        y=None,
        limits=None,
        func=None,
        ignore_outliers=False,
        session=None):
    '''
    Detail:     Binning statistics including histogram (counting) and functions of data bins.
                    Major customization is bins are specified by CENTER, not by edges. #bins = specified bin values.
    Inputs:
        x     : One dimensional iterable containing values to bin. Nans, infs, and other special values will be ignored.
        bins  : number of bins to use (integer) or the bin centers to use directly (iterable). If not monotonically increasing, will fail.
        y     : The weights to apply (for histogramming) or the input values to be reduced by func into bins grouped by x.
        limits: The maximum extent to include in the binning. None will automatically include the full range of x. Ignored if bins specified.
        func  : The function to use to reduce the y's grouped into bins.
                'count' (default if y not given) just counts how many x's are in the bins and returns the histogram (y is ignored)
                'sum'   sums up the y's. Can be used to perform a weighted histogram.
                'mean'  (default if y given    ) takes the mean of the binned y's

        ignore_outliers: Points beyond specified "limits" variable will be ignored and not plotted. Automatic if func is not 'count'.
                         If set to False and func is None or 'count', will add up outliers beyond limits and add to extreme bin values.

    Outputs:
        bins, values: The bin centers used, and the values (counts) within each bin

    '''
    ch = get_cache(session)

    startTime = time.time()

    returnHash = ch.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Hash not found. Returning!")
        return

    x = returnHash['data']

    if(subsetHash is not False):
        x = ch.applySubsetMask(x, subsetHash)

    x = N.array(x, dtype=N.float64)

    if y is not None:
        if len(x) != len(y):
            raise Exception("x & y array lengths must match")
        y = N.array(y, dtype=N.float64)

    if is_iterable(bins) and not monotonic(bins, 'strictly increasing'):
        raise Exception(
            "Specified bins must be monotonically increasing to be valid")

    nanmask = ~N.isnan(x)
    if y is not None:
        nanmask = nanmask & (~N.isnan(y))
    x = x[nanmask]
    if y is not None:
        y = y[nanmask]

    # assume function "count" unless specified, and always if no y is supplied
    if (func is None) and (y is not None):
        func = "mean"
    if (y is None) or (len(y) == 0):
        func = "count"
        y = None

    # outliers ignored unless we're explicitly just counting
    if isinstance(func, str) and not func.lower() in ("count", "sum"):
        ignore_outliers = True

    # Process defaults
    if limits is None:
        limits = [N.min(x), N.max(x)]

    # Define our bin centers (or use user-supplied ones)
    # A single length array is not usable, so add another 10% away
    if is_iterable(bins) and len(bins) == 1:
        bins = [bins[0], bins[0] * 0.1]
    if is_iterable(bins):
        delta = bins[1] - bins[0]
        limits = [N.min(bins) - delta / 2.0, N.max(bins) + delta / 2.0]
        mn, mx = limits
    else:
        mn, mx = limits
        delta = (mx - mn) / float(bins)
        if delta == 0.0:
            delta = 0.1  # must be able to differentiate bins, even if the input data is all identical
        bins = [mn + delta / 2.0 + delta * t for t in range(bins)]

    bins = N.array(bins)
    bin_edges = bins - delta / 2.0
    bin_edges = list(bin_edges) + [bin_edges[-1] + delta]

    if (len(x) == 0) and (func.lower() == 'count'):
        # forcibly return zeros for count function, binned_statistic can't
        # handle empty input list
        return bins, bins * 0.0
    if (len(x) == 0):
        # forcibly return NaN's for all other functions (ill-defined)
        return bins, bins * N.nan

    values, bin_edges, binnumber = stats.binned_statistic(
        x, y, statistic=func, bins=bin_edges)

    # Now we have to add back in values beyond the limits, as numpy ignores
    # them annoyingly
    if not ignore_outliers:
        values[0] += N.sum(x < bin_edges[0])
        values[-1] += N.sum(x >= bin_edges[-1])

    endTime = time.time()
    computeTime = endTime - startTime
    logTime("binning", "1d", computeTime, len(x), x.ndim)

    logReturnCode(inspect.currentframe())

    dictionary = {"bin_centers": bins.tolist(), 'values': values.tolist()}
    return dictionary



