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

import numpy as np

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.sub.return_code        import logReturnCode
from api.sub.codex_math         import impute
from api.sub.time_log           import getComputeTimeEstimate
from api.sub.time_log           import logTime
from api.sub.downsample         import downsample
from api.binning                 import ml_binning
from api.quality_scan            import ml_quality_scan
from api.dimmension_reduction    import ml_dimensionality_reduction
from api.endmember               import ml_endmember
from api.normalize               import ml_normalize
from api.peak_detection          import ml_peak_detect
from api.regression              import ml_regression
from api.segmentation            import ml_segmentation
from api.template_scan           import ml_template_scan
from api.classification          import ml_classification
from api.dimmension_reduction   import run_dim_reduction
from api.sub.labels             import label_swap
from api.sub.hash               import get_cache
from api.sub.system              import get_featureList
from api.sub.return_code         import logReturnCode


def getTestData(session=None):
    '''
    Inputs:
        None

    Outputs:
        None

    Notes:
        doctest function to streamline data ingestion for use
        in clustering unit tests

        TODO - labels are currently stashed in features due to front-end limitations.  
                Need to convert here when they get moved to their own class.

    '''
    from api.sub.hash import get_cache, DOCTEST_SESSION
    from api.sub.read_data import codex_read_csv
    cache = get_cache(DOCTEST_SESSION if session is None else session)

    featureList = ['TiO2', 'FeOT', 'SiO2', 'Total']
    hashList, featureList = codex_read_csv(CODEX_ROOT + '/uploads/doctest.csv', featureList, "feature", session=cache)
    
    # merge 1d arrays to nd-array
    data = cache.mergeHashResults(hashList)
    samples, features = data.shape

    inputHash = cache.hashArray('Merged', data, "feature")

    template = np.zeros(samples)
    templateHashDictionary = cache.hashArray("template", template, "feature")
    templateHash = templateHashDictionary['hash']

    labelHash = codex_read_csv(CODEX_ROOT + '/uploads/doctest.csv', ["labels"], "feature", session=cache)
    labelHash = labelHash[0][0]

    regrLabelData = []
    random.seed(50)

    for j in range(samples): 
        regrLabelData.append(random.randint(0, 10))

    regrLabelData = np.asarray(regrLabelData)
    regrLabelDictionary = cache.hashArray("regrLabelHash", regrLabelData, "feature")
    regrLabelHash = regrLabelDictionary['hash']

    return {"inputHash":inputHash['hash'], 'featureNames':featureList, "hashList":hashList, "templateHash": templateHash, "classLabelHash":labelHash, "regrLabelHash": regrLabelHash}



class algorithm(object):
    def __init__(self, inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result, session, **kwargs):

        self.inputHash = inputHash
        self.hashList = hashList
        self.subsetHashName = subsetHashName
        self.algorithmName = algorithmName
        self.downsampled = downsampled
        self.parms = parms
        self.result = result
        self.session = session

    def run(self):

        cache = get_cache(self.session)

        if len(self.hashList) < 2:
            logging.warning("Clustering requires >= 2 features.")
            return None

        if self.subsetHashName is not None:
            subsetHash = cache.findHashArray("name", self.subsetHashName, "subset")
            if(subsetHash is None):
                subsetHash = False
            else:
                subsetHash = subsetHash["hash"]
        else:
            subsetHash = False

        try:
            
            pca = run_dim_reduction(self.inputHash, subsetHash, {"n_components":2}, self.downsampled, False, "PCA", session=cache)
            self.result = self.tester(pca['outputHash'], subsetHash, self.downsampled, self.algorithmName, self.parms, cache)
            self.result['data'] = pca['data']

        except BaseException:
            logging.warning("Failed to clustering algorithm")
            self.result['message'] = "Failed to run clustering algorithm"
            logging.warning(traceback.format_exc())

        return self.result


    def tester(self, inputHash, subsetHash, downsampled, algorithm, parms, session):
        '''
        Inputs:
            inputHash (string)  - hash value corresponding to the data to cluster
            subsetHash (string) - hash value corresponding to the subselection (false if full feature)
            downsampled (int)   - number of data points to use for quicklook
            algorithm (string)  - Name of the classifier to run.  Follows Sklearn naming conventions.
                                    Available keys:  

        Outputs:
            dictionary:
                algorithm (str)          - Name of the classifier which was run.  Will be same as algorithm input argument
                data (numpy.ndarray)     - (samples, features) array of features to cluster
                clusters (numpy.ndarray) -  array containing cluster index for each sample
                k (int)                  - number of clusters found
                downsample (int)         - number of data points used in quicklook
                numClusters (int)        - number of clusters calculated by the algorithm (unique of clusters)

        '''
        cache = get_cache(session)

        logReturnCode(inspect.currentframe())

        startTime = time.time()
        result = {'algorithm': algorithm,
                  'downsample': downsampled,
                  "WARNING":None}

        returnHash = cache.findHashArray("hash", inputHash, "feature")
        if returnHash is None:
            logging.warning("Clustering: run_codex_clustering: Hash not found. Returning!")
            return None

        X = returnHash['data']
        if X is None:
            return None

        if X.ndim < 2:
            logging.warning("ERROR: run_codex_clustering - insufficient data dimmensions")
            return None

        full_samples, full_features = X.shape
        result['eta'] = getComputeTimeEstimate("clustering", algorithm, full_samples, full_features)

        if subsetHash is not False:
            X = cache.applySubsetMask(X, subsetHash)
            if(X is None):
                logging.warning("ERROR: run_codex_clustering - subsetHash returned None.")
                return None

        if downsampled is not False:
            X = downsample(X, samples=downsampled, session=cache)
            logging.info("Downsampled to {samples} samples".format(samples=len(X)))

        computed_samples, computed_features = X.shape
        X = impute(X)

        result = self.get_algorithm(X, result)

        endTime = time.time()
        computeTime = endTime - startTime
        logTime("clustering", algorithm, computeTime, computed_samples, computed_features)

        result['message'] = "success"
        return result


if __name__ == '__main__':

    from api.sub.hash       import get_cache
    from api.sub.hash       import DOCTEST_SESSION
    from api.clustering     import clustering

    ch = get_cache(DOCTEST_SESSION)
    testData = getTestData(session=ch)


    test = clustering(inputHash=testData['inputHash'], hashList=testData['hashList'], subsetHashName=None, algorithmName="kmeans", downsampled=False, parms={'k': 3, 'eps': 0.7, 'n_neighbors': 10, 'quantile': 0.5, 'damping': 0.9}, result={}, session=ch)
    result = test.run()
    print(result['message'])


