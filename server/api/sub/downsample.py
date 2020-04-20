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
from api.sub.codex_math import impute
from api.sub.hash       import get_cache
from api.sub.spanning   import mask_spanning_subset

def downsample(inputArray, samples=0, percentage=0.0, session=None, algorithm="simple"):
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
    '''
    cache = get_cache(session)

    # first, create a hash of the input array, don't save
    inputHash = cache.hashArray("NOSAVE", inputArray, "NOSAVE")
    inputHashCode = inputHash["hash"]
    inputArray = impute(inputArray) # TODO - mblib spanning seems to have problems with NaNs.  Impute until fixed.
    totalPoints = inputArray.shape[0]

    # if number of samples is provided, use
    if(samples > 0):
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
    existingHashCheck = cache.findHashArray("name", inputHashCode, "downsample")

    # Check if raw length is already less than requested downsample rate.
    #   If it is, use that, otherwise, resample.
    if(existingHashCheck is not None and existingHashCheck["samples"] == usedSamples):
        outputArray = existingHashCheck["data"]

    else:

        try:

            if algorithm == "simple":

                outputArray = inputArray[np.random.choice(inputArray.shape[0], usedSamples, replace=False)]

            elif algorithm == "spanning":

                if inputArray.ndim == 1:
                    inputList = [inputArray.tolist()]
                else:
                    inputList = inputArray.T.tolist()
                mask_, array_ = mask_spanning_subset(inputList, usedSamples)
                outputArray = inputArray[mask_]

            else:
                logging.warning("Unknown downsampling algorithm: {algorithm}".format(algorithm=algorithm))
                outputArray = inputArray

        except BaseException:
            logging.warning("downsample - failed to downsample.\n\n{trace}".format(trace=traceback.format_exc()))
            outputArray = inputArray

    # Hash the downsampled output, using the hash of the input in place of the name.
    #	Later look up using this, w.r.t origin data
    outputHash = cache.hashArray(inputHashCode, outputArray, "downsample")
    return outputArray


