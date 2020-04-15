'''
Author: Jack Lightholder, Patrick Kage
Date  : 7/15/17, 7/15/19

Brief : Hashing library for CODEX cache categories

Notes :
    Hashing categories are:
    1.) Feature List
    2.) Subset List
    3.) Downsample List

The components of a hash object are as follows:
    name    :  String name of the hash for easy lookup
    data    :  Data array to be hashed for quick storage
    hash    :  sha1 hash of the data array
    samples :  Number of data points in the hash array
    memory  :  Not currently used.  Eventually used for
                    tracking RAM/memory usage.  Might be algorithm
                    specific
    z-order :
    color   :

'''
import os
import time
import h5py
import hashlib
import sys
import pickle
import psutil
import time
import warnings
import functools
import logging
import inspect
import json
import os.path

import numpy as np

from types import ModuleType

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# IPC support
from api.sub.ntangle.client import Client
from api.sub.ntangle.server import Server
from api.sub.ntangle.server import expose

# CODEX Support
from api.sub.system         import string2token

DEFAULT_CODEX_HASH_BIND    = 'tcp://*:64209'
DEFAULT_CODEX_HASH_CONNECT = 'tcp://localhost:64209'
DOCTEST_SESSION            = '__doctest__'

class NoSessionSpecifiedError(Exception):
    pass

class CodexHash:
    # current hashes stored here
    sessions={}

    def __has_session(self, sessionKey):
        return sessionKey in self.sessions

    def __set_session(self, sessionKey):
        if sessionKey is None:
            raise NoSessionSpecifiedError()
        if not self.__has_session(sessionKey):
            self.sessions[sessionKey] = {
                "featureList": [],
                "subsetList": [],
                "downsampleList": [],
                "labelList": [],
                "classifierList": [],
                "regressorList": [],
                "returnCode": [],
                "nan": None,
                "inf": None,
                "ninf": None
            }
        return sessionKey

    @expose('printCacheCount')
    def printCacheCount(self, session=None):
        '''
        Inputs:

        Outputs:

        '''
        session = self.__set_session(session)

        logging.info("Feature Cache Size           : " + str(len(self.sessions[session]["featureList"])))
        logging.info("Subset Cache Size            : " + str(len(self.sessions[session]["subsetList"])))
        logging.info("Downsample Cache Size        : " + str(len(self.sessions[session]["downsampleList"])))
        logging.info("Number of classifier models  : " + str(len(self.sessions[session]["regressorList"])))
        logging.info("Number of regressor models   : " + str(len(self.sessions[session]["classifierList"])))

    @expose('get_nan')
    def get_nan(self, session=None):
        session = self.__set_session(session)
        return self.sessions[session]["nan"]

    @expose('get_inf')
    def get_inf(self, session=None):
        session = self.__set_session(session)
        return self.sessions[session]["inf"]

    @expose('get_ninf')
    def get_ninf(self, session=None):
        session = self.__set_session(session)
        return self.sessions[session]["ninf"]

    @expose('remove_stale_data')
    def remove_stale_data(self, verbose=False, session=None):
        '''
        Inputs:

        Outputs:

        '''
        session = self.__set_session(session)

        if(verbose):
            logging.info("Before clearing cache:")
            self.printCacheCount(session=session)
            process = psutil.Process(os.getpid())
            current_ram = process.memory_info().rss
            logging.info(current_ram)

        oldestTime = time.time()
        oldestType = "downsample"
        oldestName = ""

        for point in self.sessions[session]["featureList"]:
            if(point["time"] < oldestTime):
                oldestTime = point["time"]
                oldestType = "feature"
                oldestName = point["name"]

        for point in self.sessions[session]["subsetList"]:
            if(point["time"] < oldestTime):
                oldestTime = point["time"]
                oldestType = "subset"
                oldestName = point["name"]

        for point in self.sessions[session]["downsampleList"]:
            if(point["time"] < oldestTime):
                oldestTime = point["time"]
                oldestType = "downsample"
                oldestName = point["name"]

        status = self.deleteHashName(oldestName, oldestType, session=session)
        if(status != True):
            logging.warning("Deleting hash failed")
            return None

        if(verbose):
            logging.info("After clearing cache:")
            self.printCacheCount(session=session)
            process = psutil.Process(os.getpid())
            current_ram = process.memory_info().rss
            logging.info(current_ram)


    @expose('deleteHashName')
    def deleteHashName(self, name, hashType, session=None):
        session = self.__set_session(session)

        delIndex = None

        if(hashType == "subset"):

            length = len(self.sessions[session]["subsetList"])
            for x in range(0, length):
                if(name == self.sessions[session]["subsetList"][x]["name"]):
                    delIndex = x

            if(delIndex is not None):
                del self.sessions[session]["subsetList"][delIndex]
                return True
            else:
                return False

        elif(hashType == "feature"):

            length = len(self.sessions[session]["featureList"])
            for x in range(0, length):
                if(name == self.sessions[session]["featureList"][x]["name"]):
                    delIndex = x

            if(delIndex is not None):
                del self.sessions[session]["featureList"][delIndex]
                return True
            else:
                return False

        elif(hashType == "downsample"):

            length = len(self.sessions[session]["downsampleList"])
            for x in range(0, length):
                if(name == self.sessions[session]["downsampleList"][x]["name"]):
                    delIndex = x

            if(delIndex is not None):
                del self.sessions[session]["downsampleList"][delIndex]
                return True
            else:
                return False

        elif(hashType == "label"):

            length = len(self.sessions[session]["labelList"])
            for x in range(0, length):
                if(name == self.sessions[session]["labelList"][x]["name"]):
                    delIndex = x

            if(delIndex is not None):
                del self.sessions[session]["labelList"][delIndex]
                return True
            else:
                return False

        else:

            return False


    @expose('hashUpdate')
    def hashUpdate(self, field, old, new, hashType, session=None):
        '''
        Inputs:

        Outputs:

        '''
        session = self.__set_session(session)

        result = self.findHashArray(field, old, hashType, session=session)
        status = self.deleteHashName(old, hashType, session=session)
        #logging.info("DEBUG:", new)
        result[field] = new

        if(hashType == "subset"):
            self.sessions[session]["subsetList"].append(result)
        elif(hashType == "downsample"):
            self.sessions[session]["downsampleList"].append(result)
        elif(hashType == "label"):
            self.sessions[session]["labelList"].append(result)
        elif(hashType == "feature"):
            self.sessions[session]["featureList"].append(result)
        else:
            return False

        return True

    @expose('resetCacheList')
    def resetCacheList(self, hashType, session=None):
        '''
        Inputs:

        Outputs:

        '''
        session = self.__set_session(session)

        if(hashType == "feature"):
            self.sessions[session]["featureList"] = []
        elif(hashType == "downsample"):
            self.sessions[session]["downsampleList"] = []
        elif(hashType == "subset"):
            self.sessions[session]["subsetList"] = []
        elif(hashType == "label"):
            self.sessions[session]["labelList"] = []
        elif(hashType == "classifier"):
            self.sessions[session]["classifierList"] = []
        elif(hashType == "regressor"):
            self.sessions[session]["regressorList"] = []
        else:
            logging.warning("Unknown hash type.  Not resetting")

    @expose('hashArray')
    def hashArray(self, arrayName, inputArray, hashType, virtual=False, session=None):
        '''
        Inputs:
            arrayName (string)    - Name of the data set.  Used in visalization for easy human data recognition
            inputArray (np aray)  - Data to be hashed.  Numpy ND array.  If integers, casted to float for storage
            hashType (string)     - Hash log to store data in {feature, subset, downsample, label}
            virtual (boolean)     - Whether or not this is a "virtual" feature

        Outputs:
            Dictionary -
                name (string)     - arrayName input stored
                data (nd array)   - inputArray input stored
                hash (string)     - resulting hash
                samples (int)     - number of samples in the data set
                memory (int)      - size, in bytes, of memory being cached

        '''
        session = self.__set_session(session)

        if(isinstance(inputArray, type(None))):
            return None

        if isinstance(inputArray, range):
            inputArray = np.array(inputArray, dtype=np.float64)

        # TODO - figure out why this is required and if it has any negative impacts
        if(inputArray.flags["C_CONTIGUOUS"] == False):
            inputArray = inputArray.copy(order='C')

        try:
            inputArray = inputArray.astype(float)
        except BaseException:
            inputArray = string2token(inputArray)

        hashValue = hashlib.sha1(inputArray).hexdigest()
        samples = len(inputArray)

        # TODO - better figure out how to calculate RAM usage. Don't think static
        # is possible
        memoryFootprint = 0  # asizeof.asizeof(inputArray)

        creationTime = time.time()

        newHash = {
            'time': creationTime,
            'name': arrayName,
            'data': inputArray,
            'hash': hashValue,
            "samples": samples,
            "memory": memoryFootprint,
            "type": hashType,
            "virtual": virtual,
            "color": None,
            "z-order": None}

        if(hashType == "feature"):
            if not any(d['hash'] == newHash["hash"] for d in self.sessions[session]["featureList"]):
                self.sessions[session]["featureList"].append(newHash)
        elif(hashType == "subset"):
            if not any(d['hash'] == newHash["hash"] for d in self.sessions[session]["subsetList"]):
                self.sessions[session]["subsetList"].append(newHash)
        elif(hashType == "downsample"):
            if not any(d['hash'] == newHash["hash"] for d in self.sessions[session]["downsampleList"]):
                self.sessions[session]["downsampleList"].append(newHash)
        elif(hashType == "label"):
            if not any(d['name'] == newHash["name"] for d in self.sessions[session]["labelList"]):
                self.sessions[session]["labelList"].append(newHash)
        elif(hashType == "NOSAVE"):
            pass
        else:
            logging.warning("ERROR: Hash type not recognized! Not logged for future use.")
            return None

        return newHash

    @expose('getSentinelValues')
    def getSentinelValues(self, featureList, session=None):

        session = self.__set_session(session)
        sentinel_values = {"inf":None, "ninf":None, "nan":None}

        combined = np.array([], dtype=float)
        for feature in featureList:
            r = self.findHashArray("name", feature, "feature", session=session)
            if r:
                r_unique = np.unique(r['data']).astype(float)
                combined = np.concatenate((combined, r_unique))

        combined_unique = np.unique(combined)
        max_val = np.nanmax(combined_unique)

        if(np.isnan(combined_unique).any()):
            sentinel_values['nan']  = round((max_val * 10) + 3)
            self.sessions[session]['nan'] = sentinel_values['nan']

        if(np.isneginf(combined_unique).any()):
            sentinel_values['ninf'] = round((max_val * 10) + 1)
            self.sessions[session]['ninf'] = sentinel_values['ninf']

        if(np.isinf(combined_unique).any()):
            sentinel_values['inf']  = round((max_val * 10) + 2)
            self.sessions[session]["inf"] = sentinel_values['inf']

        return sentinel_values

    def printHashList(self, hashType, session=None):
        '''
        Inputs:
            hashType (string) - {feature, subset} print the requested hash list. Used in debugging

        Outputs:
            NONE

        '''
        session = self.__set_session(session)

        if(hashType == "feature"):

            for point in self.sessions[session]["featureList"]:
                logging.info("Name: " + point['name'])
                logging.info("Hash: " + point['hash'])
                logging.info("Data Shape: " + str(point['data'].shape))
                logging.info("Color: " + str(point["color"]))
                logging.info("Z-Order: " + str(point["z-order"]))

        elif(hashType == "subset"):

            for point in self.sessions[session]["subsetList"]:
                logging.info("Name: " + point['name'])
                logging.info("Hash: " + point['hash'])
                logging.info("Data Shape: " + str(point['data'].shape))
                logging.info("Color: " + str(point["color"]))
                logging.info("Z-Order: " + str(point["z-order"]))

        elif(hashType == "downsample"):

            for point in self.sessions[session]["downsampleList"]:
                logging.info("Name: " + point['name'])
                logging.info("Hash: " + point['hash'])
                logging.info("Data Shape: " + str(point['data'].shape))
                logging.info("Color: " + str(point["color"]))
                logging.info("Z-Order: " + str(point["z-order"]))

        elif(hashType == "label"):

            for point in self.sessions[session]["labelList"]:
                logging.info("Name: " + point['name'])
                logging.info("Hash: " + point['hash'])
                logging.info("Data Shape: " + str(point['data'].shape))
                logging.info("Color: " + str(point["color"]))
                logging.info("Z-Order: " + str(point["z-order"]))

        else:
            logging.warning("ERROR: printHashList - unknown hashType")

    @expose('findHashArray')
    def findHashArray(self, field, name, hashType, session=None):
        '''
        Inputs:
            name     (string)  - hash string for the data set you wish to access
            hashType (string)  - hash category of the data set {feature, subset}

        Outputs:
            hashArray function defined dictionary of information about data set

        '''
        session = self.__set_session(session)

        if(hashType == "feature"):

            for point in self.sessions[session]["featureList"]:
                if(point[field] == name):
                    return point
            return None

        elif(hashType == "subset"):

            for point in self.sessions[session]["subsetList"]:
                if(point[field] == name):
                    return point
            return None

        elif(hashType == "downsample"):

            for point in self.sessions[session]["downsampleList"]:
                if(point[field] == name):
                    return point
            return None

        elif(hashType == "label"):

            for point in self.sessions[session]["labelList"]:
                if(point[field] == name):
                    return point
            return None

        elif(hashType == "regressor"):

            for point in self.sessions[session]["regressorList"]:
                if(point[field] == name):
                    return point
            return None

        elif(hashType == "classifier"):

            for point in self.sessions[session]["classifierList"]:
                if(point[field] == name):
                    return point
            return None

        else:
            logging.warning("ERROR: findHashArray - hash not found")
            return None

    @expose('mergeHashResults')
    def mergeHashResults(self, hashList, verbose=False, session=None):
        '''
        Inputs:
            hashList (list)      - list of hash strings to be merged into a new accessible data set

        Outputs:
            hashArray (np array) - merged numpy nd-array of individual from hashList input

        '''
        session = self.__set_session(session)
        
        if(hashList is None):
            logging.warning("ERROR: mergeHashResults hashList is None")
            return None

        if(hashList == []):
            logging.warning("ERROR: mergeHashResults hashList is empty")
            return None

        totalFeatures = len(hashList)

        if(verbose):
            logging.warning("Number of features: " + str(totalFeatures))

        currentHash = hashList[0]
        result = self.findHashArray("hash", currentHash, "feature", session=session)
        if(result is None):
            logging.warning("Warning, hash not found in mergeHashResults")
            return None

        returnArray = result['data']
        returnName = result['name']


        if(verbose):
            logging.info("Merging: " + returnName)

        for featureNum in range(1, totalFeatures):
            currentHash = hashList[featureNum]
            result = self.findHashArray("hash", currentHash, "feature", session=session)
            if(result is None):
                logging.warning("Warning, hash not found in mergeHashResults")
                return None

            resultArray = result['data']
            resultName = result['name']

            if(verbose):
                logging.info("Merging: " + resultName)

            try:
                (s1, f1) = returnArray.shape
            except BaseException:
                s1 = returnArray.size

            s2 = resultArray.size

            if(s1 == s2):
                returnArray = np.column_stack((resultArray, returnArray))
            else:
                # TODO - long term, how do we want to handle this?
                logging.warning("WARNING: {resultName} does not match shape of previous features(" + str(s1) + "/" +str(s2) + "). Exlucding.".format(resultName=resultName))
    
        return returnArray
        
    @expose('feature2hashList')
    def feature2hashList(self, featureList, session=None):

        session = self.__set_session(session)

        hashList = []
        for feature in featureList:
            r = self.findHashArray("name", feature, "feature", session=session)
            if(r is not None):
                hashList.append(r['hash'])
            else:
                logging.warning("WARNING: feature2hashList - could not add {feature} to feature list.".format(feature=feature))
        return hashList

    @expose('applySubsetMask')
    def applySubsetMask(self, featureArray, subsetHash, session=None):
        '''
        Inputs:
            featureArray (np array) - feature to which subset mask will be applied
            subsetHash (string)     - reference hash for the subset which should be applied to featureArray

        Outputs:
            resultArray (np array)  - featureArray data with subset mask applied
            subsetHashName (string) - name of the resulting hash with subset applied.

        '''
        session = self.__set_session(session)

        subsetHashName = None

        returnDict = self.findHashArray("hash", subsetHash, "subset", session=session)
        if(returnDict is None):
            logging.warning("Hash not found. Returning!")
            return None

        indexArray = returnDict['data']
        resultList = []

        try:
            x1, y1 = featureArray.shape
            x2 = indexArray.size

            if(x1 != x2):
                logging.warning("Error: mask must match length of feature")
                return None

            included = np.count_nonzero(indexArray)
            outData = np.zeros((included, y1))

            count = 0
            for x in range(0, x1):
                if(indexArray[x] == 1):
                    for y in range(0, y1):
                        outData[count, y] = featureArray[x, y]
                    count += 1

            return outData, returnDict['name']

        except BaseException:

            x1 = featureArray.size
            x2 = indexArray.size

            if(x1 != x2):
                logging.warning("Error: mask must match length of feature")
                return None

            included = np.count_nonzero(indexArray)
            outData = np.zeros(included)

            count = 0
            for x in range(0, x1):
                if(indexArray[x] == 1):
                    outData[count] = featureArray[x]
                    count += 1

            return outData, returnDict['name']

    @expose('pickle_data')
    def pickle_data(self, session_name, front_end_state, savePath, session=None):
        '''
        Inputs:

        Outputs:

        '''
        session = self.__set_session(session)

        session_path = os.path.join(savePath, 'sessions', session_name)
        if not os.path.exists(os.path.join(session_path)):
            os.makedirs(session_path)

        ## Save classifier models
        pickle_path = os.path.join(session_path, 'classifier_models')
        pickle.dump(self.sessions[session]["classifierList"], open(pickle_path, 'wb'))

        # Save regression models
        pickle_path = os.path.join(session_path, 'regressor_models')
        pickle.dump(self.sessions[session]["regressorList"], open(pickle_path, 'wb'))

        # Save labels
        pickle_path = os.path.join(session_path, "label_data")
        pickle.dump(self.sessions[session]["labelList"], open(pickle_path, 'wb'))

        # Save features
        pickle_path = os.path.join(session_path, "feature_data")
        pickle.dump(self.sessions[session]["featureList"], open(pickle_path, 'wb'))

        # Save subsets
        pickle_path = os.path.join(session_path, "subset_data")
        pickle.dump(self.sessions[session]["subsetList"], open(pickle_path, 'wb'))

        # Save downsampled features
        pickle_path = os.path.join(session_path, "downsampled_data")
        pickle.dump(self.sessions[session]["downsampleList"], open(pickle_path, 'wb'))

        # Save front end state
        pickle_path = os.path.join(session_path, "client_state")
        pickle.dump(front_end_state, open(pickle_path, 'wb'))

    @expose('return_data')
    def return_data(self, session=None):
        '''
        Inputs:

        Outputs:

        '''
        session = self.__set_session(session)

        ## Save classifier models
        classifiers = self.sessions[session]["classifierList"]

        # Save regression models
        regressors = self.sessions[session]["regressorList"]

        # Save labels
        labels = self.sessions[session]["labelList"]

        # Save features
        features = self.sessions[session]["featureList"]

        # Save subsets
        subsets = self.sessions[session]["subsetList"]

        # Save downsampled features
        downsamples = self.sessions[session]["downsampleList"]

        return {'classifiers': classifiers,
                'regressors': regressors,
                'labels': labels,
                'features': features,
                'subsets': subsets,
                'downsamples': downsamples}

    @expose('unpickle_data')
    def unpickle_data(self, session_name, loadPath, session=None):
        '''
        Inputs:

        Outputs:

        Notes: Currently send all features, downsamples, subsets and labels to the front end on load.
                This is because plotting is directly on the front end currently, so they need to store all data.
                This needs to be moved to a back end query functionality, since we'll run out of front end space.

        '''
        session = self.__set_session(session)

        session_path = os.path.join(loadPath, 'sessions', session_name)
        if not os.path.exists(os.path.join(session_path)):
            os.makedirs(session_path)

        ## Load classifier models
        pickle_path = os.path.join(session_path, 'classifier_models')
        self.sessions[session]["classifierList"] = pickle.load(open(pickle_path, "rb"))

        # Load regression models
        pickle_path = os.path.join(session_path, 'regressor_models')
        self.sessions[session]["regressorList"] = pickle.load(open(pickle_path, "rb"))

        # Load labels
        pickle_path = os.path.join(session_path, "label_data")
        self.sessions[session]["labelList"] = pickle.load(open(pickle_path, "rb"))

        labels = []
        for label in self.sessions[session]["labelList"]:
            x = self.findHashArray('hash', label["hash"], "label", session=session)
            labels.append(x['name'])

        # Load features
        pickle_path = os.path.join(session_path, "feature_data")
        self.sessions[session]["featureList"] = pickle.load(open(pickle_path, "rb"))

        features = []
        for feature in self.sessions[session]["featureList"]:
            x = self.findHashArray('hash', feature['hash'], 'feature', session=session)
            features.append(x['name'])

        # Load subsets
        pickle_path = os.path.join(session_path, "subset_data")
        self.sessions[session]["subsetList"] = pickle.load(open(pickle_path, "rb"))

        subsets = []
        for subset in self.sessions[session]["subsetList"]:
            x = self.findHashArray('hash', subset['hash'], "subset", session=session)
            subsets.append(x['name'])

        # Load downsampled features
        pickle_path = os.path.join(session_path, "downsampled_data")
        self.sessions[session]["downsampleList"] = pickle.load(open(pickle_path, "rb"))

        downsamples = []
        for downsample in self.sessions[session]["downsampleList"]:
            x = self.findHashArray('hash', downsample['hash'], "downsample", session=session)
            downsamples.append(x['name'])

        # Load client state
        pickle_path = os.path.join(session_path, "client_state")
        state = pickle.load(open(pickle_path, "rb"))

        return {'features':features, 'labels':labels, 'subsets':subsets, 'downsample':downsamples, 'state':state}

    @expose('saveModel')
    def saveModel(self, modelName, inputModel, modelType, session=None):
        '''
        Inputs:
            modelName (string)    - Name of the model.  Used in visalization for easy human model recognition
            inputModel            - Model object to be saved
            modelType (string)    - classifier | regressor

        Outputs:
            Dictionary -
                name (string)     - arrayName input stored
                data (nd array)   - inputArray input stored
                hash (string)     - resulting hash
                samples (int)     - number of samples in the data set
                memory (int)      - size, in bytes, of memory being cached

        '''
        session = self.__set_session(session)

        pickled_model = pickle.dumps(inputModel)
        hashValue = hashlib.sha1(pickled_model).hexdigest()

        # TODO - better figure out how to calculate RAM usage. Don't think static
        # is possible
        memoryFootprint = 0  # asizeof.asizeof(inputArray)

        creationTime = time.time()

        newHash = {
            'time': creationTime,
            'name': modelName,
            'model': pickled_model,
            'hash': hashValue,
            "memory": memoryFootprint,
            "type": modelType}

        if(modelType == "regressor"):
            if not any(d['hash'] == newHash["hash"] for d in self.sessions[session]["regressorList"]):
                self.sessions[session]["regressorList"].append(newHash)
        elif(modelType == "classifier"):
            if not any(d['hash'] == newHash["hash"] for d in self.sessions[session]["classifierList"]):
                self.sessions[session]["classifierList"].append(newHash)
        else:
            logging.warning("ERROR: Model hash type not recognized! Not logged for future use.")
            return None

        return newHash

    @expose('import_hd5')
    def import_hd5(self, filepath, session=None):

        from api.sub.read_data import codex_read_hd5
        hashList, featureList = codex_read_hd5(filepath, None, "feature", session=WrappedCache(session, cache=self))

        return hashList, featureList

    @expose('import_csv')
    def import_csv(self, filepath, session=None):

        from api.sub.read_data import codex_read_csv
        hashList, featureList = codex_read_csv(filepath, None, "feature", session=WrappedCache(session, cache=self))

        return hashList, featureList

    @expose('import_npy')
    def import_npy(self, filepath, session=None):

        from api.sub.read_data import codex_read_npy
        hashList, featureList = codex_read_npy(filepath, None, "feature", session=WrappedCache(session, cache=self))

        return hashList, featureList


    @expose('logReturnCode')
    def logReturnCode(self, frame, session=None):
        '''
        Inputs:

        Outputs:

        '''
        session = self.__set_session(session)

        args, _, _, values = inspect.getargvalues(frame)
        trace = inspect.getframeinfo(frame)
        func_name = trace[2]
        file_name = trace[0].rstrip(".py")

        args = dict(zip(args,list(values.values())[:len(args)]))

        function_string = "{file_name}.{func_name}".format(file_name=file_name, func_name=func_name)

        arg_string_list = []
        for arg, value in args.items():
            print(arg,value)
            if isinstance(value, int):
                arg_string = "{arg}={value}".format(arg=arg, value=value)
            elif isinstance(value, float):
                arg_string = "{arg}={value}".format(arg=arg, value=value)
            elif isinstance(value, bool):
                arg_string = "{arg}={value}".format(arg=arg, value=value)
            elif isinstance(value, type(None)):
                arg_string = "{arg}={value}".format(arg=arg, value=None)
            elif isinstance(value, str):
                arg_string = "{arg}='{value}'".format(arg=arg, value=value)
            elif isinstance(value, list):
                arg_string = "{arg}={value}".format(arg=arg, value=value)
            elif isinstance(value, tuple):
                arg_string = "{arg}={value}".format(arg=arg, value=value)
            elif isinstance(value, dict):

                ndarray_keys = []
                for dict_key, dict_value in value.items():
                    if isinstance(dict_value, (np.ndarray, np.generic)):
                        value[dict_key] = dict_value.tolist()
                        ndarray_keys.append(dict_key)

                    # TODO - do these need to be back in byte configuration to actually be used again?
                    if isinstance(dict_value, bytes):
                        value[dict_key] = str(dict_value)

                resolved_ndarray_keys = []
                for key in ndarray_keys:
                    value[key] = '"{key}":np.array(({payload}))'.format(key=key, payload=value[key])
                    resolved_ndarray_keys.append(value[key])
                    del value[key]

                dict_string = json.dumps(value)
                dict_string = dict_string[:-1]
                resolved_nd_array_key_string = ",".join(resolved_ndarray_keys)
                dict_string = "{dict_string},{resolved_nd_array_key_string}}}".format(dict_string=dict_string, resolved_nd_array_key_string=resolved_nd_array_key_string)
                arg_string = "{arg}={dict_string}".format(arg=arg, dict_string=dict_string)

            elif isinstance(value, (np.ndarray, np.generic)):
                arg_string = "{arg}=np.array(({value}))".format(arg=arg, value=value)
                arg_string = arg_string.replace("\n","")
                arg_string = arg_string.replace(" ",",")
            elif isinstance(value, WrappedCache):
                arg_string = ""
            elif isinstance(value, ModuleType):
                arg_string = ""
            else:
                arg_string = ""
                logging.warning("Unsupported input type: {type} for {function_string} in {arg}".format(type=type(value), function_string=function_string, arg=arg))

            arg_string_list.append(arg_string)
        
        arg_string = ", ".join(arg_string_list)

        full_string = "{function_string}({arg_string})\n".format(function_string=function_string, arg_string=arg_string)
        self.sessions[session]["returnCode"].append(full_string)
        return full_string

    @expose('makeReturnCode')
    def makeReturnCode(self, session=None):
        '''
        Inputs:

        Outputs:

        '''
        session = self.__set_session(session)

        self.sessions[session]["returnCode"].append('import os\n')
        self.sessions[session]["returnCode"].append("CODEX_ROOT  = os.getenv('CODEX_ROOT')\n")
        self.sessions[session]["returnCode"].append("import sys\n")
        self.sessions[session]["returnCode"].append("import time, h5py, read_data, plot, time_log\n")
        self.sessions[session]["returnCode"].append("import codex_data_quality_scan_api\n")
        self.sessions[session]["returnCode"].append("import numpy as np\n")
        self.sessions[session]["returnCode"].append("import matplotlib.pyplot as plt\n")
        self.sessions[session]["returnCode"].append("import matplotlib.image as mpimg\n")
        self.sessions[session]["returnCode"].append("import codex_peak_detection_api\n")
        self.sessions[session]["returnCode"].append("from scipy import misc\n")
        self.sessions[session]["returnCode"].append("from random import randint\n")
        self.sessions[session]["returnCode"].append("from sklearn import cluster, datasets\n")
        self.sessions[session]["returnCode"].append("from sklearn.neighbors import kneighbors_graph\n")
        self.sessions[session]["returnCode"].append("from sklearn.preprocessing import StandardScaler\n")
        self.sessions[session]["returnCode"].append("from plot import getColorMap\n")
        self.sessions[session]["returnCode"].append("import hash, return_code\n")
        self.sessions[session]["returnCode"].append("import codex_clustering_api, codex_dimmension_reduction_api\n")
        self.sessions[session]["returnCode"].append("import codex_template_scan_api, codex_endmembers\n")
        self.sessions[session]["returnCode"].append("import codex_segmentation_api, codex_regression_api\n")
        self.sessions[session]["returnCode"].append("\n\n#### This code is an auto-generated output of your last session working in CODEX.\n\n")

    @expose('dump_code_to_file')
    def dump_code_to_file(self, returnedCodePath, session=None):
        '''
        Inputs:

        Outputs:

        '''
        session = self.__set_session(session)

        file = open(returnedCodePath, 'w+')

        self.sessions[session]["returnCode"] = code_unique(self.sessions[session]["returnCode"])

        for line in self.sessions[session]["returnCode"]:
            file.write(line)

        file.close()

def code_unique(seq):
    seen = set()
    seen_add = seen.add
    return [x for x in seq if not (x in seen or seen_add(x))]

def assert_session(sessionKey):
    '''
    Inputs:
        sessionKey (string)  - session key for the data set you wish to access

    Outputs:
        None

    Notes:
        Ensures a session is active

    '''

    if sessionKey is None:
        raise NoSessionSpecifiedError()


def memoize(func):
    cache = dict()

    def make_key(args, kwargs):
        return (args, kwargs)
        #return ','.join([repr(a) for a in args]) + ','.join([k + '=' + repr(kwargs[k]) for k in kwargs])

    def memoized_func(*args, **kwargs):
        if make_key(args, kwargs) in cache:
            return cache[args]
        result = func(*args, **kwargs)
        cache[make_key(args, kwargs)] = result
        return result

    return memoized_func

class WrappedCache:
    '''
    Create a cache, and ensure that it connects to the proper bind address.
    Alternatively, create a local cache if the DOCTEST_SESSION is passed in.
    '''
    sessionKey = None
    cache = None

    def __init__(self, sessionKey, timeout=5_000, cache=None):
        '''
        Inputs:
            sessionKey (string)  - session key for the data set you wish to access

        Notes:
            Use the special test string DOCTEST_SESSION to force a local instantiation of the hash set
        '''
        assert_session(sessionKey)
        self.sessionKey = sessionKey

        if cache is not None:
            # allow for passthrough
            self.cache = cache
        elif self.sessionKey == DOCTEST_SESSION and not ('CODEX_LIVE_TEST' in os.environ):
            # if we're in a doctest session, instantiate the cache directly
            self.cache = CodexHash()
        else:
            # TODO: connect to a remote session (spec to DEFAULT_CODEX_HASH_BIND)
            self.cache = Client(DEFAULT_CODEX_HASH_CONNECT, timeout=timeout)



    def __getattr__(self, name):
        return functools.partial(getattr(self.cache, name), session=self.sessionKey)

def get_cache(session, timeout=5_000):
    '''
    Inputs:
        session {string/WrappedCache} - session key to connect to OR a wrapped cache (for local testing only)

    Note:
        If you pass in a session with a key that is not the DOCTEST_SESSION key, a warning will be generated.

    '''
    if isinstance(session, WrappedCache):
        return session

    # otherwise, return a new cache connection
    return WrappedCache(session, timeout=timeout)

def create_cache_server(launch=True):

    if launch:
        return Server(CodexHash()).listen(DEFAULT_CODEX_HASH_BIND)
    else:
        return Server(CodexHash())

def stop_cache_server():
    return Client(DEFAULT_CODEX_HASH_CONNECT)._shutdown()

if __name__ == "__main__":
    
    if 'server' in sys.argv:
        create_cache_server()

