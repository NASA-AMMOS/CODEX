import codex_system
import codex_hash
'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Downsampling techniques, formatted for CODEX

Notes :
'''
import os
import sklearn
import random
import sys
import numpy as np

# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

# CODEX library imports


def downsample(inputArray, samples=0, percentage=0.0):
    '''
    Inputs:
        inputArray  - numpy array       - array to be downsampled
        samples     - int (optional)    - number of samples requested in output array
        percentage  - float	(optional)  -

    Outputs:
        outputArray - numpy array - resulting downsampled array

    Notes:
        If one wishes to do a percentage, do the
        percentage to samples calculation in the calling function

    Examples:
    >>> array = np.random.rand(200)

    >>> result = downsample(array,percentage=10)
    >>> print(len(result))
    20

    >>> result = downsample(array,samples=50)
    >>> print(len(result))
    50

    >>> codex_hash.resetCacheList("downsample")
    >>> result1 = downsample(array, samples=50)
    >>> result2 = downsample(array, samples=50)
    >>> print(np.array_equal(result1, result2))
    True

    >>> result3 = downsample(array, percentage=120)
    ERROR: downsample - perceange out of bounds 0-100

    >>> result4 = downsample(array)
    ERROR: downsample - samples and percentage both 0.
    '''

    # first, create a hash of the input array, don't save
    inputHash = codex_hash.hashArray("NOSAVE", inputArray, "NOSAVE")
    inputHashCode = inputHash["hash"]

    # convert to list
    inputList = inputArray.tolist()

    totalPoints = len(inputList)

    # if number of samples is provided, use
    if(samples != 0):
        usedSamples = samples

    elif(percentage != 0):
        if(percentage <= 100 and percentage >= 0):
            usedSamples = int(float(percentage / 100) * totalPoints)
        else:
            codex_system.codex_log(
                "ERROR: downsample - perceange out of bounds 0-100")
            usedSamples = totalPoints

    else:
        codex_system.codex_log(
            "ERROR: downsample - samples and percentage both 0.")
        usedSamples = totalPoints

    # first, check if this downsampling has already been done before
    existingHashCheck = codex_hash.findHashArray(
        "name", inputHashCode, "downsample")

    if(existingHashCheck is not None and existingHashCheck["samples"] == usedSamples):
        outputArray = existingHashCheck["data"]

    else:

        try:
            outputList = random.sample(inputList, usedSamples)
        except BaseException:
            outputList = inputList

        # Convert back to numpy array
        outputArray = np.asarray(outputList)

    # Hash the downsampled output, using the hash of the input in place of the name.
    #	Later look up using this, w.r.t origin data
    outputHash = codex_hash.hashArray(inputHashCode, outputArray, "downsample")
    return outputArray


if __name__ == "__main__":

    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)
