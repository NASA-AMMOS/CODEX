'''
Author: Jack Lightholder
Date  : 6/20/17

Brief : 1d binning algorithms, formatted for CODEX ingestion

Notes : 

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
## Enviornment variable for setting CODEX root directory.
CODEX_ROOT  = os.getenv('CODEX_ROOT')
import sys
sys.path.insert(1,CODEX_ROOT + '/api/sub/')
from scipy import stats
import matplotlib.pyplot as plt
import numpy as N
import collections, time
from scipy import stats
import traceback

# CODEX Support
import codex_return_code, codex_read_data_api
import codex_hash, codex_time_log
import codex_doctest

DEBUG = False

def ml_binning(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> (inputHash, hashList, template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = ml_binning(inputHash, hashList, None, "stats", False, {}, {})

    >>> result = ml_binning(inputHash, hashList, None, "stat", False, {}, {})

    '''

    data = codex_hash.mergeHashResults(hashList)
    inputHash = codex_hash.hashArray('Merged', data, "feature") 
    if(inputHash != None):
        inputHash = inputHash["hash"]
    else:
        codex_system.codex_log("Feature hash failure in ml_cluster")
        result['message'] = "Feature hash failure in ml_cluster"
        return None

    if(subsetHashName != None):
        subsetHash = codex_hash.findHashArray("name",subsetHashName,"subset")
        if(subsetHash == None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    if(algorithmName == '1d'):

        try:
            result = codex_binned_stat(inputHash, subsetHash)
        except:
            codex_system.codex_log("Failed to run 1-d binned statistics")
            result['message'] = "Failed to run 1-d binned statistics"
            codex_system.codex_log(traceback.format_exc())
            return None

    else:
        result['message'] = "Cannot find requested binning algorithm"

    return result

def is_iterable(elements):
    '''
    Inuputs:

    Outputs:

    Examples:

    '''
    if isinstance(elements, collections.Iterable):
        return True
    else:
        return False

def monotonic(bins, monotonicType):
    '''
    Inuputs:

    Outputs:

    Examples:

    '''
    if(monotonicType == 'strictly increasing'):
        return N.all(N.diff(bins) > 0)



def codex_binned_stat(inputHash, subsetHash = False, bins = 50, y = None, limits = None, func = None, ignore_outliers = False):
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

    Examples:

        # First try without valid inputHash
        >>> codex_binned_stat(None, bins = range(10))
        Hash not found. Returning!
        
        >>> featureList = ['L2/RetrievalResults/xco2']
        >>> hashList = codex_read_data_api.codex_read_hd5(CODEX_ROOT + '../../uploads/lnd_glint_subsample_10000.h5',featureList, "feature")

        >>> inputHash = hashList[0]
        >>> results = codex_binned_stat(inputHash)
        
        #print(results)

        #Simple histogram case, notice integers are aligned perfectly with bin centers
        >>> inputArray = range(0,10)
        >>> inputHashDictionary = codex_hash.hashArray("example 1", inputArray, "feature")
        >>> inputHash = inputHashDictionary['hash']
        >>> results = codex_binned_stat(inputHash, bins = range(10))

        #print(results)

        #Note that providing bins = 10 causes a slight shift in the array, as the bin centers treat max/min(limits) as edges of right(left) most bins
        >>> results = codex_binned_stat(inputHash, bins = 10)
        
        #print(results)

        #Supplying y defaults to taking the mean of y's binned by x
        >>> inputArray = range(10)
        >>> inputHashDictionary = codex_hash.hashArray("example 1", inputArray, "feature")
        >>> inputHash = inputHashDictionary['hash']
        >>> results = codex_binned_stat(inputHash, bins = 4, y = range(10,20))

        #print(results)

        >>> results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = 'mean')

        #print(results)

        #Instead specify "sum" to treat the y's as weights to a histogram
        >>> results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = 'sum')

        #print(results)

        #Or "median" by text ref, which uses an unknown median function that is neither scipy nor Numpy
        >>> results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = 'median')

        #print(results)
        
        #or by function ref, which produces different results because now you know which median function is being used
        >>> results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = N.median)

        #print(results)
        
        #Limits narrow the range, and since we're performing a plain histogram, the outliers are stacked on the wings
        >>> results = codex_binned_stat(inputHash, bins = 4, limits = [4,6])

        #print(results)
        
        #Unless we tell it not to
        >>> results = codex_binned_stat(inputHash, bins = 4, limits = [4,6], ignore_outliers = True)

        #print(results)
        
        #Specify specific bins to use, beyond range of data. Zeros filled where no data present in histogram case.
        >>> inputArray = range(10,20)
        >>> inputHashDictionary = codex_hash.hashArray("example 1", inputArray, "feature")
        >>> inputHash = inputHashDictionary['hash']
        >>> results = codex_binned_stat(inputHash, bins = range(0,30,3))

        #print(results)
        
        #But in function case, can't know what function value exists in empty bins
        >>> results = codex_binned_stat(inputHash, y = range(10,20), bins = range(0,30,3), func = 'mean')

        #print(results)

        #Limits ignored if bins specified
        >>> results = codex_binned_stat(inputHash, y = range(10,20), bins = range(0,30,3), limits = [0,15], func = 'mean')

        #print(results)

        >>> results = codex_binned_stat(inputHash, bins = [0,1,2,3,4,5])

        #print(results)  

    '''
    startTime = time.time()

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Hash not found. Returning!")
        return

    x = returnHash['data']

    if(subsetHash is not False):
        x = codex_hash.applySubsetMask(x, subsetHash)

    x = N.array(x, dtype=N.float64)

    if y is not None:
        if len(x) != len(y): raise Exception("x & y array lengths must match")
        y = N.array(y, dtype=N.float64)

    if is_iterable(bins) and not monotonic(bins, 'strictly increasing'):
        raise Exception("Specified bins must be monotonically increasing to be valid")

    nanmask = ~N.isnan(x)
    if y is not None: nanmask = nanmask & (~N.isnan(y))
    x = x[nanmask]
    if y is not None: y = y[nanmask]

    #assume function "count" unless specified, and always if no y is supplied
    if (func is None) and (y is not None):
        func = "mean"
    if (y is None) or (len(y) == 0):
        func = "count"
        y = None

    #outliers ignored unless we're explicitly just counting
    if isinstance(func, str) and not func.lower() in ("count","sum"):
        ignore_outliers = True

    #Process defaults
    if limits is None:
        limits = [N.min(x), N.max(x)]

    #Define our bin centers (or use user-supplied ones)
    #A single length array is not usable, so add another 10% away
    if is_iterable(bins) and len(bins) == 1: bins = [ bins[0], bins[0]*0.1 ]
    if is_iterable(bins):
        delta = bins[1]-bins[0]
        limits = [N.min(bins)-delta/2.0, N.max(bins)+delta/2.0]
        mn,mx = limits
    else:
        mn, mx = limits
        delta = (mx-mn)/float(bins)
        if delta == 0.0: delta = 0.1 #must be able to differentiate bins, even if the input data is all identical
        bins = [mn + delta / 2.0 + delta * t for t in range(bins)]

    bins = N.array(bins)
    bin_edges = bins - delta/2.0
    bin_edges = list(bin_edges) + [bin_edges[-1]+delta]

    if ( len(x) == 0 ) and (func.lower() == 'count'):
        return bins, bins*0.0 # forcibly return zeros for count function, binned_statistic can't handle empty input list
    if ( len(x) == 0 ):
        return bins, bins*N.nan # forcibly return NaN's for all other functions (ill-defined)

    values, bin_edges, binnumber = stats.binned_statistic(x, y, statistic=func, bins = bin_edges)

    #Now we have to add back in values beyond the limits, as numpy ignores them annoyingly
    if not ignore_outliers:
        values[ 0] += N.sum(x <  bin_edges[ 0])
        values[-1] += N.sum(x >= bin_edges[-1])

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("binning", "1d", computeTime, len(x), x.ndim)

    if(subsetHash is False):
        returnCodeString = "codex_1d_binning.codex_binned_stat('"+inputHash+"',False,"+str(bins)+","+str(y)+","+str(limits)+","+str(func)+","+str(ignore_outliers)+")" 
    else:
        returnCodeString = "codex_1d_binning.codex_binned_stat('"+inputHash+"','"+subsetHash+"',"+str(bins)+","+str(y)+","+str(limits)+","+str(func)+","+str(ignore_outliers)+")"    
    codex_return_code.logReturnCode(returnCodeString)

    dictionary = {"bin_centers":bins.tolist(), 'values':values.tolist()}
    return dictionary

if __name__ == "__main__":

    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)


