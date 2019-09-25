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
import traceback

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.codex_1d_binning                  import ml_binning
from api.codex_clustering_api              import ml_cluster
from api.codex_data_quality_scan_api       import ml_quality_scan
from api.codex_dimmension_reduction_api    import ml_dimensionality_reduction
from api.codex_endmembers                  import ml_endmember
from api.codex_normalize                   import ml_normalize
from api.codex_peak_detection_api          import ml_peak_detect
from api.codex_regression_api              import ml_regression
from api.codex_segmentation_api            import ml_segmentation
from api.codex_template_scan_api           import ml_template_scan
from api.codex_classification_api          import ml_classification

from api.sub.codex_system                  import codex_log
from api.sub.codex_system                  import get_featureList
from api.sub.codex_return_code             import logReturnCode
from api.sub.codex_hash                    import get_cache

def algorithm_call(msg, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''
    try:

        codex_hash = get_cache(msg['sessionkey'])

        parms = msg['parameters']
        downsampled = msg["downsampled"]
        algorithmName = msg['algorithmName']
        algorithmType = msg["algorithmType"]

        featureList = msg["dataFeatures"]
        featureList = get_featureList(featureList)

        subsetHashName = msg["dataSelections"]
        if (subsetHashName != []):
            subsetHashName = subsetHashName[0]
        else:
            subsetHashName = None

        hashList = codex_hash.feature2hashList(featureList)
        logReturnCode(inspect.currentframe())

        data = codex_hash.mergeHashResults(hashList)
        logReturnCode(inspect.currentframe())
        inputHash = codex_hash.hashArray('Merged', data, "feature")

        if (inputHash != None):
            logReturnCode(inspect.currentframe())
            inputHash = inputHash["hash"]

        if (downsampled != False):
            downsampled = int(downsampled)

        if (algorithmType == "binning"):
            result = ml_binning(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=codex_hash)

        elif (algorithmType == "clustering"):
            result = ml_cluster(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=codex_hash)

        elif (algorithmType == "data_quality_scan"):
            result = ml_quality_scan(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=codex_hash)

        elif (algorithmType == "dimensionality_reduction"):
            result = ml_dimensionality_reduction(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=codex_hash)

        elif (algorithmType == "endmember"):
            result = ml_endmember(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=codex_hash)

        elif (algorithmType == "normalize"):
            result = ml_normalize(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=codex_hash)

        elif (algorithmType == "peak_detect"):
            result = ml_peak_detect(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=codex_hash)

        elif (algorithmType == "regression"):

            labelName = msg["labelName"]
            labelHash = codex_hash.findHashArray("name", labelName, "feature")['hash']

            cross_val = msg["cross_val"]
            search_type = msg["search_type"]
            scoring = msg["scoring"]

            result = ml_regression(inputHash, hashList, subsetHashName, labelHash, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, session=codex_hash)

        elif (algorithmType == "classification"):

            labelName = msg["labelName"]
            labelHash = codex_hash.findHashArray("name", labelName, "feature")['hash']

            cross_val = msg["cross_val"]
            search_type = msg["search_type"]
            scoring = msg["scoring"]

            result = ml_classification(inputHash, hashList, subsetHashName, labelHash, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, session=codex_hash)

        elif (algorithmType == "segment"):
            result = ml_segmentation(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=codex_hash)

        elif (algorithmType == "template_scan"):
            result = ml_template_scan(inputHash, hashList, subsetHashName, None, algorithmName, downsampled, parms, result, session=codex_hash)

        else:
            result['message'] = "Cannot parse algorithmType"


    except:
        codex_log(traceback.format_exc())

    return result



if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()





