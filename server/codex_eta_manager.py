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

import codex_time_log
import codex_doctest

def get_time_estimate(msg, result):

	algorithmType = msg['algorithmType']
	algorithmName = msg['algorithmName']
	numSamples = int(msg['numSamples'])

	# TODO - extend computeTimeEstimate to factor in number of features
	numFeatures = int(msg['numFeatures'])

	eta = codex_time_log.getComputeTimeEstimate(algorithmType, algorithmName, numSamples)

	result['eta'] = eta
	result['message'] = 'success'
	result['algorithmType'] = msg['algorithmType']
	result['algorithmName'] = msg['algorithmName']
	result['numSamples'] = int(msg['numSamples'])
	result['numFeatures'] = int(msg['numFeatures'])

	return result


if __name__ == "__main__":

    codex_doctest.run_codex_doctest()
