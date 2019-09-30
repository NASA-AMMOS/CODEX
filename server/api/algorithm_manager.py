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
from api.quality_scan            import quality_scan
from api.dimmension_reduction    import dimension_reduction
from api.endmember               import endmember
from api.normalize               import normalize
from api.peak_detection          import peak_detection
from api.regression              import regression
from api.segmentation            import segmentation
from api.template_scan           import template_scan
from api.classification          import classification

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
            subsetHashName = False

        try:
            labelName = msg["labelName"]
            labelHash = ch.findHashArray("name", labelName, "feature")['hash']
        except:
            labelHash = None

        try:
            cross_val = msg["cross_val"]
        except:
            cross_val = None

        try:
            search_type = msg["search_type"]
        except:
            search_type = 'direct'

        try:
            scoring = msg["scoring"]
        except:
            scoring = None


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
            pca = dimension_reduction(inputHash, hashList, labelHash, subsetHashName, "PCA", downsampled, {"n_components":2}, scoring, search_type, cross_val, result, ch).run()
            result =       clustering(inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, ch).run()
            result['data'] = pca['data']

        elif (algorithmType == "data_quality_scan"):
            result = quality_scan(inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, ch).run()

        elif (algorithmType == "dimensionality_reduction"):
            result = dimension_reduction(inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, ch).run()

        elif (algorithmType == "endmember"):
            result = endmember(inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, ch).run()

        elif (algorithmType == "normalize"):
            result = normalize(inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, ch).run()

        elif (algorithmType == "peak_detect"):
            result = peak_detection(inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, ch).run()

        elif (algorithmType == "regression"):
            result = regression(inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, ch).run()

        elif (algorithmType == "classification"):
            result = classification(inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, ch).run()

        elif (algorithmType == "segment"):
            result = segmentation(inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, ch).run()

        elif (algorithmType == "template_scan"):
            result = template_scan(inputHash, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, ch).run()

        else:
            result['message'] = "Cannot parse algorithmType"


    except:
        logging.warning(traceback.format_exc())

    return result




