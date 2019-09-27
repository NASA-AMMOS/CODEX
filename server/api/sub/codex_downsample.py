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
import traceback
import logging

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX library imports
from api.sub.codex_math import codex_impute
from api.sub.codex_hash import get_cache
from api.sub.spanning   import mask_spanning_subset

def downsample(inputArray, samples=0, percentage=0.0, session=None):
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
    >>> from codex_hash import DOCTEST_SESSION
    >>> ch = get_cache(DOCTEST_SESSION)
    >>> array = np.random.rand(200)

    >>> result = downsample(array,percentage=10, session=ch)
    >>> print(len(result))
    20

    >>> result = downsample(array,samples=50, session=ch)
    >>> print(len(result))
    50

    # More samples than in array
    >>> result = downsample(array,samples=250, session=ch)
    >>> print(len(result))
    200

    >>> ch.resetCacheList("downsample")
    >>> result1 = downsample(array, samples=50, session=ch)
    >>> result2 = downsample(array, samples=50, session=ch)
    >>> print(np.array_equal(result1, result2))
    True

    >>> result3 = downsample(array, percentage=120, session=ch)

    >>> result4 = downsample(array, session=ch)

    '''
    ch = get_cache(session)

    # first, create a hash of the input array, don't save
    inputHash = ch.hashArray("NOSAVE", inputArray, "NOSAVE")
    inputHashCode = inputHash["hash"]
    inputArray = codex_impute(inputArray) # TODO - mblib spanning seems to have problems with NaNs.  Impute until fixed.

    if inputArray.ndim == 1:
        inputList = [inputArray.tolist()]
    else:
        inputList = inputArray.T.tolist()

    totalPoints = len(inputList[0])

    # if number of samples is provided, use
    if(samples != 0):
        usedSamples = samples

    elif(percentage != 0):
        if(percentage <= 100 and percentage >= 0):
            usedSamples = int(float(percentage / 100) * totalPoints)
        else:
            logging.warning("ERROR: downsample - perceange out of bounds 0-100")
            usedSamples = totalPoints

    else:
        logging.warning("ERROR: downsample - samples and percentage both 0.")
        usedSamples = totalPoints

    # first, check if this downsampling has already been done before
    existingHashCheck = ch.findHashArray("name", inputHashCode, "downsample")

    # Check if raw length is already less than requested downsample rate.
    #   If it is, use that, otherwise, resample.
    if(existingHashCheck is not None and existingHashCheck["samples"] == usedSamples):
        outputArray = existingHashCheck["data"]

    else:

        try:

            mask_, array_ = mask_spanning_subset(inputList, usedSamples)
            outputArray = inputArray[mask_]

        except BaseException:


            logging.warning("ERROR: downsample - failed to downsample.\n\n{trace}".format(trace=traceback.format_exc()))
            outputList = inputList

            # Convert back to numpy array
            outputArray = np.asarray(outputList)
            outputArray = outputArray.T


    # Hash the downsampled output, using the hash of the input in place of the name.
    #	Later look up using this, w.r.t origin data
    outputHash = ch.hashArray(inputHashCode, outputArray, "downsample")
    return outputArray


if __name__ == "__main__":

    from codex_doctest import run_codex_doctest
    run_codex_doctest()
