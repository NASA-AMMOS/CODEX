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

import numpy as np

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

# CODEX Support
from api.sub.codex_yaml        import codex_read_yaml

def get_featureList(featureList):
    '''
    Inputs:
        featureList - list - list of features to be analyzed

    Outputs:
        featureList - list - list of feature to be analyzed (pass-through)

    Examples:
        >>> featureList = ['TiO2','FeOT','SiO2','Total']
        >>> output = get_featureList(featureList)
        >>> if(featureList == output):
        ... 	print("Success")
        Success

    '''
    #from api.sub.codex_return_code import logReturnCode
    #logReturnCode(inspect.currentframe()) # TODO - need to figure out why this does not work

    return featureList


def string2token(feature_data):
    '''
    Inuputs:
        feature_data - numpy array - feature column, of strings

    Outputs:
         feature_data - numpy array - feature column,
            of tokenized strings, as integers

    Examples:
        >>> stringArray = np.array(["one","two","three"])
        >>> result = string2token(stringArray)
        >>> print(len(result))
        3

    Notes:

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


def string2Numpy(dataString):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> result = string2Numpy("1101110101")
    >>> print(result)
    [1 1 0 1 1 1 0 1 0 1]

    >>> string2Numpy("311010101")
    ERROR: string2Numpy - unknown character
    '''
    samples = len(dataString)
    outData = np.zeros(samples, dtype=int)
    count = 0

    for char in dataString:

        if(char == '1'):
            outData[count] = 1
        elif(char == '0'):
            outData[count] = 0
        else:
            print("ERROR: string2Numpy - unknown character")
            return None

        count += 1

    return outData


def codex_log(message, verbose=True):
    '''
    Inputs:

    Outputs:

    Examples:

    '''
    try:
        f = open(CODEX_ROOT + "/codex.log", "a")
    except BaseException:
        f = open(CODEX_ROOT + "/codex.log", 'w+')

    if(verbose):
        print(message)

    f.write(message + "\n")
    f.close()


def get_setting(settingName):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> result = get_setting("unit_test")
    >>> print(result)
    500
    '''

    yaml = codex_read_yaml(CODEX_ROOT + "/codex_settings.yaml")
    return yaml[settingName]


def get_codex_memory_usage():
    '''
    Inputs:

    Outputs:

    Notes:
        Value returned in MB

    Examples:
    >>> memory = get_codex_memory_usage()
    >>> if(memory > 0):
    ... 	print("Success")
    Success

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

    Examples:
    >>> from api.sub.codex_hash import DOCTEST_SESSION, get_cache
    >>> codex_hash = get_cache(DOCTEST_SESSION)
    >>> codex_server_memory_check(session=codex_hash)

    '''
    from api.sub.codex_hash import get_cache # defer import to try to circumvent circular import
    codex_hash = get_cache(session)
    allowed_ram = get_setting("working_ram")
    current_ram = get_codex_memory_usage()

    if(verbose):
        print("RAM Usage: " + str(current_ram) + "/" + str(allowed_ram))

    while(current_ram > allowed_ram):
        last_ram = current_ram
        status = codex_hash.remove_stale_data()
        if(status != True):
            return

        current_ram = get_codex_memory_usage()

        if(verbose):
            print("RAM Usage: " + str(current_ram) + "/" + str(allowed_ram))

        if(math.isclose(current_ram, last_ram, abs_tol=10)):
            return


if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()

