'''
Author: Jack Lightholder
Date  : 5/10/17
Brief : Time logging and estimation for CODEX algorithms
Notes :
'''
import os
import sys
import time
import h5py
import os.path
import logging

import numpy as np

from scipy        import misc
from random       import randint
from heapq        import nsmallest
from os           import listdir
from os.path      import isfile
from os.path      import join
from os.path      import isdir 
from sklearn.tree import DecisionTreeRegressor

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

CODEX_ROOT = os.getenv('CODEX_ROOT')
logPath = os.path.join(CODEX_ROOT, "timeLogs")
timeLogs = {}

def logTime(domain, algorithm, time, samples, features):
    '''
    Inputs:
        domain (string)     - String indicating the domain type of the algorithm you're seeking.
                                See timeLogs/ subfolder names for choices
        algorithm (string)  - Algorithm name you're looking for a compute estimate for.
                                See timeLogs/domain/ subfolder names for choices.
        time (float)		- Log time for a given executation of the algorithm
        samples (int)		- Log number of samples for a given execution of the algorithm.

    Outputs:
        NONE

    '''
    if(timeLogs == {}):
        getTimeLogDict()

    algorithmPath = os.path.join(logPath, domain, algorithm)
    if not os.path.exists(algorithmPath):
        try:
            os.makedirs(algorithmPath)
        except BaseException:
            pass

    algorithmFile = os.path.join(algorithmPath, "timeLog.npy")

    try:
        data = timeLogs[domain][algorithm]["log"]
        data = np.concatenate((data, np.array([samples, features, time]).reshape(1, 3)), axis=0)
    except BaseException:
        data = np.array([samples, features, time]).reshape(1, 3)

    if(domain not in timeLogs.keys()):
        timeLogs[domain] = {}

    if(algorithm not in timeLogs[domain].keys()):
        timeLogs[domain][algorithm] = {}

    timeLogs[domain][algorithm]["log"] = data
    np.save(algorithmFile, data)


def getTimeLogDict():
    '''
    Inputs:

    Outputs:

    '''
    if not os.path.exists(logPath):
        os.makedirs(logPath)

    algorithmTypes = [f for f in listdir(logPath) if isdir(join(logPath, f))]
    for algorithmType in algorithmTypes:
        timeLogs[algorithmType] = {}
        algorithms = [f for f in listdir(join(logPath, algorithmType)) if isdir(join(join(logPath, algorithmType), f))]
        for algorithm in algorithms:
            timeLogs[algorithmType][algorithm] = {}
            try:
                data = np.load(join(logPath, algorithmType, algorithm, "timeLog.npy"))
                timeLogs[algorithmType][algorithm]["log"] = data
            except BaseException:
                pass


def getComputeTimeEstimate(domain, algorithm, inputSamples, inputFeatures):
    '''
    Inputs:
        domain (string)     - string indicating the domain type of the algorithm you're seeking.
                                See timeLogs/ subfolder names for choices
        algorithm (string)  - Algorithm name you're looking for a compute estimate for.
                                See timeLogs/domain/ subfolder names for choices.
        inputSamples (int)  - Number of samples in the given computation.  Finds closest references
                                to similarly sized problems for calulcation of algorithm ETA.

    Outputs:
        outTime (float)     - Estimated time to complete computation for given algorithm and sample size

    '''

    algorithmPath = os.path.join(logPath, domain, algorithm)

    if(timeLogs == {}):
        getTimeLogDict()

    try:
        data = timeLogs[domain][algorithm]["log"]
    except BaseException:
        data = None

    if(data is not None):

        # data = [samples, features, times]
        X = data[:,0:2]
        y = data[:,2]

        regr = DecisionTreeRegressor()
        regr.fit(X, y)

        testData = np.array([[inputSamples, inputFeatures]])
        outTime = regr.predict(testData)[0]

    else:
        outTime = None

    return outTime



