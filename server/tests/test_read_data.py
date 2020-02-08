'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys
import numpy as np

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.hash      import DOCTEST_SESSION, get_cache
from api.sub.read_data import *

def test_codex_read_csv(capsys):

    ch = get_cache(DOCTEST_SESSION)
    featureList = ['TiO2','FeOT','SiO2','Total']
    hashList = codex_read_csv(CODEX_ROOT + '/uploads/missing.csv',featureList, "feature", session=ch)
    featureList = ['fake_feature','FeOT','SiO2','Total']
    hashList = codex_read_csv(CODEX_ROOT + '/uploads/doctest.csv',featureList, "feature", session=ch)

def test_codex_read_hd5(capsys):

    ch = get_cache(DOCTEST_SESSION)
    featureList = ['L2/RetrievalGeometry/retrieval_latitude/','L2/RetrievalResults/xco2']
    result = codex_read_hd5(CODEX_ROOT + '/uploads/lnd_glint_subsample_10000.h5',featureList, "feature", session=ch)
    assert result == (['314f2860593b8d3a5c8612693aed9232874210a3', '5d3d72c3ad2afcccb86d1693fd1a4b3bb39f407a'], ['L2/RetrievalGeometry/retrieval_latitude/', 'L2/RetrievalResults/xco2'])

    featureList = ['L2/RetrievalGeometry/retrieval_latitude/','L2/RetrievalResults/xco2','missing_feature']
    result = codex_read_hd5(CODEX_ROOT + '/uploads/lnd_glint_subsample_10000.h5',featureList, "feature", session=ch)
    result = codex_read_hd5(CODEX_ROOT + '/uploads/lnd_glint_subsample_1000.h5', featureList, "feature", session=ch)

def test_save_subset(capsys):

    ch = get_cache(DOCTEST_SESSION)
    inputArray = np.array([10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200])
    randomSubset = np.array([0,1,0,1,0,1,1,0,0,0,0,0,1,1,1,0,0,1,0,1])
    inputHash = ch.hashArray('input_array', inputArray, 'feature')
    subsetHash = ch.hashArray('subset_hash', randomSubset, 'subset')
    outputHash,resultingName = save_subset(inputHash['hash'], False, CODEX_ROOT + '/uploads/save_subset_output_test.h5', session=ch)
    readingHash = codex_read_hd5(CODEX_ROOT + '/uploads/save_subset_output_test.h5', [resultingName], "feature", session=ch)

    save_subset(None, None, CODEX_ROOT + '/uploads/', session=ch)

    inputArray = np.array([10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,180,190,200])
    randomSubset = np.array([0,1,0,1,0,1,1,0,0,0,0,0,1,1,1,0,0,1,0,1])

    inputHash = ch.hashArray('input_array', inputArray, 'feature', session=ch)
    subsetHash = ch.hashArray('subset_hash', randomSubset, 'subset', session=ch)

    # Test scenario of not applying a subset mask
    outputHash,resultingName = save_subset(inputHash['hash'], False, CODEX_ROOT + '/uploads/save_subset_output_test.h5', session=ch)
    readingHash = codex_read_hd5(CODEX_ROOT + '/uploads/save_subset_output_test.h5', [resultingName], "feature", session=ch)

    assert outputHash == readingHash[0][0]

    # Test scenario of applying subset mask.  Save full feature.
    outputHash,resultingName = save_subset(inputHash['hash'], subsetHash['hash'], CODEX_ROOT + '/uploads/save_subset_output_test.h5', session=ch)
    readingHash = codex_read_hd5(CODEX_ROOT + '/uploads/save_subset_output_test.h5', [resultingName], "feature", session=ch)

    assert outputHash == readingHash[0][0]

