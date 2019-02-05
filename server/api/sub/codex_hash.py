import codex_system
'''
Author: Jack Lightholder
Date  : 7/15/17

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
import numpy as np
import os
import psutil
import time
CODEX_ROOT = os.getenv('CODEX_ROOT')

# CODEX Support

featureList = []
subsetList = []
downsampleList = []
labelList = []

debug = True


def printCacheCount():
    '''
    Inputs:

    Outputs:

    Examples:
    >>> resetCacheList("feature")
    >>> resetCacheList("subset")
    >>> resetCacheList("downsample")
    >>> resetCacheList("label")

    >>> x1 = np.array([2,3,1,0])
    >>> hashResult = hashArray("x1", x1, "feature")
    >>> hashResult = hashArray("x2", x1, "feature")
    >>> hashResult = hashArray("s1", x1, "subset")
    >>> printCacheCount()
    Feature Cache Size    : 1
    Subset Cache Size     : 1
    Downsample Cache Size : 0
    '''
    codex_system.codex_log("Feature Cache Size    : " + str(len(featureList)))
    codex_system.codex_log("Subset Cache Size     : " + str(len(subsetList)))
    codex_system.codex_log("Downsample Cache Size : " +
                           str(len(downsampleList)))


def remove_stale_data(verbose=False):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> x1 = np.array([2,3,1,0])
    >>> hashResult = hashArray("x1", x1, "feature")
    >>> hashResult = hashArray("x2", x1, "feature")
    >>> hashResult = hashArray("s1", x1, "subset")
    >>> remove_stale_data()

    >>> resetCacheList("feature")
    >>> resetCacheList("subset")
    >>> resetCacheList("downsample")
    >>> resetCacheList("label")

    >>> x1 = np.array([2,3,1,0])
    >>> hashResult = hashArray("s1", x1, "subset")
    >>> hashResult = hashArray("x1", x1, "feature")
    >>> hashResult = hashArray("x2", x1, "feature")
    >>> remove_stale_data()

    >>> resetCacheList("feature")
    >>> resetCacheList("subset")
    >>> resetCacheList("downsample")
    >>> resetCacheList("label")

    >>> x1 = np.array([2,3,1,0])
    >>> hashResult = hashArray("s1", x1, "downsample")
    >>> hashResult = hashArray("x1", x1, "feature")
    >>> hashResult = hashArray("x2", x1, "feature")
    >>> remove_stale_data()
    '''
    global featureList

    if(verbose):
        codex_system.codex_log("Before clearing cache:")
        printCacheCount()
        process = psutil.Process(os.getpid())
        current_ram = process.memory_info().rss
        codex_system.codex_log(current_ram)

    oldestTime = time.time()
    oldestType = "downsample"
    oldestName = ""

    for point in featureList:
        if(point["time"] < oldestTime):
            oldestTime = point["time"]
            oldestType = "feature"
            oldestName = point["name"]

    for point in subsetList:
        if(point["time"] < oldestTime):
            oldestTime = point["time"]
            oldestType = "subset"
            oldestName = point["name"]

    for point in downsampleList:
        if(point["time"] < oldestTime):
            oldestTime = point["time"]
            oldestType = "downsample"
            oldestName = point["name"]

    status = deleteHashName(oldestName, oldestType)
    if(status != True):
        codex_system.codex_log("Deleting hash failed")
        return None

    if(verbose):
        codex_system.codex_log("After clearing cache:")
        printCacheCount()
        process = psutil.Process(os.getpid())
        current_ram = process.memory_info().rss
        print(current_ram)


def deleteHashName(name, hashType):

    delIndex = None

    if(hashType == "subset"):

        length = len(subsetList)
        for x in range(0, length):
            if(name == subsetList[x]["name"]):
                delIndex = x

        if(delIndex is not None):
            del subsetList[delIndex]
            return True
        else:
            return False

    elif(hashType == "feature"):

        length = len(featureList)
        for x in range(0, length):
            if(name == featureList[x]["name"]):
                delIndex = x

        if(delIndex is not None):
            del featureList[delIndex]
            return True
        else:
            return False

    elif(hashType == "downsample"):

        length = len(downsampleList)
        for x in range(0, length):
            if(name == downsampleList[x]["name"]):
                delIndex = x

        if(delIndex is not None):
            del downsampleList[delIndex]
            return True
        else:
            return False

    elif(hashType == "label"):

        length = len(labelList)
        for x in range(0, length):
            if(name == labelList[x]["name"]):
                delIndex = x

        if(delIndex is not None):
            del labelList[delIndex]
            return True
        else:
            return False

    else:

        return False


def hashUpdate(field, old, new, hashType):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> resetCacheList("subset")
    >>> resetCacheList("feature")
    >>> resetCacheList("downsample")
    >>> resetCacheList("label")

    >>> x1 = np.array([2,3,1,0])
    >>> hashResult = hashArray("x1", x1, "subset")

    >>> printHashList("subset")
    Name: x1
    Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
    Data Shape: (4,)
    Color: None
    Z-Order: None

    >>> result = hashUpdate("name","x1","x2","subset")

    >>> printHashList("subset")
    Name: x2
    Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
    Data Shape: (4,)
    Color: None
    Z-Order: None

    '''

    result = findHashArray(field, old, hashType)
    status = deleteHashName(old, hashType)
    result[field] = new

    if(hashType == "subset"):
        subsetList.append(result)
    elif(hashType == "downsample"):
        downsampleList.append(result)
    elif(hashType == "label"):
        labelList.append(result)
    elif(hashType == "feature"):
        featureList.append(result)
    else:
        return False

    return True


def resetCacheList(hashType):
    '''
    Inputs:

    Outputs:

    Examples:
    >>> resetCacheList("downsample")
    >>> resetCacheList("feature")
    >>> resetCacheList("subset")
    >>> resetCacheList("label")
    >>> resetCacheList("unknown")
    Unknown hash type.  Not resetting

    '''

    if(hashType == "feature"):
        global featureList
        featureList = []
    elif(hashType == "downsample"):
        global downsampleList
        downsampleList = []
    elif(hashType == "subset"):
        global subsetList
        subsetList = []
    elif(hashType == "label"):
        global labelList
        labelList = []
    else:
        codex_system.codex_log("Unknown hash type.  Not resetting")


def hashArray(arrayName, inputArray, hashType):
    '''
    Inputs:
        arrayName (string)    - Name of the data set.  Used in visalization for easy human data recognition
        inputArray (np aray)  - Data to be hashed.  Numpy ND array.  If integers, casted to float for storage
        hashType (string)     - Hash log to store data in {feature, subset, downsample, label}

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
    >>> x1 = np.array([2,3,1,0])
    >>> hashResult = hashArray("x1", x1, "feature")
    >>> print(hashResult['hash'])
    bb99f457e6632e9944b801e6c53ad7353e08ce00

    >>> hashResult = hashArray("x1", x1, "subset")
    >>> print(hashResult['hash'])
    bb99f457e6632e9944b801e6c53ad7353e08ce00

    # Incorrect hashType input
    >>> hashArray("x1",x1,"log")
    ERROR: Hash type not recognized! Not logged for future use.

    >>> resetCacheList("feature")
    >>> x1 = np.array([2,3,1,0])
    >>> hashResult = hashArray("x1", x1, "feature")

    >>> x1 = np.array([2,3,1,0])
    >>> hashResult = hashArray("x1", x1, "feature")

    >>> printHashList("feature")
    Name: x1
    Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
    Data Shape: (4,)
    Color: None
    Z-Order: None
    '''

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
        inputArray = codex_system.string2token(inputArray)

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
        "color": None,
        "z-order": None}

    if(hashType == "feature"):
        if not any(d['hash'] == newHash["hash"] for d in featureList):
            featureList.append(newHash)
    elif(hashType == "subset"):
        if not any(d['hash'] == newHash["hash"] for d in subsetList):
            subsetList.append(newHash)
    elif(hashType == "downsample"):
        if not any(d['hash'] == newHash["hash"] for d in downsampleList):
            downsampleList.append(newHash)
    elif(hashType == "label"):
        if not any(d['name'] == newHash["name"] for d in labelList):
            labelList.append(newHash)
    elif(hashType == "NOSAVE"):
        pass
    else:
        codex_system.codex_log(
            "ERROR: Hash type not recognized! Not logged for future use.")
        return None

    return newHash


def printHashList(hashType):
    '''
    Inputs:
        hashType (string) - {feature, subset} print the requested hash list. Used in debugging

    Outputs:
        NONE

    Examples:
    >>> resetCacheList("subset")
    >>> resetCacheList("feature")

    >>> x1 = np.array([2,3,1,0])
    >>> hashResult = hashArray("x1_feature", x1, "feature")
    >>> hashResult = hashArray("x1_subset", x1, "subset")
    >>> hashResult = hashArray("x1_downsample", x1, "downsample")
    >>> hashResult = hashArray("x1_label", x1, "label")

    >>> printHashList("feature")
    Name: x1_feature
    Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
    Data Shape: (4,)
    Color: None
    Z-Order: None

    >>> printHashList("subset")
    Name: x1_subset
    Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
    Data Shape: (4,)
    Color: None
    Z-Order: None

    >>> printHashList("downsample")
    Name: x1_downsample
    Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
    Data Shape: (4,)
    Color: None
    Z-Order: None

    >>> printHashList("label")
    Name: x1_label
    Hash: bb99f457e6632e9944b801e6c53ad7353e08ce00
    Data Shape: (4,)
    Color: None
    Z-Order: None

    >>> printHashList("unknown")
    ERROR: printHashList - unknown hashType
    '''

    if(hashType == "feature"):

        for point in featureList:
            codex_system.codex_log("Name: " + point['name'])
            codex_system.codex_log("Hash: " + point['hash'])
            codex_system.codex_log("Data Shape: " + str(point['data'].shape))
            codex_system.codex_log("Color: " + str(point["color"]))
            codex_system.codex_log("Z-Order: " + str(point["z-order"]))

    elif(hashType == "subset"):

        for point in subsetList:
            codex_system.codex_log("Name: " + point['name'])
            codex_system.codex_log("Hash: " + point['hash'])
            codex_system.codex_log("Data Shape: " + str(point['data'].shape))
            codex_system.codex_log("Color: " + str(point["color"]))
            codex_system.codex_log("Z-Order: " + str(point["z-order"]))

    elif(hashType == "downsample"):

        for point in downsampleList:
            codex_system.codex_log("Name: " + point['name'])
            codex_system.codex_log("Hash: " + point['hash'])
            codex_system.codex_log("Data Shape: " + str(point['data'].shape))
            codex_system.codex_log("Color: " + str(point["color"]))
            codex_system.codex_log("Z-Order: " + str(point["z-order"]))

    elif(hashType == "label"):

        for point in labelList:
            codex_system.codex_log("Name: " + point['name'])
            codex_system.codex_log("Hash: " + point['hash'])
            codex_system.codex_log("Data Shape: " + str(point['data'].shape))
            codex_system.codex_log("Color: " + str(point["color"]))
            codex_system.codex_log("Z-Order: " + str(point["z-order"]))

    else:
        codex_system.codex_log("ERROR: printHashList - unknown hashType")


def findHashArray(field, name, hashType):
    '''
    Inputs:
        name     (string) - hash string for the data set you wish to access
        hashType (string)  - hash category of the data set {feature, subset}

    Outputs:
        hashArray function defined dictionary of information about data set

    Examples:
    >>> resetCacheList("feature")
    >>> resetCacheList("subset")
    >>> resetCacheList("downsample")
    >>> resetCacheList("label")

    >>> x1 = np.array([2,3,1,0])
    >>> hashResult_feature = hashArray("x1_feature", x1, "feature")
    >>> hashResult_subset = hashArray("x1_subset", x1, "subset")
    >>> hashResult_feature = hashArray("x1_downsample", x1, "downsample")
    >>> hashResult_subset = hashArray("x1_label", x1, "label")

    >>> result = findHashArray('hash',hashResult_feature["hash"],"feature")
    >>> print(result["hash"])
    bb99f457e6632e9944b801e6c53ad7353e08ce00

    >>> result = findHashArray('hash',hashResult_subset["hash"],"subset")
    >>> print(result["hash"])
    bb99f457e6632e9944b801e6c53ad7353e08ce00

    >>> result = findHashArray('hash',hashResult_subset["hash"],"downsample")
    >>> print(result["hash"])
    bb99f457e6632e9944b801e6c53ad7353e08ce00

    >>> result = findHashArray('hash',hashResult_subset["hash"],"label")
    >>> print(result["hash"])
    bb99f457e6632e9944b801e6c53ad7353e08ce00

    >>> result = findHashArray('hash',"4f584718a8fa7b54716b48075b3332","label")
    >>> print(result)
    None

    >>> result = findHashArray('hash',hashResult_subset["hash"],"unknown_type")
    ERROR: findHashArray - hash not found
    '''

    if(hashType == "feature"):

        for point in featureList:
            if(point[field] == name):
                return point
        return None

    elif(hashType == "subset"):

        for point in subsetList:
            if(point[field] == name):
                return point
        return None

    elif(hashType == "downsample"):

        for point in downsampleList:
            if(point[field] == name):
                return point
        return None

    elif(hashType == "label"):

        for point in labelList:
            if(point[field] == name):
                return point
        return None

    else:
        codex_system.codex_log("ERROR: findHashArray - hash not found")
        return None


def mergeHashResults(hashList, verbose=False):
    '''
    Inputs:
        hashList (list)      - list of hash strings to be merged into a new accessible data set

    Outputs:
        hashArray (np array) - merged numpy nd-array of individual from hashList input

    Examples:
    >>> mergeHashResults(None)
    ERROR: mergeHashResults hashList is None

    '''
    if(hashList is None):
        codex_system.codex_log("ERROR: mergeHashResults hashList is None")
        return None

    if(hashList == []):
        codex_system.codex_log("ERROR: mergeHashResults hashList is empty")
        return None

    totalFeatures = len(hashList)

    if(verbose):
        codex_system.codex_log("Number of features: " + str(totalFeatures))

    currentHash = hashList[0]
    result = findHashArray("hash", currentHash, "feature")
    if(result is None):
        codex_system.codex_log("Warning, hash not found in mergeHashResults")
        return None

    returnArray = result['data']
    returnName = result['name']

    if(verbose):
        codex_system.codex_log("Merging: " + returnName)

    for featureNum in range(1, totalFeatures):
        currentHash = hashList[featureNum]
        result = findHashArray("hash", currentHash, "feature")
        if(result is None):
            codex_system.codex_log(
                "Warning, hash not found in mergeHashResults")
            return None

        resultArray = result['data']
        resultName = result['name']

        if(verbose):
            codex_system.codex_log("Merging: " + resultName)

        try:
            (s1, f1) = returnArray.shape
        except BaseException:
            s1 = returnArray.size

        s2 = resultArray.size

        if(s1 == s2):
            returnArray = np.column_stack((resultArray, returnArray))
        else:
            # TODO - long term, how do we want to handle this?
            codex_system.codex_log(
                "WARNING: " +
                resultName +
                " does not match shape of previous features(" +
                str(s1) +
                "/" +
                str(s2) +
                "). Exlucding.")

    return returnArray


def feature2hashList(featureList):

    hashList = []
    for feature in featureList:
        r = findHashArray("name", feature, "feature")
        if(r is not None):
            hashList.append(r['hash'])
        else:
            codex_system.codex_log(
                "WARNING: feature2hashList - could not add " +
                feature +
                " to feature list.")
    return hashList


def applySubsetMask(featureArray, subsetHash):
    '''
    Inputs:
        featureArray (np array) - feature to which subset mask will be applied
        subsetHash (string)     - reference hash for the subset which should be applied to featureArray

    Outputs:
        resultArray (np array)  - featureArray data with subset mask applied
        subsetHashName (string) - name of the resulting hash with subset applied.

    Examples:

    '''
    subsetHashName = None

    returnDict = findHashArray("hash", subsetHash, "subset")
    if(returnDict is None):
        codex_system.codex_log("Hash not found. Returning!")
        return None

    indexArray = returnDict['data']
    resultList = []

    try:
        x1, y1 = featureArray.shape
        x2 = indexArray.size

        if(x1 != x2):
            codex_system.codex_log("Error: mask must match length of feature")
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
            codex_system.codex_log("Error: mask must match length of feature")
            return None

        included = np.count_nonzero(indexArray)
        outData = np.zeros(included)

        count = 0
        for x in range(0, x1):
            if(indexArray[x] == 1):
                outData[count] = featureArray[x]
                count += 1

        return outData, returnDict['name']


if __name__ == "__main__":

    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)
