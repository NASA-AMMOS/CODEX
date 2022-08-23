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
import traceback
import logging
import scipy

import numpy as np

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.sub.hash import get_cache
from api.sub.downsample import simple_downsample


def get_data_metrics(msg, result):
    '''
    Inputs:

    Outputs:

    Notes: Currently just ignores any NaNs when calculating metrics

    '''
    try:
        ch = get_cache(msg['sessionkey'], timeout=None)

        for feature_name in msg['name']:

            hashLib = ch.findHashArray("name", feature_name, "feature")

            if hashLib:
                data = hashLib['data']
            else:
                logging.warning("Failed to return hashLib")
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
                result['length'] = data.shape[0]
                try:
                    result['downsample'] = simple_downsample(
                        data[~np.isnan(data)], 100).tolist()
                except Exception as e:
                    import traceback
                    traceback.print_exc()
                hist, bin_edges = np.histogram(data[~np.isnan(data)])
                result['hist_data'] = hist.tolist()
                result['hist_edges'] = bin_edges.tolist()
                result["status"] = "success"
                logging.info("Successfully retrieved {f} metrics".format(
                    f=feature_name))

            except:
                logging.warning(
                    "Error occured while computing feature data metrics")
                logging.warning(traceback.format_exc())
                result["status"] = "failed"
                result['name'] = feature_name

            yield result
    except:
        logging.warning(traceback.format_exc())
        yield result


def add_data(msg, result):
    '''
    Inputs:
        msg (dict)     - request to add data from the frontend
    Outputs:
        results (dict) - response
    Notes:
        Data must be a 1D array!

    '''
    try:
        ch = get_cache(msg['sessionkey'], timeout=None)

        hashType = msg['hashType']

        # assert the data is 1D
        np_data = np.asarray(msg['data'])
        assert np_data.ndim == 1

        if (hashType == "selection"):

            hashResult = ch.hashArray(msg["name"], np_data, "subset")

        elif (hashType == "feature"):

            virtual = msg['virtual'] if 'virtual' in msg else False
            hashResult = ch.hashArray(
                msg["name"], np_data, "feature", virtual=virtual)

        else:
            result["message"] = 'failure'
            return result

        result['message'] = 'success'

    except:
        logging.warning(traceback.format_exc())

    return result


def get_data(msg, result):
    '''
    Inputs:

    Outputs:

    Notes: TODO - need to validate inf/-inf
           TODO - nested ndarray structure should be fixed.  Need to coordiante with client parser.  Commented code for future non-nested ndarray

    '''
    try:
        ch = get_cache(msg['sessionkey'], timeout=None)

        hashType = msg['hashType']
        names = msg["name"]
        downsample = msg['downsample'] if 'downsample' in msg else None
        #data = np.array([])
        data = []
        status = True

        for name in names:
            if (hashType == "selection"):
                array = ch.findHashArray("name", name, "subset")
            elif (hashType == "feature"):
                array = ch.findHashArray("name", name, "feature")
            elif (hashType == "downsample"):
                array = ch.findHashArray("name", name, "downsample")
            elif (hashType == "label"):
                array = ch.findHashArray("name", name, "label")
            else:
                result["message"] = 'failure'

            if not array:
                result["message"] = 'failed to find {name} feature.'.format(
                    name=name)
                status = False
                break
            else:
                #data = np.vstack([data, array['data']]) if data.size else array['data']

                # downsample if requested
                if downsample is not None:
                    array['data'] = simple_downsample(
                        np.array(array['data']), int(downsample))
                # else:
                #     array['data'] = simple_downsample(
                #         np.array(array['data']), 5000)

                data.append(array['data'])

        if (status):
            data = np.column_stack(data)
            x_, y_ = data.shape
            data = data.astype(float)
            for x in range(0, x_):
                if (np.isnan(data[x][0])):
                    data[x][0] = ch.get_nan()
                elif (np.isinf(data[x][0]) and data[x][0] > 0):
                    data[x][0] = ch.get_inf()
                elif (np.isinf(data[x][0]) and data[x][0] < 0):
                    data[x][0] = ch.get_ninf()

            #data[data == np.float64("nan")] = nan
            #data[data == np.float64("inf")] = inf
            #data[data == np.float64("-inf")] = ninf

            result['data'] = data.tolist()

    except:
        logging.warning(traceback.format_exc())

    return result


def delete_data(msg, result):
    '''
    Inputs:

    Outputs:

    '''
    try:
        ch = get_cache(msg['sessionkey'], timeout=None)

        hashType = msg['hashType']
        name = msg["name"]

        if (hashType == "selection"):
            status = ch.deleteHashName(name, "subset")
        elif (hashType == "feature"):
            status = ch.deleteHashName(name, "feature")
        elif (hashType == "downsample"):
            status = ch.deleteHashName(name, "downsample")
        elif (hashType == "label"):
            status = ch.deleteHashName(name, "label")
        else:
            result["message"] = 'failure'
            status = False

        if (status == True):
            result['message'] = 'success'
        else:
            result['message'] = 'failure'

    except:
        logging.warning(traceback.format_exc())

    return result


def update_data(msg, result):
    '''
    Inputs:

    Outputs:

    '''
    try:
        ch = get_cache(msg['sessionkey'], timeout=None)

        hashType = msg['hashType']
        field = msg["field"]
        old = msg["old"]
        new = msg["new"]

        if (hashType == "selection"):
            status = ch.hashUpdate(field, new, old, "subset")
        elif (hashType == "feature"):
            status = ch.hashUpdate(field, new, old, "feature")
        elif (hashType == "downsample"):
            status = ch.hashUpdate(field, new, old, "downsample")
        elif (hashType == "label"):
            status = ch.hashUpdate(field, new, old, "label")
        else:
            result["message"] = 'failure'
            status = False

        if (status == True):
            result['message'] = 'success'
        else:
            result['message'] = 'failure'

    except:
        logging.warning(traceback.format_exc())

    return result
