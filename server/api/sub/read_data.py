'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Read/write and file management for CODEX

Notes :
'''
import os
import errno
import h5py
import csv
import time
import sys
import logging

import numpy  as np
import pandas as pd

from collections           import defaultdict
from sklearn.neighbors     import kneighbors_graph
from sklearn.preprocessing import StandardScaler
from matplotlib.image      import imread
from PIL                   import Image

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

# CODEX Support
from api.sub.system  import string2token
from api.sub.hash    import get_cache

def codex_read_csv(file, featureList, hashType, session=None):
    '''
    Inputs:

    Outputs:

    '''
    cache = get_cache(session)
    hashList = []
    columns = defaultdict(list)

    try:
        with open(file) as f:
            reader = csv.DictReader(f)
            for row in reader:
                for (k, v) in row.items():
                    columns[k].append(v)
        f.close()
    except BaseException:
        logging.warning("codex_read_csv - cannot open file")
        return None

    if(featureList is None):
        featureList = columns.keys()

    for feature_name in featureList:
        try:
            feature_data = columns[feature_name][:]
        except BaseException:
            logging.warning("codex_read_csv: Feature not found.")
            return None

        if(isinstance(feature_data, list)):
            feature_data = np.asarray(feature_data)

        try:
            feature_data = feature_data.astype(np.float)
        except BaseException:
            logging.info("Tokenizing {f}.".format(f=feature_name))
            feature_data = string2token(feature_data)

        feature_hash = cache.hashArray(feature_name, feature_data, hashType)
        hashList.append(feature_hash['hash'])

    return hashList, list(featureList)


def traverse_datasets(hdf_file):
    '''
    Inuputs:

    Outputs:

    Notes:

    '''
    def h5py_dataset_iterator(g, prefix=''):
        for key in g.keys():
            item = g[key]
            path = '{}/{}'.format(prefix, key)
            if isinstance(item, h5py.Dataset):  # test for dataset
                yield (path, item)
            elif isinstance(item, h5py.Group):  # test for group (go down)
                yield from h5py_dataset_iterator(item, path)

    with h5py.File(hdf_file, 'r') as f:
        for (path, dset) in h5py_dataset_iterator(f):
            yield path


def codex_read_hd5(file, featureList, hashType, session=None):
    '''
    Inuputs:

    Outputs:

    Notes:

    '''
    cache = get_cache(session)

    hashList = []

    try:
        f = h5py.File(file, 'r+')
    except BaseException:
        logging.warning("ERROR: codex_read_hd5 - cannot open file")
        return None

    if(featureList is None):
        featureList = list(traverse_datasets(file))

    for feature_name in featureList:
        try:
            feature_data = f[feature_name][:]
        except BaseException:
            logging.warning("Error: codex_read_hd5: Feature not found.")
            return

        try:
            feature_data = feature_data.astype(float)
        except BaseException:
            feature_data = string2token(feature_data)
            logging.info("Log: codex_read_hd5: Tokenized " + feature_name)

        feature_hash = cache.hashArray(feature_name, feature_data, hashType)
        hashList.append(feature_hash['hash'])

    f.close()
    return hashList, list(featureList)


def codex_read_npy(file, featureList, hashType, session=None):
    '''
    Inuputs:

    Outputs:

    Notes:

    '''
    cache = get_cache(session)

    hashList = []

    try:
        data = np.load(file)
    except BaseException:
        logging.warning("ERROR: codex_read_npy - cannot open file")
        return None

    samples, features = data.shape
    featureList = []
    for x in range(0, features):

        try:
            feature_data = data[:, x].astype(float)
        except BaseException:
            feature_data = string2token(data[:, x])
            logging.info("Log: codex_read_npy: Tokenized " + feature_name)

        feature_name = "feature_" + str(x)
        featureList.append(feature_name)
        feature_hash = cache.hashArray(feature_name, feature_data, hashType)
        hashList.append(feature_hash['hash'])

    return hashList, featureList


def save_subset(inputHash, subsetHash, saveFilePath, session=None):
    '''
    Inuputs:

    Outputs:

    '''
    cache = get_cache(session)
    returnHash = cache.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        logging.warning("Hash not found. Returning!")
        return

    data = returnHash['data']
    feature_name = returnHash['name']

    if(subsetHash is not False):
        data, subsetName = cache.applySubsetMask(data, subsetHash)

    if(subsetHash is not False):
        newFeatureName = feature_name + "_" + subsetName
    else:
        newFeatureName = feature_name

    newHash = cache.hashArray(newFeatureName, data, 'feature')

    h5f = h5py.File(saveFilePath, 'w')
    h5f.create_dataset(newFeatureName, data=data)

    return newHash['hash'], newFeatureName


