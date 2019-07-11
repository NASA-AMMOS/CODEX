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

import base64
import numpy as np
import scipy

import codex_hash
import codex_doctest
import codex_system

def get_data_metrics(msg, result):
    '''
    Inputs:

    Outputs:

    Notes:

    Examples:

    >>> testData = codex_doctest.doctest_get_data()

    >>> message = {'routine': 'arrange', 'hashType': 'feature', 'activity': 'metrics', 'name': ['TiO2'], 'cid': '8vrjn'}
    >>> result = get_data_metrics(message, {})
    '''

    data = codex_hash.findHashArray("name",  msg['name'][0], "feature")['data']
    codex_system.codex_log("getting data hash : "+ str(data))
    result = {}
    try:
        result['min'] = np.min(data)
        result['max'] = np.max(data)
        result['median'] = np.median(data)
        result['mean'] = np.mean(data)
        #result['mode'] = scipy.stats.mode(data)[0][0]
        result['std'] = np.std(data)
        result['var'] = np.var(data)
        result['name'] = msg['name'][0]

        #returns the downsample of the given row
        #fake stuff right now
        result['downsample'] = scipy.signal.resample(data,100).tolist()

        hist, bin_edges = np.histogram(data)
        result['hist_data'] = hist.tolist()
        result['hist_edges'] = bin_edges.tolist()
        result["status"] = "success"
    except:
        codex_system.codex_log("Error occured while computing feature data metrics")
        failureResult = {}
        failureResult["status"] = "failed"
        failureResult['name'] = msg['name'][0]
        return failureResult

    return result


def add_data(msg, result):
    '''
    Inputs:

    Outputs:

    Notes:

    Examples:

    '''
    hashType = msg['hashType']
    data = msg["data"]

    if (hashType == "selection"):
        maskLength = msg["length"]

        encoded = data.encode("ascii")
        decoded = base64.decodebytes(encoded)
        resultString = "".join(["{:08b}".format(x) for x in decoded])

        numResults = len(resultString)
        delta = abs(numResults - maskLength)

        maskTmp = np.zeros(numResults)

        for x in range(0, numResults):
            maskTmp[x] = int(resultString[x])

        mask = maskTmp[delta:]

        hashResult = codex_hash.hashArray(msg["name"], mask, "subset")

    elif (hashType == "feature"):
        virtual = msg['virtual'] if 'virtual' in msg else False
        hashResult = codex_hash.hashArray(msg["name"], np.asarray(data), "feature", virtual=virtual)
    else:
        result["message"] = 'failure'

    result['message'] = 'success'

    return result

def get_data(msg, result):
    '''
    Inputs:

    Outputs:

    Notes:

    Examples:

    >>> testData = codex_doctest.doctest_get_data()

    >>> message = {'routine': 'arrange', 'hashType': 'feature', 'activity': 'get', 'name': ['TiO2'], 'cid': '8vrjn'}
    >>> result = get_data(message, {})
    '''

    hashType = msg['hashType']
    names = msg["name"]
    data = []
    status = True

    for name in names:
        if (hashType == "selection"):
            array = codex_hash.findHashArray("name", name, "subset")
        elif (hashType == "feature"):
            array = codex_hash.findHashArray("name", name, "feature")
        elif (hashType == "downsample"):
            array = codex_hash.findHashArray("name", name, "downsample")
        elif (hashType == "label"):
            array = codex_hash.findHashArray("name", name, "label")
        else:
            result["message"] = 'failure'

        if not array:
            result["message"] = 'failed to find ' + name + ' feature '
            status = False
            break
        else:
            data.append(array['data'])

    if (status):
        return_data = np.column_stack(data)
        result['data'] = return_data.tolist()

    return result


def delete_data(msg, result):
    '''
    Inputs:

    Outputs:

    Notes:

    Examples:

    '''
    hashType = msg['hashType']
    name = msg["name"]

    if (hashType == "selection"):
        status = codex_hash.deleteHashName(name, "subset")
    elif (hashType == "feature"):
        status = codex_hash.deleteHashName(name, "feature")
    elif (hashType == "downsample"):
        status = codex_hash.deleteHashName(name, "downsample")
    elif (hashType == "label"):
        status = codex_hash.deleteHashName(name, "label")
    else:
        result["message"] = 'failure'
        status = False

    if (status == True):
        result['message'] = 'success'
    else:
        result['message'] = 'failure'

    return result


def update_data(msg, result):
    '''
    Inputs:

    Outputs:

    Notes:

    Examples:

    '''
    hashType = msg['hashType']
    field = msg["field"]
    old = msg["old"]
    new = msg["new"]

    if (hashType == "selection"):
        status = codex_hash.hashUpdate(field, new, old, "subset")
    elif (hashType == "feature"):
        status = codex_hash.hashUpdate(field, new, old, "feature")
    elif (hashType == "downsample"):
        status = codex_hash.hashUpdate(field, new, old, "downsample")
    elif (hashType == "label"):
        status = codex_hash.hashUpdate(field, new, old, "label")
    else:
        result["message"] = 'failure'
        status = False

    if (status == True):
        result['message'] = 'success'
    else:
        result['message'] = 'failure'

    return result

if __name__ == "__main__":

    codex_doctest.run_codex_doctest()

