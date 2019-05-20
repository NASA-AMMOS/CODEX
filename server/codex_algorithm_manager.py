'''
Author: Jack Lightholder
Date  : 7/19/17

Brief : 

Notes :

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
## Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')

import sys
sys.path.insert(1, CODEX_ROOT + '/api/')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

import codex_1d_binning
import codex_clustering_api
import codex_data_quality_scan_api
import codex_dimmension_reduction_api
import codex_endmembers
import codex_normalize
import codex_peak_detection_api
import codex_regression_api
import codex_segmentation_api
import codex_template_scan_api
import codex_classification_api

import codex_system
import codex_doctest
import codex_return_code
import codex_hash

def algorithm_call(msg, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''

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
    codex_return_code.logReturnCode("hashList = codex_hash.feature2hashList(featureList)")

    data = codex_hash.mergeHashResults(hashList)
    codex_return_code.logReturnCode("data = codex_hash.mergeHashResults(hashList)")
    inputHash = codex_hash.hashArray('Merged', data, "feature")

    if (inputHash != None):
        codex_return_code.logReturnCode('codex_hash.hashArray("Merged", data, "feature")')
        inputHash = inputHash["hash"]

    if (downsampled != False):
        downsampled = int(downsampled)

    if (algorithmType == "binning"):
        result = codex_1d_binning.ml_binning(inputHash, hashList,
                                             subsetHashName, algorithmName,
                                             downsampled, parms, result)

    elif (algorithmType == "clustering"):
        result = codex_clustering_api.ml_cluster(inputHash, hashList,
                                                 subsetHashName, algorithmName,
                                                 downsampled, parms, result)

    elif (algorithmType == "data_quality_scan"):
        result = codex_data_quality_scan_api.ml_quality_scan(inputHash, hashList, 
        										subsetHashName, algorithmName, downsampled,
            									parms, result)

    elif (algorithmType == "dimensionality_reduction"):
        result = codex_dimmension_reduction_api.ml_dimensionality_reduction(inputHash, hashList, 
        										subsetHashName, algorithmName, downsampled,
            									parms, result)

    elif (algorithmType == "endmember"):
        result = codex_endmembers.ml_endmember(inputHash, hashList,
                                               subsetHashName, algorithmName,
                                               downsampled, parms, result)

    elif (algorithmType == "normalize"):
        result = codex_normalize.ml_normalize(inputHash, hashList,
                                              subsetHashName, algorithmName,
                                              downsampled, parms, result)

    elif (algorithmType == "peak_detect"):
        result = codex_peak_detection_api.ml_peak_detect(
            inputHash, hashList, subsetHashName, algorithmName, downsampled,
            parms, result)

    elif (algorithmType == "regression"):

        labelName = msg["labelName"]
        labelHash = codex_hash.findHashArray("name", labelName, "feature")['hash']

        cross_val = msg["cross_val"]
        search_type = msg["search_type"]
        scoring = msg["scoring"]

        result = codex_regression_api.ml_regression(
            inputHash, hashList, subsetHashName, labelHash, algorithmName,
            downsampled, parms, scoring, search_type, cross_val, result)

    elif (algorithmType == "classification"):

        labelName = msg["labelName"]
        labelHash = codex_hash.findHashArray("name", labelName, "feature")['hash']

        cross_val = msg["cross_val"]
        search_type = msg["search_type"]
        scoring = msg["scoring"]

        result = codex_classification_api.ml_classification(
            inputHash, hashList, subsetHashName, labelHash, algorithmName,
            downsampled, parms, scoring, search_type, cross_val, result)

    elif (algorithmType == "segment"):
        result = codex_segmentation_api.ml_segmentation(
            inputHash, hashList, subsetHashName, algorithmName, downsampled,
            parms, result)

    elif (algorithmType == "template_scan"):
        result = codex_template_scan_api.ml_template_scan(
            inputHash, hashList, subsetHashName, None, algorithmName, downsampled, parms, result)

    else:
        result['message'] = "Cannot parse algorithmType"

    return result



if __name__ == "__main__":

    codex_doctest.run_codex_doctest()





