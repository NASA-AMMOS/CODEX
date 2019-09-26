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

from api.binning                 import ml_binning
from api.clustering              import ml_cluster
from api.quality_scan            import ml_quality_scan
from api.dimmension_reduction    import ml_dimensionality_reduction
from api.endmember               import ml_endmember
from api.normalize               import ml_normalize
from api.peak_detection          import ml_peak_detect
from api.regression              import ml_regression
from api.segmentation            import ml_segmentation
from api.template_scan           import ml_template_scan
from api.classification          import ml_classification

from api.sub.codex_system        import codex_log
from api.sub.codex_system        import get_featureList
from api.sub.return_code         import logReturnCode
from api.sub.codex_hash          import get_cache

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





