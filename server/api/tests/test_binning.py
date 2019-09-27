import os
import pytest
import sys
import numpy as N

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_doctest import doctest_get_data
from api.sub.codex_hash import get_cache
from api.sub.codex_hash import DOCTEST_SESSION
from api.binning import ml_binning
from api.binning import codex_binned_stat
from api.sub.read_data import codex_read_hd5

def test_ml_binning(capsys):

    testData = doctest_get_data()
    ch = get_cache(DOCTEST_SESSION)

    result = ml_binning(testData['inputHash'], testData['hashList'], None, "stats", False, {}, {}, session=ch)
    result = ml_binning(testData['inputHash'], testData['hashList'], None, "stat", False, {}, {}, session=ch)

def test_codex_binned_stat(capsys):

    # First try without valid inputHash
    ch = get_cache(DOCTEST_SESSION)

    codex_binned_stat(None, bins = range(10), session=ch)
    #Hash not found. Returning!

    from api.sub.codex_doctest import doctest_get_data
    testData = doctest_get_data()
    results = codex_binned_stat(testData['inputHash'], session=ch)
    #print(results)

    #Simple histogram case, notice integers are aligned perfectly with bin centers
    inputArray = range(0,10)
    inputHashDictionary = ch.hashArray("example 1", inputArray, "feature")
    inputHash = inputHashDictionary['hash']
    results = codex_binned_stat(inputHash, bins = range(10), session=ch)
    #print(results)

    #Note that providing bins = 10 causes a slight shift in the array, as the bin centers treat max/min(limits) as edges of right(left) most bins
    results = codex_binned_stat(inputHash, bins = 10, session=ch)
    #print(results)

    #Supplying y defaults to taking the mean of y's binned by x
    inputArray = range(10)
    inputHashDictionary = ch.hashArray("example 1", inputArray, "feature")
    inputHash = inputHashDictionary['hash']
    results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), session=ch)
    #print(results)

    results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = 'mean', session=ch)
    #print(results)

    #Instead specify "sum" to treat the y's as weights to a histogram
    results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = 'sum', session=ch)
    #print(results)

    #Or "median" by text ref, which uses an unknown median function that is neither scipy nor Numpy
    results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = 'median', session=ch)
    #print(results)

    #or by function ref, which produces different results because now you know which median function is being used
    results = codex_binned_stat(inputHash, bins = 4, y = range(10,20), func = N.median, session=ch)
    #print(results)

    #Limits narrow the range, and since we're performing a plain histogram, the outliers are stacked on the wings
    results = codex_binned_stat(inputHash, bins = 4, limits = [4,6], session=ch)
    #print(results)

    #Unless we tell it not to
    results = codex_binned_stat(inputHash, bins = 4, limits = [4,6], ignore_outliers = True, session=ch)
    #print(results)

    #Specify specific bins to use, beyond range of data. Zeros filled where no data present in histogram case.
    inputArray = range(10,20)
    inputHashDictionary = ch.hashArray("example 1", inputArray, "feature")
    inputHash = inputHashDictionary['hash']
    results = codex_binned_stat(inputHash, bins = range(0,30,3), session=ch)
    #print(results)

    #But in function case, can't know what function value exists in empty bins
    results = codex_binned_stat(inputHash, y = range(10,20), bins = range(0,30,3), func = 'mean', session=ch)
    #print(results)

    #Limits ignored if bins specified
    results = codex_binned_stat(inputHash, y = range(10,20), bins = range(0,30,3), limits = [0,15], func = 'mean', session=ch)
    #print(results)

    results = codex_binned_stat(inputHash, bins = [0,1,2,3,4,5], session=ch)
    #print(results)


