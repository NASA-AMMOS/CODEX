'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Tecachenology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys
import numpy as N

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.hash       import get_cache
from api.sub.hash       import DOCTEST_SESSION
from api.binning        import ml_binning
from api.binning        import codex_binned_stat
from api.sub.read_data  import codex_read_hd5
from fixtures           import testData

def test_ml_binning(capsys, testData):

    cache = get_cache(DOCTEST_SESSION)

    result = ml_binning(testData['inputHash'], testData['hashList'], None, "stats", False, {}, {}, session=cache)
    result = ml_binning(testData['inputHash'], testData['hashList'], None, "stat", False, {}, {}, session=cache)

def test_codex_binned_stat(capsys, testData):

    # First try without valid inputHash
    cache = get_cache(DOCTEST_SESSION)

    codex_binned_stat(None, bins = range(10), session=cache)
    #Hash not found. Returning!

    results = codex_binned_stat(testData['inputHash'], session=cache)
    #print(results)

    #Simple histogram case, notice integers are aligned perfectly with bin centers
    inputArray = range(0,10)
    inputHashDictionary = cache.hashArray("example 1", inputArray, "feature")
    inputHash = inputHashDictionary['hash']
    results = codex_binned_stat(inputHash, bins = range(10), session=cache)
    #print(results)

    #Note that providing bins = 10 causes a slight shift in the array, as the bin centers treat max/min(limits) as edges of right(left) most bins
    results = codex_binned_stat(inputHash, bins = 10, session=cache)
    #print(results)

    #Supplying y defaults to taking the mean of y's binned by x
    inputArray = range(10)
    inputHashDictionary = cache.hashArray("example 1", inputArray, "feature")
    inputHash = inputHashDictionary['hash']
    results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), session=cache)
    #print(results)

    results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = 'mean', session=cache)
    #print(results)

    #Instead specify "sum" to treat the y's as weights to a histogram
    results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = 'sum', session=cache)
    #print(results)

    #Or "median" by text ref, whicache uses an unknown median function that is neither scipy nor Numpy
    results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = 'median', session=cache)
    #print(results)

    #or by function ref, whicache produces different results because now you know whicache median function is being used
    results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = N.median, session=cache)
    #print(results)

    #Limits narrow the range, and since we're performing a plain histogram, the outliers are stacked on the wings
    results = codex_binned_stat(inputHash, bins = 4, limits = [4,6], session=cache)
    #print(results)

    #Unless we tell it not to
    results = codex_binned_stat(inputHash, bins = 4, limits = [4,6], ignore_outliers = True, session=cache)
    #print(results)

    #Specify specific bins to use, beyond range of data. Zeros filled where no data present in histogram case.
    inputArray = range(10,20)
    inputHashDictionary = cache.hashArray("example 1", inputArray, "feature")
    inputHash = inputHashDictionary['hash']
    results = codex_binned_stat(inputHash, bins = range(0,30,3), session=cache)
    #print(results)

    #But in function case, can't know what function value exists in empty bins
    results = codex_binned_stat(inputHash, y = range(10,20), bins = range(0,30,3), func = 'mean', session=cache)
    #print(results)

    #Limits ignored if bins specified
    results = codex_binned_stat(inputHash, y = range(10,20), bins = range(0,30,3), limits = [0,15], func = 'mean', session=cache)
    #print(results)

    results = codex_binned_stat(inputHash, bins = [0,1,2,3,4,5], session=cache)
    #print(results)


