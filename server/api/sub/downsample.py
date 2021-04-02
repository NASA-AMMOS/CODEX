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
import math
import logging

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX library imports
from api.sub.codex_math import impute
from api.sub.hash import get_cache
from api.sub.spanning import mask_spanning_subset


def simple_downsample(inputArray, samples):
    '''
    Inputs:
        inputArray  - numpy array to be downsampled (1D)
        samples     - target sample size

    Notes:
        This function was written to handle 1D arrays, however during testing
        2D arrays were noticed to be passed in. To handle these cases, these
        arrays are flattened to 1D, downsample applied, then reconstructed
        to the original shape.
    '''
    if inputArray.shape[1] != 1:
        logger.error('Simple downsampling expects inputArray to be 1D! It is: {inputArray.shape[1]}D. Will attempt to downsample but may not work correctly')

    if (inputArray.size < samples):
        return inputArray

    stride = math.floor(inputArray.size / samples)

    # hackish, but sometimes this will fetch slightly too many samples
    # so we add a [:samples] to get the first 'samples' downsamples
    try:
        data = inputArray.flatten()[::stride][:samples].reshape(int(samples/inputArray.shape[1]), inputArray.shape[1])
    except:
        logger.exception('Failed to using multi-dimensional downsampling, falling back to original method')
        data = inputArray[::stride][:samples].copy()

    logger.debug(f'Returning downsample\n\tsize  = {data.size}\n\tshape = {data.shape}\n\texpected: {samples}')
    return data


def downsample(inputArray,
               samples=0,
               percentage=0.0,
               session=None,
               algorithm="simple"):
    '''
    Inputs:
        inputArray  - numpy array       - array to be downsampled
        samples     - int (optional)    - number of samples requested in output array
        percentage  - float (optional)  -

    Outputs:
        outputArray - numpy array - resulting downsampled array

    Notes:
        If one wishes to do a percentage, do the
        percentage to samples calculation in the calling function
    '''
    cache = get_cache(session, timeout=None)

    # first, create a hash of the input array, don't save
    inputHash = cache.hashArray("NOSAVE", inputArray, "NOSAVE")
    inputHashCode = inputHash["hash"]
    inputArray = impute(
        inputArray
    )  # TODO - mblib spanning seems to have problems with NaNs.  Impute until fixed.
    totalPoints = inputArray.shape[0]

    # if number of samples is provided, use
    if (samples > 0):
        usedSamples = samples

    elif (percentage != 0):
        if (percentage <= 100 and percentage >= 0):
            usedSamples = int(float(percentage / 100) * totalPoints)
        else:
            logging.warning(
                "ERROR: downsample - perceange out of bounds 0-100")
            usedSamples = totalPoints

    else:
        logging.warning("ERROR: downsample - samples and percentage both 0.")
        usedSamples = totalPoints

    # first, check if this downsampling has already been done before
    existingHashCheck = cache.findHashArray("name", inputHashCode,
                                            "downsample")

    if existingHashCheck:
        logging.info(
            f'existing samples: {existingHashCheck["samples"]}, usedSamples: {usedSamples}'
        )

    # Check if raw length is already less than requested downsample rate.
    #   If it is, use that, otherwise, resample.
    if (existingHashCheck is not None
            and existingHashCheck["samples"] == usedSamples):
        logger.info('Using existing downsampled hash')
        outputArray = existingHashCheck["data"]

    else:
        logger.info('Generating new downsampled hash')
        try:

            if algorithm == "simple":
                logging.debug(f'Generating downsample using simple(samples={usedSamples})')

                outputArray = simple_downsample(inputArray, samples)

            elif algorithm == "spanning":
                logging.debug(f'Generating downsample using spanning(samples={usedSamples})')

                if inputArray.ndim == 1:
                    inputList = [inputArray.tolist()]
                else:
                    inputList = inputArray.T.tolist()
                mask_, array_ = mask_spanning_subset(inputList, usedSamples)
                outputArray = inputArray[mask_]

            else:
                logging.warning(
                    "Unknown downsampling algorithm: {algorithm}".format(
                        algorithm=algorithm))
                outputArray = inputArray

        except BaseException:
            logging.warning(
                "downsample - failed to downsample.\n\n{trace}".format(
                    trace=traceback.format_exc()))
            outputArray = inputArray

        finally:
            # Hash the downsampled output, using the hash of the input in place of the name.
            #   Later look up using this, w.r.t origin data
            outputHash = cache.hashArray(inputHashCode, outputArray, "downsample")

    logging.debug(f'Downsample size: {outputArray.size}')

    return outputArray
