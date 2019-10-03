'''
Author: Jack Lightholder
Date  : 2/15/18

Brief : System monitors for CODEX

Notes :

'''
import inspect
import os
import sys
import math
import gc
import psutil
import logging

import numpy as np

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

def get_featureList(featureList):
    '''
    Inputs:
        featureList - list - list of features to be analyzed

    Outputs:
        featureList - list - list of feature to be analyzed (pass-through)

    '''
    return featureList


def string2token(feature_data):
    '''
    Inuputs:
        feature_data - numpy array - feature column, of strings

    Outputs:
         feature_data - numpy array - feature column,
            of tokenized strings, as integers

    '''
    feature_data_str = feature_data.astype(str)
    feature_data = np.zeros(feature_data_str.size)
    unique = np.unique(feature_data_str)
    tokenMap = {}
    for x in range(0, unique.size):
        tokenMap[str(unique[x])] = x

    for x in range(0, feature_data_str.size):
        feature_data[x] = tokenMap[str(feature_data_str[x])]

    return feature_data

def get_codex_memory_usage():
    '''
    Inputs:

    Outputs:

    Notes:
        Value returned in MB

    '''
    process = psutil.Process(os.getpid())
    current_ram = int((process.memory_info().rss / 1024) / 1024)

    return current_ram


def codex_server_memory_check(verbose=False, session=None):
    '''
    Inputs:

    Outputs:

    Notes:
        Value returned in MB

    '''
    from api.sub.hash import get_cache # defer import to try to circumvent circular import

    cache = get_cache(session)
    allowed_ram = 4096
    current_ram = get_codex_memory_usage()

    if(verbose):
        logging.info("RAM Usage: " + str(current_ram) + "/" + str(allowed_ram))

    while(current_ram > allowed_ram):
        last_ram = current_ram
        status = cache.remove_stale_data()
        if(status != True):
            return

        current_ram = get_codex_memory_usage()

        if(verbose):
            logging.info("RAM Usage: " + str(current_ram) + "/" + str(allowed_ram))

        if(math.isclose(current_ram, last_ram, abs_tol=10)):
            return


