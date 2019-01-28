from __future__ import print_function
import os
## Enviornment variable for setting CODEX root directory.
CODEX_ROOT  = os.getenv('CODEX_ROOT')
import sys
sys.path.insert(1,CODEX_ROOT + '/api/sub/')
import time, h5py
import cProfile, pstats
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from scipy import misc
from random import randint
from sklearn import cluster, datasets
from sklearn.neighbors import kneighbors_graph
from sklearn.preprocessing import StandardScaler
import pysptools.eea
import pysptools.eea.eea
import traceback

# CODEX Support
import codex_hash, codex_return_code
import codex_read_data_api
import codex_downsample
import codex_plot, codex_time_log
import codex_doctest, codex_system
import codex_math

DEBUG = False

def ml_endmember(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> (inputHash, hashList, template, labbelHash) = codex_doctest.doctest_get_data()

    # Missing algorithmType
    >>> result = ml_endmember(inputHash, hashList, None, "kmean", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {})
    Cannot find requested endmember algorithm

    >>> result = ml_endmember(inputHash, hashList, None, "ATGP", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {})

    >>> result = ml_endmember(inputHash, hashList, None, "PPI", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {})

    >>> result = ml_endmember(inputHash, hashList, None, "FIPPI", False, {'downsampled': 500, 'q':5, 'numSkewers':5}, {})
    WARNING: q must be <= to number of features

    >>> result = ml_endmember(inputHash, hashList, None, "FIPPI", False, {'downsampled': 500, 'q':4, 'numSkewers':5}, {})

    # inputHash == None
    >>> result = ml_endmember(inputHash, None, None, "FIPPI", False, {'downsampled': 500, 'q':4, 'numSkewers':5}, {})

    # q not set
    >>> result = ml_endmember(inputHash, hashList, None, "FIPPI", False, {'downsampled': 500, 'numSkewers':5}, {})
    q parameter not set
    Traceback (most recent call last):
    ...
    KeyError: 'q'
    <BLANKLINE>
    '''

    if(subsetHashName != None):
        subsetHash = codex_hash.findHashArray("name", subsetHashName,"subset")
        if(subsetHash == None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    try:
        q = int(parms['q'])	
    except:
        codex_system.codex_log("q parameter not set")
        result['message'] = "q parameter not set"
        codex_system.codex_log(traceback.format_exc())
        return result

    if(algorithmName == "ATGP"):
        try:
            result = codex_ATGP(inputHash, subsetHash, q, downsampled)
        except:
            codex_system.codex_log("Failed to run ATGP endmember algorithm")
            result['message'] = "Failed to run ATGP endmember algorithm"
            codex_system.codex_log(traceback.format_exc())
            return result

    elif(algorithmName == "FIPPI"):
        try:
            result = codex_FIPPI(inputHash, subsetHash, q, downsampled)
        except:
            codex_system.codex_log("Failed to run FIPPI endmember algorithm")
            result['message'] = "Failed to run FIPPI endmember algorithm"
            codex_system.codex_log(traceback.format_exc())
            return result

    elif(algorithmName == "PPI"):

        try:
            numSkewers = int(parms["numSkewers"])
        except:
            codex_system.codex_log("numSkewers parameter not set")
            result['message'] = "numSkewers parameter not set"
            codex_system.codex_log(traceback.format_exc())
            return result

        try:
            result = codex_PPI(inputHash, subsetHash, q, numSkewers, downsampled)
        except:
            codex_system.codex_log("Failed to run PPI endmember algorithm")
            result['message'] = "Failed to run PPI endmember algorithm"
            codex_system.codex_log(traceback.format_exc())
            return result

    else:
        codex_system.codex_log("Cannot find requested endmember algorithm")
        result['message'] = "Cannot find requested endmember algorithm"
        return result

    return result

def codex_ATGP(inputHash, subsetHash, q, downsampled):
    '''
    Inputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)
        q  (int)  			 - Number of endmembers to be induced (positive integer > 0)

    Outputs:
        Dictionary - 
            endmember_array  - Set of induced endmembers (N x p)
            endmember_vector - Array of indices into the array data corresponding to the induced endmembers

    Examples:
    >>> (inputHash, labelHash, template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_ATGP(inputHash, False, 3, False)
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return None

    data = returnHash['data']

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_endmembers - ATGP - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " samples")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("endmember", "ATGP", samples)

    data = codex_math.codex_impute(data)

    results = pysptools.eea.eea.ATGP(data, int(q))

    dictionary = {'eta': eta, 'endmember_array':np.array_str(results[0]),'endmember_vector': np.array_str(results[1]), 'downsample': downsampled}

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("endmember", "ATGP", computeTime, len(data), data.ndim)

    if(subsetHash is False):
        returnCodeString = "codex_endmembers.codex_ATGP('"+inputHash+"',False,"+str(q)+","+str(downsampled)+")\n"
    else:
        returnCodeString = "codex_endmembers.codex_ATGP('"+inputHash+"','"+subsetHash+"',"+str(q)+","+str(downsampled)+")\n"
    codex_return_code.logReturnCode(returnCodeString)
	
    return dictionary



def codex_FIPPI(inputHash, subsetHash, q, downsampled):
    '''
    Inputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)
        q  (int)  			 - Number of endmembers to be induced (positive integer > 0)

    Outputs:
        Dictionary - 
            endmember_array  - Set of induced endmembers (N x p)
            endmember_vector - Array of indices into the array data corresponding to the induced endmembers

    Examples:
    >>> (inputHash, labelHash, template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_FIPPI(inputHash, False, 1, False)
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.log("Hash not found. Returning!")
        return None

    data = returnHash['data']
    x,y = data.shape

    if(q > y):
        codex_system.codex_log("WARNING: q must be <= to number of features")
        return None

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_endmembers - FIPPI - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " samples")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("endmember", "FIPPI", samples)

    data = codex_math.codex_impute(data)

    results = pysptools.eea.eea.FIPPI(data, int(q))

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("endmember", "FIPPI", computeTime, len(data), data.ndim)

    dictionary = {'eta': eta, 'endmember_array':np.array_str(results[0]),'endmember_vector': np.array_str(results[1]), 'downsample': downsampled}

    if(subsetHash is False):
        returnCodeString = "codex_endmembers.codex_FIPPI('"+inputHash+"',False,"+str(q)+","+str(downsampled)+")\n"
    else:
        returnCodeString = "codex_endmembers.codex_FIPPI('"+inputHash+"','"+subsetHash+"',"+str(q)+","+str(downsampled)+")\n"
    codex_return_code.logReturnCode(returnCodeString)

    return dictionary

def codex_PPI(inputHash, subsetHash, q, numSkewers, downsampled):
    '''
    Inputs:
        inputHash (string)   - hash value corresponding to the data to cluster
        subsetHash (string)  - hash value corresponding to the subselection (false if full feature)
        q  (int)  			 - Number of endmembers to be induced (positive integer > 0)
        numSkewers (int)	 - Number of “skewer” vectors to project data onto.

    Outputs:
        Dictionary - 
            endmember_array  - Set of induced endmembers (N x p)
            endmember_vector - Array of indices into the array data corresponding to the induced endmembers

    Examples:
    >>> (inputHash, labelHash, template, labelHash) = codex_doctest.doctest_get_data()

    >>> result = codex_PPI(inputHash, False, 3, 1, False)
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_endmembers - PPI - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " samples")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("endmember", "PPI", samples)

    data = codex_math.codex_impute(data)
    
    results = pysptools.eea.eea.PPI(data, int(q), int(numSkewers))

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("endmember", "PPI", computeTime, len(data), data.ndim)

    dictionary = {'eta': eta, 'endmember_array':np.array_str(results[0]),'endmember_vector': np.array_str(results[1]), 'downsample':downsampled}

    if(subsetHash is False):
        returnCodeString = "codex_endmembers.codex_PPI('"+inputHash+"',False,"+str(q)+","+str(numSkewers)+","+str(downsampled)+")\n"
    else:
        returnCodeString = "codex_endmembers.codex_PPI('"+inputHash+"','"+subsetHash+"',"+str(q)+","+str(numSkewers)+","+str(downsampled)+")\n"
    codex_return_code.logReturnCode(returnCodeString)

    return dictionary


if __name__ == "__main__":

    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)
