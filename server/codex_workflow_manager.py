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

import inspect
import codex_workflow
import codex_doctest
import codex_return_code
import codex_system
import codex_hash

def workflow_call(msg, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''
    if(msg['workflow'] == "explain_this"):
        featureList = msg["dataFeatures"]
        featureList = codex_system.get_featureList(featureList)

        dataSelections = msg["dataSelections"]

        hashList = codex_hash.feature2hashList(featureList)
        codex_return_code.logReturnCode(inspect.currentframe())

        data = codex_hash.mergeHashResults(hashList)
        codex_return_code.logReturnCode(inspect.currentframe())
        inputHash = codex_hash.hashArray('Merged', data, "feature")

        if (inputHash != None):
            codex_return_code.logReturnCode(inspect.currentframe())
            inputHash = inputHash["hash"]

        result = codex_workflow.explain_this(inputHash, featureList, dataSelections, result)
    elif (msg['workflow'] == "find_more_like_this"):
        featureList = msg["featureList"]
        featureList = codex_system.get_featureList(featureList)

        dataSelections = msg["dataSelections"]

        hashList = codex_hash.feature2hashList(featureList)
        codex_return_code.logReturnCode(inspect.currentframe())

        data = codex_hash.mergeHashResults(hashList)
        codex_return_code.logReturnCode(inspect.currentframe())
        inputHash = codex_hash.hashArray('Merged', data, "feature")

        if (inputHash != None):
            codex_return_code.logReturnCode(inspect.currentframe())
            inputHash = inputHash["hash"]

        result = codex_workflow.find_more_like_this(inputHash, featureList, dataSelections, result)
    elif (msg['workflow'] == "general_classifier"):
        featureList = msg["featureList"]
        featureList = codex_system.get_featureList(featureList)

        dataSelections = msg["dataSelections"]

        hashList = codex_hash.feature2hashList(featureList)
        codex_return_code.logReturnCode(inspect.currentframe())

        data = codex_hash.mergeHashResults(hashList)
        codex_return_code.logReturnCode(inspect.currentframe())
        inputHash = codex_hash.hashArray('Merged', data, "feature")

        if (inputHash != None):
            codex_return_code.logReturnCode(inspect.currentframe())
            inputHash = inputHash["hash"]

        result = codex_workflow.general_classifier(inputHash, featureList, dataSelections, result)
    else:
        result['message'] = "Cannot parse workflow"

    result['message'] = 'success'
    return result


if __name__ == "__main__":

    codex_doctest.run_codex_doctest()



