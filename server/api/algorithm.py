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
import inspect
import traceback
import logging
import random
import time
import json

import numpy as np

from sklearn           import cluster

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.codex_math         import impute
from api.sub.time_log           import getComputeTimeEstimate
from api.sub.time_log           import logTime
from api.sub.downsample         import downsample
from api.sub.labels             import label_swap
from api.sub.hash               import get_cache

class algorithm():
    def __init__(self, inputHash, activeLabels, hashList, labelHash, subsetHashName, algorithmName, downsampled, parms, scoring, search_type, cross_val, result, session):
        
        self.inputHash = inputHash
        self.hashList = hashList
        self.subsetHashName = subsetHashName
        self.algorithmName = algorithmName
        self.downsampled = downsampled
        self.parms = parms
        self.result = result
        self.session = session
        self.labelHash = labelHash
        self.scoring = scoring
        self.search_type = search_type
        self.cross_val = cross_val
        self.activeLabels = activeLabels

    def run(self):

        self.cache = get_cache(self.session)

        startTime = time.time()
        self.result = {'algorithm': self.algorithmName,
                       'downsample': self.downsampled,
                       'WARNING':None}

        returnHash = self.cache.findHashArray("hash", self.inputHash, "feature")
        if returnHash is None:
            logging.warning("Input hash not found: {inputHash}".format(inputHash=self.inputHash))
            self.result['message'] = "failure"
            return self.result

        self.X = returnHash['data']
        if self.X is None:
            self.result['message'] = "failure"
            logging.warning("X returned None")
            return self.result

        ret = self.check_valid()
        if not ret:
            self.result['message'] = "failure"
            return self.result

        if self.X.ndim == 1:
            full_samples = self.X.shape[0]
            full_features = 1
        else:
            full_samples, full_features = self.X.shape

        self.result['eta'] = getComputeTimeEstimate(self.__class__.__name__, self.algorithmName, full_samples, full_features)

        if self.subsetHashName is not False:
            self.X = self.cache.applySubsetMask(self.X, self.subsetHashName)
            if(self.X is None):
                logging.warning("Subset hash not found: {subsetHash}".format(subsetHash=self.subsetHashName))
                self.result['message'] = "failure"
                return self.result

        if self.downsampled is not False:
            self.X = downsample(self.X, samples=self.downsampled, session=self.cache, algorithm='simple')
            logging.info("Downsampled to {samples} samples".format(samples=len(self.X)))

        # TODO - labels are currently cached under features
        if self.labelHash:
            labelHash_dict = self.cache.findHashArray("hash", self.labelHash, "feature")
            if labelHash_dict is None:
                logging.warning("Label hash not found: {labelHash}".format(self.labelHash))
                self.result['message'] = "failure"
                return self.result                  
            else:
                self.y = labelHash_dict['data']
                self.result['y'] = self.y.tolist()

        if self.X.ndim == 1:
            computed_samples = self.X.shape[0]
            computed_features = 1
        else:
            computed_samples, computed_features = self.X.shape

        self.X = impute(self.X)
        self.result['data'] = self.X.tolist()

        self.algorithm = self.get_algorithm()
        if self.algorithm == None:
            self.result['message'] = "failure"
            self.result['WARNING'] = "{alg} algorithm not supported".format(alg=self.algorithmName)
            return self.result

        self.fit_algorithm()

        # TODO - The front end should specify a save name for the model
        model_name = self.algorithmName +  "_" + str(random.random())
        if self.search_type == 'direct':
            model_dict = self.cache.saveModel(model_name, self.algorithm, "regressor")
        else:
            model_dict = self.cache.saveModel(model_name, self.algorithm.best_estimator_, "regressor")
        if not model_dict:
            self.result['WARNING'] = "Model could not be saved."
        else:
            self.result['model_name'] = model_dict['name']
            self.result['model_hash'] = model_dict['hash']


        endTime = time.time()
        computeTime = endTime - startTime
        logTime(self.__class__.__name__, self.algorithmName, computeTime, computed_samples, computed_features)

        self.result['message'] = "success"
        return self.result


