'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Segmentation algorithms, formatted for CODEX

Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import sys
import os
import traceback
import time
import math
import inspect
import logging

import numpy as np

from scipy.spatial.distance import euclidean
from fastdtw                import fastdtw

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.downsample        import downsample
from api.sub.time_log          import logTime
from api.sub.return_code       import logReturnCode
from api.sub.codex_math        import impute
from api.sub.hash              import get_cache

def ml_template_scan(
        inputHash,
        hashList,
        subsetHashName,
        templateHashName,
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

    if(templateHashName is not None):
        templateHash = ch.findHashArray("name", templateHashName, "subset")
        if(templateHash is None):
            templateHash = False
        else:
            templateHash = templateHash["hash"]
    else:
        logging.warning("Template hash name not given")
        return None

    if(algorithmName == 'template'):

        try:
            num_templates = int(parms['num_templates'])
        except BaseException:
            logging.warning("num_templates parameter not set")
            result['message'] = "num_templates parameter not set"
            logging.warning(traceback.format_exc())
            return None

        try:
            scan_jump = int(parms['scan_jump'])
        except BaseException:
            logging.warning("scan_jump parameter not set")
            result['message'] = "scan_jump parameter not set"
            logging.warning(traceback.format_exc())
            return None

        try:
            result = codex_template_scan(
                inputHash,
                subsetHash,
                downsampled,
                templateHash,
                num_templates,
                scan_jump,
                session=ch)
        except BaseException:
            logging.warning("Failed to run template scan algorithm")
            result['message'] = "Failed to run template scan algorithm"
            logging.warning(traceback.format_exc())
            return None

    else:
        result['message'] = "Cannot find requested clustering algorithm"

    return result


def codex_template_scan(
        inputHash,
        subsetHash,
        downsampled,
        templateHash,
        num_templates,
        scan_jump,
        session=None):
    '''
    Inputs:
        inputHash (string)         - hash representing single feature
        subsetHash (False, string) - hash representing subselection mask
        downsampled (Flase, int)   - downsample metric, or False for no downsampling
        templateHash (string)      - hash representing template to compare against
        num_templates (int)        - number of similar areas to return
        scan_jump (int)            - amount of samples to jump between template comparisons

    Outputs:
        templateFound (int)        - number of templates successfully found
        indexes  (array)           - mask of template matches. 0 if not similar, 1 if in best template match, 2 if in next, etc.

    '''
    ch = get_cache(session)

    logReturnCode(inspect.currentframe())
    startTime = time.time()

    returnHash = ch.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        logging.warning("Error: codex_template_scan: inputHash not found.")
        return

    X = returnHash['data']

    if(subsetHash is not False):
        X = ch.applySubsetMask(X, subsetHash)

    if(downsampled is not False):
        X = downsample(X, percentage=downsampled, session=ch)

    returnTemplateHash = ch.findHashArray("hash", templateHash, "feature")
    if(returnTemplateHash is None):
        logging.warning("Error: codex_template_scan: templateHash not found.")
        return

    X = impute(X)
    y = returnTemplateHash['data']

    templateLength = len(y)
    seriesLength = len(X)
    similarAreas = np.zeros(seriesLength)

    for a in range(1, num_templates + 1):

        lowestDistance = math.inf
        lowestIndex = 0

        seriesLength = len(X)

        for x in range(0, seriesLength - templateLength + 1, scan_jump):

            X_ = X[0 + x:templateLength + x]

            distance, path = fastdtw(X_, y, radius=10, dist=euclidean)

            if(distance < lowestDistance):
                alreadyUsed = False
                for z in range(x, x + templateLength):
                    if(similarAreas[z] != 0):
                        alreadyUsed = True
                if(alreadyUsed == False):
                    lowestDistance = distance
                    lowestIndex = x

        for b in range(lowestIndex, lowestIndex + templateLength):
            similarAreas[b] = a

    endTime = time.time()
    computeTime = endTime - startTime
    logTime("template_scan", "dtw", computeTime, len(X), X.ndim)

    uniques = np.unique(similarAreas)
    locationsFound = len(uniques) - 1
    dictionary = {"templatesFound": locationsFound, 'indexes': similarAreas}

    return dictionary


