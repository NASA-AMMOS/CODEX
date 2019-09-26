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

sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.codex_time_log import getComputeTimeEstimate
from api.sub.codex_system   import codex_log

def get_time_estimate(msg, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''
    try:
        
        algorithmType = msg['algorithmType']
        algorithmName = msg['algorithmName']
        numSamples = int(msg['numSamples'])

        # TODO - extend computeTimeEstimate to factor in number of features
        numFeatures = int(msg['numFeatures'])

        eta = getComputeTimeEstimate(algorithmType, algorithmName, numSamples)

        result['eta'] = eta
        result['message'] = 'success'
        result['algorithmType'] = msg['algorithmType']
        result['algorithmName'] = msg['algorithmName']
        result['numSamples'] = int(msg['numSamples'])
        result['numFeatures'] = int(msg['numFeatures'])

    except:
        codex_log(traceback.format_exc())

    return result


if __name__ == "__main__":

    from api.sub.codex_doctest import run_codex_doctest
    run_codex_doctest()
