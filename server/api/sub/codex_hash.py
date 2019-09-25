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

import numpy as np

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

# IPC support
from api.sub.ntangle.client import Client
from api.sub.ntangle.server import Server
from api.sub.ntangle.server import expose

# CODEX Support
from api.sub.codex_system import codex_log
from api.sub.codex_system import string2token

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
            # not using codex_log bc it breaks tests unnecessarily
            # sys.stderr.write('Creating a new session for key {}'.format(sessionKey));
            # sys.stderr.flush()
            self.sessions[sessionKey] = {
                "featureList": [],
                "subsetList": [],
                "downsampleList": [],
                "labelList": [],
                "classifierList": [],
                "regressorList": []
            }
        return sessionKey

    @expose('printCacheCount')
    def printCacheCount(self, session=None):
        '''
        Inputs:

        Outputs:

        Examples:
        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> ch.resetCacheList("feature", session=session)
        >>> ch.resetCacheList("subset", session=session)
        >>> ch.resetCacheList("downsample", session=session)
        >>> ch.resetCacheList("label", session=session)

        >>> x1 = np.array([2,3,1,0])
        >>> hashResult = ch.hashArray("x1", x1, "feature", session=session)
        >>> hashResult = ch.hashArray("x2", x1, "feature", session=session)
        >>> hashResult = ch.hashArray("s1", x1, "subset", session=session)
        >>> ch.printCacheCount(session=session)
        Feature Cache Size           : 1
        Subset Cache Size            : 1
        Downsample Cache Size        : 0
        Number of classifier models  : 0
        Number of regressor models   : 1
        '''
        session = self.__set_session(session)

        codex_log("Feature Cache Size           : " + str(len(self.sessions[session]["featureList"])))
        codex_log("Subset Cache Size            : " + str(len(self.sessions[session]["subsetList"])))
        codex_log("Downsample Cache Size        : " + str(len(self.sessions[session]["downsampleList"])))
        codex_log("Number of classifier models  : " + str(len(self.sessions[session]["regressorList"])))
        codex_log("Number of regressor models   : " + str(len(self.sessions[session]["classifierList"])))

    @expose('remove_stale_data')
    def remove_stale_data(self, verbose=False, session=None):
        '''
        Inputs:

        Outputs:

        Examples:
        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> x1 = np.array([2,3,1,0])
        >>> hashResult = ch.hashArray("x1", x1, "feature", session=session)
        >>> hashResult = ch.hashArray("x2", x1, "feature", session=session)
        >>> hashResult = ch.hashArray("s1", x1, "subset", session=session)
        >>> ch.remove_stale_data(session=session)

        >>> ch.resetCacheList("feature", session=session)
        >>> ch.resetCacheList("subset", session=session)
        >>> ch.resetCacheList("downsample", session=session)
        >>> ch.resetCacheList("label", session=session)

        >>> x1 = np.array([2,3,1,0])
        >>> hashResult = ch.hashArray("s1", x1, "subset", session=session)
        >>> hashResult = ch.hashArray("x1", x1, "feature", session=session)
        >>> hashResult = ch.hashArray("x2", x1, "feature", session=session)
        >>> ch.remove_stale_data(session=session)

        >>> ch.resetCacheList("feature", session=session)
        >>> ch.resetCacheList("subset", session=session)
        >>> ch.resetCacheList("downsample", session=session)
        >>> ch.resetCacheList("label", session=session)

        >>> x1 = np.array([2,3,1,0])
        >>> hashResult = ch.hashArray("s1", x1, "downsample", session=session)
        >>> hashResult = ch.hashArray("x1", x1, "feature", session=session)
        >>> hashResult = ch.hashArray("x2", x1, "feature", session=session)
        >>> ch.remove_stale_data(session=session)
        '''
        session = self.__set_session(session)

        if(verbose):
            codex_log("Before clearing cache:")
            self.printCacheCount(session=session)
            process = psutil.Process(os.getpid())
            current_ram = process.memory_info().rss
            codex_log(current_ram)

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
            codex_log("Deleting hash failed")
            return None

        if(verbose):
            codex_log("After clearing cache:")
            self.printCacheCount(session=session)
            process = psutil.Process(os.getpid())
            current_ram = process.memory_info().rss
            print(current_ram)


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

        Examples:
        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> ch.resetCacheList("subset", session=session)
        >>> ch.resetCacheList("feature", session=session)
        >>> ch.resetCacheList("downsample", session=session)
        >>> ch.resetCacheList("label", session=session)

        >>> x1 = np.array([2,3,1,0])
        >>> hashResult = ch.hashArray("x1", x1, "subset", session=session)

        >>> ch.printHashList("subset", session=session)
        Name: x1
        Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
        Data Shape: (4,)
        Color: None
        Z-Order: None

        >>> result = ch.hashUpdate("name","x1","x2","subset", session=session)

        >>> ch.printHashList("subset", session=session)
        Name: x2
        Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
        Data Shape: (4,)
        Color: None
        Z-Order: None

        '''
        session = self.__set_session(session)

        result = self.findHashArray(field, old, hashType, session=session)
        status = self.deleteHashName(old, hashType, session=session)
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

        Examples:
        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> ch.resetCacheList("downsample", session=session)
        >>> ch.resetCacheList("feature", session=session)
        >>> ch.resetCacheList("subset", session=session)
        >>> ch.resetCacheList("label", session=session)
        >>> ch.resetCacheList("unknown", session=session)
        Unknown hash type.  Not resetting

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
            codex_log("Unknown hash type.  Not resetting")

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

        Notes:

        Examples:
        # Standard completion check
        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> x1 = np.array([2,3,1,0])
        >>> hashResult = ch.hashArray("x1", x1, "feature", session=session)
        >>> print(hashResult['hash'])
        bb99f457e6632e9944b801e6c53ad7353e08ce00

        >>> hashResult = ch.hashArray("x1", x1, "subset", session=session)
        >>> print(hashResult['hash'])
        bb99f457e6632e9944b801e6c53ad7353e08ce00

        # Incorrect hashType input
        >>> ch.hashArray("x1",x1,"log", session=session)
        ERROR: Hash type not recognized! Not logged for future use.

        >>> ch.resetCacheList("feature", session=session)
        >>> x1 = np.array([2,3,1,0])
        >>> hashResult = ch.hashArray("x1", x1, "feature", session=session)

        >>> x1 = np.array([2,3,1,0])
        >>> hashResult = ch.hashArray("x1", x1, "feature", session=session)

        >>> ch.printHashList("feature", session=session)
        Name: x1
        Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
        Data Shape: (4,)
        Color: None
        Z-Order: None
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
            codex_log("ERROR: Hash type not recognized! Not logged for future use.")
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

        if(np.isneginf(combined_unique).any()):
            sentinel_values['ninf'] = round((max_val * 10) + 1)

        if(np.isinf(combined_unique).any()):
            sentinel_values['inf']  = round((max_val * 10) + 2)

        return sentinel_values

    def printHashList(self, hashType, session=None):
        '''
        Inputs:
            hashType (string) - {feature, subset} print the requested hash list. Used in debugging

        Outputs:
            NONE

        Examples:
        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> ch.resetCacheList("subset", session=session)
        >>> ch.resetCacheList("feature", session=session)

        >>> x1 = np.array([2,3,1,0])
        >>> hashResult = ch.hashArray("x1_feature", x1, "feature", session=session)
        >>> hashResult = ch.hashArray("x1_subset", x1, "subset", session=session)
        >>> hashResult = ch.hashArray("x1_downsample", x1, "downsample", session=session)
        >>> hashResult = ch.hashArray("x1_label", x1, "label", session=session)

        >>> ch.printHashList("feature", session=session)
        Name: x1_feature
        Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
        Data Shape: (4,)
        Color: None
        Z-Order: None

        >>> ch.printHashList("subset", session=session)
        Name: x1_subset
        Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
        Data Shape: (4,)
        Color: None
        Z-Order: None

        >>> ch.printHashList("downsample", session=session)
        Name: x1_downsample
        Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
        Data Shape: (4,)
        Color: None
        Z-Order: None

        >>> ch.printHashList("label", session=session)
        Name: x1_label
        Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
        Data Shape: (4,)
        Color: None
        Z-Order: None

        >>> ch.printHashList("unknown", session=session)
        ERROR: printHashList - unknown hashType
        '''
        session = self.__set_session(session)

        if(hashType == "feature"):

            for point in self.sessions[session]["featureList"]:
                codex_log("Name: " + point['name'])
                codex_log("Hash: " + point['hash'])
                codex_log("Data Shape: " + str(point['data'].shape))
                codex_log("Color: " + str(point["color"]))
                codex_log("Z-Order: " + str(point["z-order"]))

        elif(hashType == "subset"):

            for point in self.sessions[session]["subsetList"]:
                codex_log("Name: " + point['name'])
                codex_log("Hash: " + point['hash'])
                codex_log("Data Shape: " + str(point['data'].shape))
                codex_log("Color: " + str(point["color"]))
                codex_log("Z-Order: " + str(point["z-order"]))

        elif(hashType == "downsample"):

            for point in self.sessions[session]["downsampleList"]:
                codex_log("Name: " + point['name'])
                codex_log("Hash: " + point['hash'])
                codex_log("Data Shape: " + str(point['data'].shape))
                codex_log("Color: " + str(point["color"]))
                codex_log("Z-Order: " + str(point["z-order"]))

        elif(hashType == "label"):

            for point in self.sessions[session]["labelList"]:
                codex_log("Name: " + point['name'])
                codex_log("Hash: " + point['hash'])
                codex_log("Data Shape: " + str(point['data'].shape))
                codex_log("Color: " + str(point["color"]))
                codex_log("Z-Order: " + str(point["z-order"]))

        else:
            codex_log("ERROR: printHashList - unknown hashType")

    @expose('findHashArray')
    def findHashArray(self, field, name, hashType, session=None):
        '''
        Inputs:
            name     (string)  - hash string for the data set you wish to access
            hashType (string)  - hash category of the data set {feature, subset}

        Outputs:
            hashArray function defined dictionary of information about data set

        Examples:
        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> ch.resetCacheList("feature", session=session)
        >>> ch.resetCacheList("subset", session=session)
        >>> ch.resetCacheList("downsample", session=session)
        >>> ch.resetCacheList("label", session=session)

        >>> x1 = np.array([2,3,1,0])
        >>> hashResult_feature = ch.hashArray("x1_feature", x1, "feature", session=session)
        >>> hashResult_subset = ch.hashArray("x1_subset", x1, "subset", session=session)
        >>> hashResult_feature = ch.hashArray("x1_downsample", x1, "downsample", session=session)
        >>> hashResult_subset = ch.hashArray("x1_label", x1, "label", session=session)

        >>> result = ch.findHashArray('hash',hashResult_feature["hash"],"feature", session=session)
        >>> print(result["hash"])
        bb99f457e6632e9944b801e6c53ad7353e08ce00

        >>> result = ch.findHashArray('hash',hashResult_subset["hash"],"subset", session=session)
        >>> print(result["hash"])
        bb99f457e6632e9944b801e6c53ad7353e08ce00

        >>> result = ch.findHashArray('hash',hashResult_subset["hash"],"downsample", session=session)
        >>> print(result["hash"])
        bb99f457e6632e9944b801e6c53ad7353e08ce00

        >>> result = ch.findHashArray('hash',hashResult_subset["hash"],"label", session=session)
        >>> print(result["hash"])
        bb99f457e6632e9944b801e6c53ad7353e08ce00

        >>> result = ch.findHashArray('hash',"4f584718a8fa7b54716b48075b3332","label", session=session)
        >>> print(result)
        None

        >>> result = ch.findHashArray('hash',hashResult_subset["hash"],"unknown_type", session=session)
        ERROR: findHashArray - hash not found
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
            codex_log("ERROR: findHashArray - hash not found")
            return None

    @expose('mergeHashResults')
    def mergeHashResults(self, hashList, verbose=False, session=None):
        '''
        Inputs:
            hashList (list)      - list of hash strings to be merged into a new accessible data set

        Outputs:
            hashArray (np array) - merged numpy nd-array of individual from hashList input

        Examples:
        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> ch.mergeHashResults(None, session=session)
        ERROR: mergeHashResults hashList is None

        '''
        session = self.__set_session(session)
        
        if(hashList is None):
            codex_log("ERROR: mergeHashResults hashList is None")
            return None

        if(hashList == []):
            codex_log("ERROR: mergeHashResults hashList is empty")
            return None

        totalFeatures = len(hashList)

        if(verbose):
            codex_log("Number of features: " + str(totalFeatures))

        currentHash = hashList[0]
        result = self.findHashArray("hash", currentHash, "feature", session=session)
        if(result is None):
            codex_log("Warning, hash not found in mergeHashResults")
            return None

        returnArray = result['data']
        returnName = result['name']


        if(verbose):
            codex_log("Merging: " + returnName)

        for featureNum in range(1, totalFeatures):
            currentHash = hashList[featureNum]
            result = self.findHashArray("hash", currentHash, "feature", session=session)
            if(result is None):
                codex_log("Warning, hash not found in mergeHashResults")
                return None

            resultArray = result['data']
            resultName = result['name']

            if(verbose):
                codex_log("Merging: " + resultName)

            try:
                (s1, f1) = returnArray.shape
            except BaseException:
                s1 = returnArray.size

            s2 = resultArray.size

            if(s1 == s2):
                returnArray = np.column_stack((resultArray, returnArray))
            else:
                # TODO - long term, how do we want to handle this?
                codex_log("WARNING: {resultName} does not match shape of previous features(" + str(s1) + "/" +str(s2) + "). Exlucding.".format(resultName=resultName))
    
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
                codex_log("WARNING: feature2hashList - could not add {feature} to feature list.".format(feature=feature))
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

        Examples:

        '''
        session = self.__set_session(session)

        subsetHashName = None

        returnDict = self.findHashArray("hash", subsetHash, "subset", session=session)
        if(returnDict is None):
            codex_log("Hash not found. Returning!")
            return None

        indexArray = returnDict['data']
        resultList = []

        try:
            x1, y1 = featureArray.shape
            x2 = indexArray.size

            if(x1 != x2):
                codex_log("Error: mask must match length of feature")
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
                codex_log("Error: mask must match length of feature")
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
    def pickle_data(self, session_name, front_end_state, session=None):
        '''
        Inputs:

        Outputs:

        Notes:

        Examples:

        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> from sklearn import datasets, linear_model
        >>> diabetes = datasets.load_diabetes()
        >>> regr = linear_model.LinearRegression()
        >>> regr.fit(diabetes.data, diabetes.target)
        LinearRegression(copy_X=True, fit_intercept=True, n_jobs=None,
                 normalize=False)

        >>> model = ch.saveModel("test", regr, "classifier", session=session)
        >>> model is not None
        True

        >>> ch.resetCacheList("feature", session=session)
        >>> ch.resetCacheList("subset", session=session)
        >>> ch.resetCacheList("downsample", session=session)
        >>> ch.resetCacheList("label", session=session)

        >>> x1 = np.array([2,3,1,0])

        >>> hashResult = ch.hashArray("x1", x1, "feature", session=session)
        >>> hashResult = ch.hashArray("x1", x1, "subset", session=session)
        >>> hashResult = ch.hashArray("x1", x1, "downsample", session=session)
        >>> hashResult = ch.hashArray("x1", x1, "label", session=session)

        >>> ch.pickle_data("test_session", {"front_end_payload":"payload_value"}, session=session)

        '''
        session = self.__set_session(session)

        session_path = os.path.join(CODEX_ROOT, 'sessions', session_name)
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

    @expose('unpickle_data')
    def unpickle_data(self, session_name, session=None):
        '''
        Inputs:

        Outputs:

        Notes: Currently send all features, downsamples, subsets and labels to the front end on load.
                This is because plotting is directly on the front end currently, so they need to store all data.
                This needs to be moved to a back end query functionality, since we'll run out of front end space.

        Examples:

        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> ch.unpickle_data("test_session", session=session)
        {'features': ['x1'], 'labels': ['x1'], 'subsets': ['x1'], 'downsample': ['x1'], 'state': {'front_end_payload': 'payload_value'}}

        >>> ch.printCacheCount(session=session)
        Feature Cache Size           : 1
        Subset Cache Size            : 1
        Downsample Cache Size        : 1
        Number of classifier models  : 0
        Number of regressor models   : 1
        '''
        session = self.__set_session(session)

        session_path = os.path.join(CODEX_ROOT, 'sessions', session_name)
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

        Notes:

        Examples:

        >>> session = 'foo'
        >>> ch = CodexHash()
        >>> from sklearn import datasets, linear_model
        >>> diabetes = datasets.load_diabetes()
        >>> regr = linear_model.LinearRegression()
        >>> regr.fit(diabetes.data, diabetes.target)
        LinearRegression(copy_X=True, fit_intercept=True, n_jobs=None,
                 normalize=False)

        >>> model = ch.saveModel("test", regr, "classifier", session=session)
        >>> model is not None
        True

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
            codex_log("ERROR: Model hash type not recognized! Not logged for future use.")
            return None

        return newHash

    @expose('import_hd5')
    def import_hd5(self, filepath, session=None):
        import codex_read_data_api
        hashList, featureList = codex_read_data_api.codex_read_hd5(filepath, None, "feature", session=WrappedCache(session, cache=self))
    
        return hashList, featureList

    @expose('import_csv')
    def import_csv(self, filepath, session=None):
        import codex_read_data_api

        hashList, featureList = codex_read_data_api.codex_read_csv(filepath, None, "feature", session=WrappedCache(session, cache=self))

        return hashList, featureList

    @expose('import_npy')
    def import_npy(self, filepath, session=None):
        import codex_read_data_api

        hashList, featureList = codex_read_data_api.codex_read_npy(filepath, None, "feature", session=WrappedCache(session, cache=self))

        return hashList, featureList

def assert_session(sessionKey):
    '''
    Inputs:
        sessionKey (string)  - session key for the data set you wish to access

    Outputs:
        None

    Notes:
        Ensures a session is active

    >>> assert_session('SomeSessionKey')
    >>> assert_session(None)
    Traceback (most recent call last):
        ...
    NoSessionSpecifiedError
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


        >>> WrappedCache(None)
        Traceback (most recent call last):
            ...
        NoSessionSpecifiedError
        >>> WrappedCache(DOCTEST_SESSION)
        <__main__.WrappedCache object at 0x...>
        >>> cache = WrappedCache('SomeSessionKey')
        Traceback (most recent call last):
            ...
        OSError: Connection to codex_hash dropped
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

    >>> get_cache('SomeSessionKey')
    Traceback (most recent call last):
        ...
    OSError: Connection to codex_hash dropped

    >>> cache = get_cache(DOCTEST_SESSION)
    >>> get_cache(cache)
    <__main__.WrappedCache object at 0x...>
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

    else:

        from api.sub.codex_doctest import run_codex_doctest
        #run_codex_doctest() # TODO - tests currently hang somewhere. 
    

