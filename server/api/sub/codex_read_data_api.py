'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Read/write and file management for CODEX

Notes : 
'''
import os
import numpy as np
from collections import defaultdict
from sklearn.neighbors import kneighbors_graph
from sklearn.preprocessing import StandardScaler
import h5py, csv, time
import matplotlib.pyplot as plt
import pandas as pd
import os, errno
from matplotlib.image import imread
from PIL import Image
import sys

# Enviornment variable for setting CODEX root directory.
CODEX_ROOT  = os.getenv('CODEX_ROOT')
import sys
sys.path.insert(1,CODEX_ROOT + '/api/sub/')

# CODEX Support
import codex_system
import codex_hash
import codex_return_code
import codex_doctest

def codex_read_csv(file, featureList, hashType):
    '''
    Inuputs:

    Outputs:

    Examples:
    >>> featureList = ['TiO2','FeOT','SiO2','Total']
    >>> hashList = codex_read_csv(CODEX_ROOT + '/../../uploads/missing.csv',featureList, "feature")
    ERROR: codex_read_csv - cannot open file

    >>> featureList = ['fake_feature','FeOT','SiO2','Total']
    >>> hashList = codex_read_csv(CODEX_ROOT + '/../../uploads/doctest.csv',featureList, "feature")


    '''
    hashList = []
    columns = defaultdict(list)

    try:
        with open(file) as f:
            reader = csv.DictReader(f)
            for row in reader:
                for (k,v) in row.items():
                    columns[k].append(v)
        f.close()		 
    except:
        codex_system.codex_log("ERROR: codex_read_csv - cannot open file")
        return None

    if(featureList is None):
        featureList = columns.keys()

    for feature_name in featureList:
        try:
            feature_data = columns[feature_name][:]
        except:
            codex_system.codex_log("Error: codex_read_csv: Feature not found.")
            return None

        if(type(feature_data) == list):
            feature_data = np.asarray(feature_data)

        try:
            feature_data = feature_data.astype(float)
        except:
            feature_data = codex_system.string2token(feature_data)

        feature_hash = codex_hash.hashArray(feature_name, feature_data, hashType)
        hashList.append(feature_hash['hash'])

    return hashList, list(featureList)


def codex_read_image(file, show=False):
    '''
    Inuputs:

    Outputs:

    Notes:
        PIL Image modes: https://pillow.readthedocs.io/en/3.1.x/handbook/concepts.html#concept-modes

    Examples:

    '''

    image = Image.open(file)
    if(image.format == "PNG"):
        pass
    elif(image.format == "JPEG"):
        bits = image.bits

    x,y = image.size

    if(show):	
        if(image.mode == "L"):
            imgplot = plt.imshow(image, cmap='gray')
        else:
            imgplot = plt.imshow(image)
        plt.show()
	
    pixels = list(image.getdata())
    width, height = image.size
    pixels = [pixels[i * width:(i + 1) * width] for i in range(height)]
    pixels = np.asarray(pixels)

    feature_hash = codex_hash.hashArray("image", pixels, "feature")
    dictionary = {"pixels": pixels, "rows": y, "cols": x}
    return dictionary

def traverse_datasets(hdf_file):
    '''
    Inuputs:

    Outputs:

    Notes:
        PIL Image modes: https://pillow.readthedocs.io/en/3.1.x/handbook/concepts.html#concept-modes

    Examples:

    '''
    def h5py_dataset_iterator(g, prefix=''):
        for key in g.keys():
            item = g[key]
            path = '{}/{}'.format(prefix, key)
            if isinstance(item, h5py.Dataset): # test for dataset
                yield (path, item)
            elif isinstance(item, h5py.Group): # test for group (go down)
                yield from h5py_dataset_iterator(item, path)

    with h5py.File(hdf_file, 'r') as f:
        for (path, dset) in h5py_dataset_iterator(f):
            yield path


def codex_read_hd5(file, featureList, hashType):
    '''
    Inuputs:

    Outputs:

    Notes:

    Examples:
    >>> featureList = ['L2/RetrievalGeometry/retrieval_latitude/','L2/RetrievalResults/xco2']
    >>> result = codex_read_hd5(CODEX_ROOT + '/../../uploads/lnd_glint_subsample_10000.h5',featureList, "feature")
    >>> print(result)
    ['314f2860593b8d3a5c8612693aed9232874210a3', '5d3d72c3ad2afcccb86d1693fd1a4b3bb39f407a']

    >>> featureList = ['L2/RetrievalGeometry/retrieval_latitude/','L2/RetrievalResults/xco2','missing_feature']
    >>> result = codex_read_hd5(CODEX_ROOT + '/../../uploads/lnd_glint_subsample_10000.h5',featureList, "feature")
    Error: codex_read_hd5: Feature not found.

    >>> result = codex_read_hd5(CODEX_ROOT + '/../../uploads/lnd_glint_subsample_1000.h5', featureList, "feature")
    ERROR: codex_read_hd5 - cannot open file
    '''
    hashList = []

    try:
        f = h5py.File(file, 'r+')
    except:
        codex_system.codex_log("ERROR: codex_read_hd5 - cannot open file")
        return None

    if(featureList is None):
        featureList = list(traverse_datasets(file))
 
    for feature_name in featureList:
        try:
            feature_data = f[feature_name][:]
        except:
            codex_system.codex_log("Error: codex_read_hd5: Feature not found.")
            return

        try:
            feature_data = feature_data.astype(float)
        except:
            feature_data = codex_system.string2token(feature_data)
            codex_system.codex_log("Log: codex_read_hd5: Tokenized " + feature_name)

        feature_hash = codex_hash.hashArray(feature_name, feature_data, hashType)
        hashList.append(feature_hash['hash'])

    f.close()
    return hashList, list(featureList)


def codex_read_npy(file, featureList, hashType):
    '''
    Inuputs:

    Outputs:

    Notes:

    Examples:

    '''
    hashList = []

    try:
        data = np.load(file)
    except:
        codex_system.codex_log("ERROR: codex_read_npy - cannot open file")
        return None

    samples, features = data.shape
    featureList = []
    for x in range(0,features):

        try:
            feature_data = data[:,x].astype(float)
        except:
            feature_data = codex_system.string2token(data[:,x])
            codex_system.codex_log("Log: codex_read_npy: Tokenized " + feature_name)

        feature_name = "feature_"+str(x)
        featureList.append(feature_name)
        feature_hash = codex_hash.hashArray(feature_name, feature_data, hashType)
        hashList.append(feature_hash['hash'])

    return hashList, featureList
    

def codex_save_subset(inputHash, subsetHash, saveFilePath):
    '''
    Inuputs:

    Outputs:

    Examples:
    >>> inputArray = np.array([10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200])
    >>> randomSubset = np.array([0,1,0,1,0,1,1,0,0,0,0,0,1,1,1,0,0,1,0,1])
    >>> inputHash = codex_hash.hashArray('input_array', inputArray, 'feature')
    >>> subsetHash = codex_hash.hashArray('subset_hash', randomSubset, 'subset')
    >>> outputHash,resultingName = codex_save_subset(inputHash['hash'], False, CODEX_ROOT + '/../../uploads/save_subset_output_test.h5')
    >>> readingHash = codex_read_hd5(CODEX_ROOT + '/../../uploads/save_subset_output_test.h5', [resultingName], "feature")

    >>> codex_save_subset(None, None, CODEX_ROOT + '../../uploads/')
    Hash not found. Returning!

    >>> inputArray = np.array([10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200])
    >>> randomSubset = np.array([0,1,0,1,0,1,1,0,0,0,0,0,1,1,1,0,0,1,0,1])

    >>> inputHash = codex_hash.hashArray('input_array', inputArray, 'feature')
    >>> subsetHash = codex_hash.hashArray('subset_hash', randomSubset, 'subset')


    # Test scenario of not applying a subset mask
    >>> outputHash,resultingName = codex_save_subset(inputHash['hash'], False, CODEX_ROOT + '/../../uploads/save_subset_output_test.h5')
    >>> readingHash = codex_read_hd5(CODEX_ROOT + '/../../uploads/save_subset_output_test.h5', [resultingName], "feature")

    >>> if(outputHash == readingHash[0]):
    ... 	print("Subset Applied Test:   Successful")
    Subset Applied Test:   Successful

    # Test scenario of applying subset mask.  Save full feature.
    >>> outputHash,resultingName = codex_save_subset(inputHash['hash'], subsetHash['hash'], CODEX_ROOT + '/../../uploads/save_subset_output_test.h5')
    >>> readingHash = codex_read_hd5(CODEX_ROOT + '/../../uploads/save_subset_output_test.h5', [resultingName], "feature")

    >>> if(outputHash == readingHash[0]):
    ... 	print("No Subset Mask Test:   Successful")
    No Subset Mask Test:   Successful

    '''
    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        codex_system.codex_log("Hash not found. Returning!")
        return

    data = returnHash['data']
    feature_name = returnHash['name']

    if(subsetHash is not False):
        data, subsetName = codex_hash.applySubsetMask(data, subsetHash)

    if(subsetHash is not False):
        newFeatureName = feature_name + "_" + subsetName
    else:
        newFeatureName = feature_name

    newHash = codex_hash.hashArray(newFeatureName, data, 'feature')

    h5f = h5py.File(saveFilePath, 'w')
    h5f.create_dataset(newFeatureName, data=data)

    return newHash['hash'], newFeatureName

if __name__ == "__main__":


    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)
