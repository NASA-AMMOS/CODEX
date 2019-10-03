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

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.workflow              import explain_this
from api.workflow              import find_more_like_this
from api.workflow              import general_classifier
from api.sub.system            import get_featureList
from api.sub.hash              import get_cache

def workflow_call(msg, result):
    '''
    Inputs:

    Outputs:

    '''
    try:

        cache = get_cache(msg['sessionkey'])

        if(msg['workflow'] == "explain_this"):
            featureList = msg["dataFeatures"]
            featureList = get_featureList(featureList)

            dataSelections = msg["dataSelections"]

            hashList = cache.feature2hashList(featureList)

            data = cache.mergeHashResults(hashList)
            inputHash = cache.hashArray('Merged', data, "feature")

            if (inputHash != None):
                inputHash = inputHash["hash"]

            result = explain_this(inputHash, featureList, dataSelections, result, session=cache)
        elif (msg['workflow'] == "find_more_like_this"):
            featureList = msg["featureList"]
            featureList = get_featureList(featureList)

            dataSelections = msg["dataSelections"]
            similarityThreshold = float(msg["similarityThreshold"])

            hashList = cache.feature2hashList(featureList)

            data = cache.mergeHashResults(hashList)
            inputHash = cache.hashArray('Merged', data, "feature")

            if (inputHash != None):
                inputHash = inputHash["hash"]

            result = find_more_like_this(inputHash, featureList, dataSelections, similarityThreshold, result, session=cache)
        elif (msg['workflow'] == "general_classifier"):
            featureList = msg["featureList"]
            featureList = get_featureList(featureList)

            dataSelections = msg["dataSelections"]
            similarityThreshold = msg["similarityThreshold"]

            hashList = cache.feature2hashList(featureList)

            data = cache.mergeHashResults(hashList)
            inputHash = cache.hashArray('Merged', data, "feature")

            if (inputHash != None):
                inputHash = inputHash["hash"]

            result = general_classifier(inputHash, featureList, dataSelections, similarityThreshold, result, session=cache)
        else:
            result['message'] = "Cannot parse workflow"

        result['message'] = 'success'

    except:
        logging.warning(traceback.format_exc())

    return result




