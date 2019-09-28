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

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.sub.time_log import getComputeTimeEstimate

def get_time_estimate(msg, result):
    '''
    Inputs:

    Outputs:

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
        logging.warning(traceback.format_exc())

    return result


