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
sys.path.insert(1, os.path.join(CODEX_ROOT, 'api'))
sys.path.insert(1, os.path.join(CODEX_ROOT, 'api/sub'))

import traceback
import base64
import numpy as np
import scipy
import scipy.signal
import math

import codex_doctest
from codex_hash import get_cache
import codex_system

def get_data_metrics(msg, result):
    '''
    Inputs:

    Outputs:

    Notes: Currently just ignores any NaNs when calculating metrics

    Examples:

    >>> from codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

    >>> message = {'routine': 'arrange', 'hashType': 'feature', 'activity': 'metrics', 'name': ['TiO2'], 'cid': '8vrjn', 'sessionkey': DOCTEST_SESSION}
    >>> result = get_data_metrics(message, {})
    '''
    codex_hash = get_cache(msg['sessionkey'])

    for feature_name in msg['name']:

        hashLib = codex_hash.findHashArray("name",  feature_name, "feature")

        if hashLib:
            data = hashLib['data']
        else:
            codex_system.codex_log("Failed to return hashLib")
            result = {}
            result["status"] = "failed"
            result['name'] = feature_name   
            yield result

        try:

            result['min'] = np.nanmin(data)
            result['max'] = np.nanmax(data)
            result['median'] = np.nanmedian(data)
            result['mean'] = np.nanmean(data)
            result['std'] = np.nanstd(data)
            result['var'] = np.nanvar(data)
            result['name'] = feature_name
            result['downsample'] = scipy.signal.resample(data[~np.isnan(data)],100).tolist()
            hist, bin_edges = np.histogram(data[~np.isnan(data)])
            result['hist_data'] = hist.tolist()
            result['hist_edges'] = bin_edges.tolist()
            result["status"] = "success"
            codex_system.codex_log("Successfully retrieved {f} metrics".format(f=feature_name))

        except:
            codex_system.codex_log("Error occured while computing feature data metrics")
            result["status"] = "failed"
            result['name'] = feature_name
    
        yield result


def add_data(msg, result):
    '''
    Inputs:
        msg (dict)     - request to add data from the frontend
    Outputs:
        results (dict) - response
    Notes:
        Data must be a 1D array!
    Examples:
    >>> from codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

    >>> message = {'routine': 'arrange', 'hashType': 'feature', 'activity': 'add', 'name': 'TiO2', 'data': [1, 2, 3, 4], 'sessionkey': DOCTEST_SESSION}
    >>> results = add_data


    '''
    codex_hash = get_cache(msg['sessionkey'])

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
        # assert the data is 1D
        np_data = np.asarray(data);
        assert np_data.ndim == 1;

        virtual = msg['virtual'] if 'virtual' in msg else False
        hashResult = codex_hash.hashArray(msg["name"], np_data, "feature", virtual=virtual)


    else:
        result["message"] = 'failure'

    result['message'] = 'success'

    return result

def get_data(msg, nan, inf, ninf, result):
    '''
    Inputs:

    Outputs:

    Notes: TODO - need to validate inf/-inf
           TODO - nested ndarray structure should be fixed.  Need to coordiante with client parser.  Commented code for future non-nested ndarray

    Examples:

    >>> from codex_hash import DOCTEST_SESSION
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> testData = codex_doctest.doctest_get_data(session=codex_hash)

    >>> message = {'routine': 'arrange', 'hashType': 'feature', 'activity': 'get', 'name': ['TiO2','FeOT'], 'cid': '8vrjn', 'sessionkey': DOCTEST_SESSION}
    >>> result = get_data(message, 1, 2, 3, {})
    '''
    codex_hash = get_cache(msg['sessionkey'])

    hashType = msg['hashType']
    names = msg["name"]
    #data = np.array([])
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
            result["message"] = 'failed to find {name} feature.'.format(name=name)
            status = False
            break
        else:
            #data = np.vstack([data, array['data']]) if data.size else array['data']
            data.append(array['data'])

    if (status):
        data = np.column_stack(data)
        x_, y_ = data.shape
        data = data.astype(float)
        for x in range(0, x_):
            if(np.isnan(data[x][0])):
                data[x][0] = nan
            elif(np.isinf(data[x][0]) and data[x][0] > 0):
                data[x][0] = inf
            elif(np.isinf(data[x][0]) and data[x][0] < 0):
                data[x][0] = ninf

        #data[data == np.float64("nan")] = nan
        #data[data == np.float64("inf")] = inf
        #data[data == np.float64("-inf")] = ninf

        result['data'] = data.tolist()
        print(data.tolist())

    return result


def delete_data(msg, result):
    '''
    Inputs:

    Outputs:

    Notes:

    Examples:

    '''
    codex_hash = get_cache(msg['sessionkey'])

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
    codex_hash = get_cache(msg['sessionkey'])

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

