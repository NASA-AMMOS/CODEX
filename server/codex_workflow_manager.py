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

from api.codex_workflow import explain_this
from api.codex_workflow import find_more_like_this
from api.codex_workflow import general_classifier
from api.sub.codex_return_code import logReturnCode
from api.sub.codex_system import get_featureList
from api.sub.codex_hash import get_cache

def workflow_call(msg, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''
    codex_hash = get_cache(msg['sessionkey'])

    if(msg['workflow'] == "explain_this"):
        featureList = msg["dataFeatures"]
        featureList = get_featureList(featureList)

        dataSelections = msg["dataSelections"]

        hashList = codex_hash.feature2hashList(featureList)
        logReturnCode(inspect.currentframe())

        data = codex_hash.mergeHashResults(hashList)
        logReturnCode(inspect.currentframe())
        inputHash = codex_hash.hashArray('Merged', data, "feature")

        if (inputHash != None):
            logReturnCode(inspect.currentframe())
            inputHash = inputHash["hash"]

        result = explain_this(inputHash, featureList, dataSelections, result, session=codex_hash)
    elif (msg['workflow'] == "find_more_like_this"):
        featureList = msg["featureList"]
        featureList = get_featureList(featureList)

        dataSelections = msg["dataSelections"]
        similarityThreshold = float(msg["similarityThreshold"])

        hashList = codex_hash.feature2hashList(featureList)
        logReturnCode(inspect.currentframe())

        data = codex_hash.mergeHashResults(hashList)
        logReturnCode(inspect.currentframe())
        inputHash = codex_hash.hashArray('Merged', data, "feature")

        if (inputHash != None):
            logReturnCode(inspect.currentframe())
            inputHash = inputHash["hash"]

        result = find_more_like_this(inputHash, featureList, dataSelections, similarityThreshold, result, session=codex_hash)
    elif (msg['workflow'] == "general_classifier"):
        featureList = msg["featureList"]
        featureList = get_featureList(featureList)

        dataSelections = msg["dataSelections"]
        similarityThreshold = msg["similarityThreshold"]

        hashList = codex_hash.feature2hashList(featureList)
        logReturnCode(inspect.currentframe())

        data = codex_hash.mergeHashResults(hashList)
        logReturnCode(inspect.currentframe())
        inputHash = codex_hash.hashArray('Merged', data, "feature")

        if (inputHash != None):
            logReturnCode(inspect.currentframe())
            inputHash = inputHash["hash"]

        result = general_classifier(inputHash, featureList, dataSelections, similarityThreshold, result, session=codex_hash)
    else:
        result['message'] = "Cannot parse workflow"

    result['message'] = 'success'
    return result


if __name__ == "__main__":

    from codex_doctest import run_codex_doctest
    run_codex_doctest()



