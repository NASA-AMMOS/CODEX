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
import logging
import random

import numpy as np

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.binning                 import ml_binning
from api.clustering              import clustering
from api.quality_scan            import ml_quality_scan
from api.dimmension_reduction    import ml_dimensionality_reduction
from api.endmember               import ml_endmember
from api.normalize               import ml_normalize
from api.peak_detection          import ml_peak_detect
from api.regression              import ml_regression
from api.segmentation            import ml_segmentation
from api.template_scan           import ml_template_scan
from api.classification          import ml_classification

from api.sub.system              import get_featureList
from api.sub.return_code         import logReturnCode
from api.sub.hash                import get_cache

def algorithm_call(msg, result):
    '''
    Inputs:

    Outputs:

    '''
    try:

        ch = get_cache(msg['sessionkey'])

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

        hashList = ch.feature2hashList(featureList)
        logReturnCode(inspect.currentframe())

        data = ch.mergeHashResults(hashList)
        logReturnCode(inspect.currentframe())
        inputHash = ch.hashArray('Merged', data, "feature")

        if (inputHash != None):
            logReturnCode(inspect.currentframe())
            inputHash = inputHash["hash"]

        if (downsampled != False):
            downsampled = int(downsampled)

        if (algorithmType == "binning"):
            result = ml_binning(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=ch)

        elif (algorithmType == "clustering"):
            result = ml_cluster(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=ch)

        elif (algorithmType == "data_quality_scan"):
            result = ml_quality_scan(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=ch)

        elif (algorithmType == "dimensionality_reduction"):
            result = ml_dimensionality_reduction(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=ch)

        elif (algorithmType == "endmember"):
            result = ml_endmember(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=ch)

        elif (algorithmType == "normalize"):
            result = ml_normalize(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=ch)

        elif (algorithmType == "peak_detect"):
            result = ml_peak_detect(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=ch)

        elif (algorithmType == "regression"):

            labelName = msg["labelName"]
            labelHash = ch.findHashArray("name", labelName, "feature")['hash']

            cross_val = msg["cross_val"]
            search_type = msg["search_type"]
            scoring = msg["scoring"]

            result = ml_regression(inputHash, hashList, subsetHashName, labelHash, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, session=ch)

        elif (algorithmType == "classification"):

            labelName = msg["labelName"]
            labelHash = ch.findHashArray("name", labelName, "feature")['hash']

            cross_val = msg["cross_val"]
            search_type = msg["search_type"]
            scoring = msg["scoring"]

            result = ml_classification(inputHash, hashList, subsetHashName, labelHash, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, session=ch)

        elif (algorithmType == "segment"):
            result = ml_segmentation(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session=ch)

        elif (algorithmType == "template_scan"):
            result = ml_template_scan(inputHash, hashList, subsetHashName, None, algorithmName, downsampled, parms, result, session=ch)

        else:
            result['message'] = "Cannot parse algorithmType"


    except:
        logging.warning(traceback.format_exc())

    return result




