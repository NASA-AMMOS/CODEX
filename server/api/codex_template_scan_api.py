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
# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

import traceback
import time
import math
from scipy.spatial.distance import euclidean
import numpy as np
from fastdtw import fastdtw
import inspect

# CODEX Support
import codex_downsample
import codex_system
import codex_doctest
import codex_time_log
import codex_return_code
import codex_hash
import codex_math
import codex_read_data_api

DEBUG = False


def ml_template_scan(
        inputHash,
        hashList,
        subsetHashName,
        templateHashName,
        algorithmName,
        downsampled,
        parms,
        result):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> testData = codex_doctest.doctest_get_data()

    # Missing algorithmType
    >>> result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "temp", False, {'num_templates': 1, 'scan_jump': 50}, {})
    Template hash name not given

    # Standard usage
    >>> result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "template", False, {'num_templates': 1, 'scan_jump': 50}, {})
    Template hash name not given

    # Incorrect num_templates
    >>> result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "template", False, {'num_templates': "String", 'scan_jump': 50}, {})
    Template hash name not given

    # Incorrect scan_jump
    >>> result = ml_template_scan(testData['inputHash'], testData['hashList'], None, None, "template", False, {'num_templates': 1, 'scan_jump': "String"}, {})
    Template hash name not given
    '''

    data = codex_hash.mergeHashResults(hashList)
    inputHash = codex_hash.hashArray('Merged', data, "feature")
    if(inputHash is not None):
        inputHash = inputHash["hash"]
    else:
        codex_system.codex_log("Feature hash failure in ml_cluster")
        result['message'] = "Feature hash failure in ml_cluster"
        return None

    if(subsetHashName is not None):
        subsetHash = codex_hash.findHashArray("name", subsetHashName, "subset")
        if(subsetHash is None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    if(templateHashName is not None):
        templateHash = codex_hash.findHashArray(
            "name", templateHashName, "subset")
        if(templateHash is None):
            templateHash = False
        else:
            templateHash = templateHash["hash"]
    else:
        codex_system.codex_log("Template hash name not given")
        return None

    if(algorithmName == 'template'):

        try:
            num_templates = int(parms['num_templates'])
        except BaseException:
            codex_system.codex_log("num_templates parameter not set")
            result['message'] = "num_templates parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            scan_jump = int(parms['scan_jump'])
        except BaseException:
            codex_system.codex_log("scan_jump parameter not set")
            result['message'] = "scan_jump parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return None

        try:
            result = codex_template_scan(
                inputHash,
                subsetHash,
                downsampled,
                templateHash,
                num_templates,
                scan_jump)
        except BaseException:
            codex_system.codex_log("Failed to run template scan algorithm")
            result['message'] = "Failed to run template scan algorithm"
            codex_system.codex_log(traceback.format_exc())
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
        scan_jump):
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

    Examples:

    '''
    codex_return_code.logReturnCode(inspect.currentframe())
    startTime = time.time()

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Error: codex_template_scan: inputHash not found.")
        return

    X = returnHash['data']

    if(subsetHash is not False):
        X = codex_hash.applySubsetMask(X, subsetHash)

    if(downsampled is not False):
        X = codex_downsample.downsample(X, percentage=downsampled)

    returnTemplateHash = codex_hash.findHashArray(
        "hash", templateHash, "feature")
    if(returnTemplateHash is None):
        print("Error: codex_template_scan: templateHash not found.")
        return

    X = codex_math.codex_impute(X)
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
    codex_time_log.logTime("template_scan", "dtw", computeTime, len(X), X.ndim)

    uniques = np.unique(similarAreas)
    locationsFound = len(uniques) - 1
    dictionary = {"templatesFound": locationsFound, 'indexes': similarAreas}

    return dictionary


if __name__ == "__main__":

    codex_doctest.run_codex_doctest()
