'''
Author: Jack Lightholder
Date  : 7/19/17

Brief : 

Notes :

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import inspect

sys.path.insert(1, os.getenv('CODEX_ROOT'))

import api.codex_1d_binning
import api.codex_clustering_api
import api.codex_data_quality_scan_api
import api.codex_dimmension_reduction_api
import api.codex_endmembers
import api.codex_normalize
import api.codex_peak_detection_api
import api.codex_regression_api
import api.codex_segmentation_api
import api.codex_template_scan_api
import api.codex_classification_api

import api.sub.codex_system
import api.sub.codex_return_code

from api.sub.codex_hash import get_cache

def algorithm_call(msg, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''
    codex_hash = get_cache(msg['sessionkey'])


    parms = msg['parameters']
    downsampled = msg["downsampled"]
    algorithmName = msg['algorithmName']
    algorithmType = msg["algorithmType"]

    featureList = msg["dataFeatures"]
    featureList = codex_system.get_featureList(featureList)

    subsetHashName = msg["dataSelections"]
    if (subsetHashName != []):
        subsetHashName = subsetHashName[0]
    else:
        subsetHashName = None

    hashList = codex_hash.feature2hashList(featureList)
    codex_return_code.logReturnCode(inspect.currentframe())

    data = codex_hash.mergeHashResults(hashList)
    codex_return_code.logReturnCode(inspect.currentframe())
    inputHash = codex_hash.hashArray('Merged', data, "feature")

    if (inputHash != None):
        codex_return_code.logReturnCode(inspect.currentframe())
        inputHash = inputHash["hash"]

    if (downsampled != False):
        downsampled = int(downsampled)

    if (algorithmType == "binning"):
        result = codex_1d_binning.ml_binning(inputHash, hashList,
                subsetHashName, algorithmName,
                downsampled, parms, result, session=codex_hash)

    elif (algorithmType == "clustering"):
        result = codex_clustering_api.ml_cluster(inputHash, hashList,
                subsetHashName, algorithmName,
                downsampled, parms, result, session=codex_hash)

    elif (algorithmType == "data_quality_scan"):
        result = codex_data_quality_scan_api.ml_quality_scan(inputHash, hashList, 
                subsetHashName, algorithmName, downsampled,
                parms, result, session=codex_hash)

    elif (algorithmType == "dimensionality_reduction"):
        result = codex_dimmension_reduction_api.ml_dimensionality_reduction(inputHash, hashList, 
                subsetHashName, algorithmName, downsampled,
                parms, result, session=codex_hash)

    elif (algorithmType == "endmember"):
        result = codex_endmembers.ml_endmember(inputHash, hashList,
                subsetHashName, algorithmName,
                downsampled, parms, result, session=codex_hash)

    elif (algorithmType == "normalize"):
        result = codex_normalize.ml_normalize(inputHash, hashList,
                subsetHashName, algorithmName,
                downsampled, parms, result, session=codex_hash)

    elif (algorithmType == "peak_detect"):
        result = codex_peak_detection_api.ml_peak_detect(
            inputHash, hashList, subsetHashName, algorithmName, downsampled,
            parms, result, session=codex_hash)

    elif (algorithmType == "regression"):

        labelName = msg["labelName"]
        labelHash = codex_hash.findHashArray("name", labelName, "feature")['hash']

        cross_val = msg["cross_val"]
        search_type = msg["search_type"]
        scoring = msg["scoring"]

        result = codex_regression_api.ml_regression(
                inputHash, hashList, subsetHashName, labelHash, algorithmName,
                downsampled, parms, scoring, search_type, cross_val, result, session=codex_hash)

    elif (algorithmType == "classification"):

        labelName = msg["labelName"]
        labelHash = codex_hash.findHashArray("name", labelName, "feature")['hash']

        cross_val = msg["cross_val"]
        search_type = msg["search_type"]
        scoring = msg["scoring"]

        result = codex_classification_api.ml_classification(
                inputHash, hashList, subsetHashName, labelHash, algorithmName,
                downsampled, parms, scoring, search_type, cross_val, result, session=codex_hash)

    elif (algorithmType == "segment"):
        result = codex_segmentation_api.ml_segmentation(
            inputHash, hashList, subsetHashName, algorithmName, downsampled,
            parms, result, session=codex_hash)

    elif (algorithmType == "template_scan"):
        result = codex_template_scan_api.ml_template_scan(
                inputHash, hashList, subsetHashName, None, algorithmName, downsampled, parms, result, session=codex_hash)

    else:
        result['message'] = "Cannot parse algorithmType"

    return result



if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()





