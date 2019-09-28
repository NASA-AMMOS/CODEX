'''
Author: Jack Lightholder
Date  : 9/27/19

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import pytest
import sys

CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, os.getenv('CODEX_ROOT'))

from api.sub.hash import *

def test_printCacheCount(capsys):

    session = 'foo'
    ch = CodexHash()
    ch.resetCacheList("feature", session=session)
    ch.resetCacheList("subset", session=session)
    ch.resetCacheList("downsample", session=session)
    ch.resetCacheList("label", session=session)

    x1 = np.array([2,3,1,0])
    hashResult = ch.hashArray("x1", x1, "feature", session=session)
    hashResult = ch.hashArray("x2", x1, "feature", session=session)
    hashResult = ch.hashArray("s1", x1, "subset", session=session)
    ch.printCacheCount(session=session)

def test_remove_stale_data(capsys):

    session = 'foo'
    ch = CodexHash()
    x1 = np.array([2,3,1,0])
    hashResult = ch.hashArray("x1", x1, "feature", session=session)
    hashResult = ch.hashArray("x2", x1, "feature", session=session)
    hashResult = ch.hashArray("s1", x1, "subset", session=session)
    ch.remove_stale_data(session=session)

    ch.resetCacheList("feature", session=session)
    ch.resetCacheList("subset", session=session)
    ch.resetCacheList("downsample", session=session)
    ch.resetCacheList("label", session=session)

    x1 = np.array([2,3,1,0])
    hashResult = ch.hashArray("s1", x1, "subset", session=session)
    hashResult = ch.hashArray("x1", x1, "feature", session=session)
    hashResult = ch.hashArray("x2", x1, "feature", session=session)
    ch.remove_stale_data(session=session)

    ch.resetCacheList("feature", session=session)
    ch.resetCacheList("subset", session=session)
    ch.resetCacheList("downsample", session=session)
    ch.resetCacheList("label", session=session)

    x1 = np.array([2,3,1,0])
    hashResult = ch.hashArray("s1", x1, "downsample", session=session)
    hashResult = ch.hashArray("x1", x1, "feature", session=session)
    hashResult = ch.hashArray("x2", x1, "feature", session=session)
    ch.remove_stale_data(session=session)

def test_hashUpdate(capsys):

    session = 'foo'
    ch = CodexHash()
    ch.resetCacheList("subset", session=session)
    ch.resetCacheList("feature", session=session)
    ch.resetCacheList("downsample", session=session)
    ch.resetCacheList("label", session=session)

    x1 = np.array([2,3,1,0])
    hashResult = ch.hashArray("x1", x1, "subset", session=session)

    ch.printHashList("subset", session=session)

    result = ch.hashUpdate("name","x1","x2","subset", session=session)

    ch.printHashList("subset", session=session)


def test_resetCacheList(capsys):

    session = 'foo'
    ch = CodexHash()
    ch.resetCacheList("downsample", session=session)
    ch.resetCacheList("feature", session=session)
    ch.resetCacheList("subset", session=session)
    ch.resetCacheList("label", session=session)
    ch.resetCacheList("unknown", session=session)

def test_hashArray(capsys):

    # Standard completion check
    session = 'foo'
    ch = CodexHash()
    x1 = np.array([2,3,1,0])
    hashResult = ch.hashArray("x1", x1, "feature", session=session)
    assert hashResult['hash'] == "bb99f457e6632e9944b801e6c53ad7353e08ce00"

    hashResult = ch.hashArray("x1", x1, "subset", session=session)
    assert hashResult['hash'] == "bb99f457e6632e9944b801e6c53ad7353e08ce00"

    # Incorrect hashType input
    ch.hashArray("x1",x1,"log", session=session)

    ch.resetCacheList("feature", session=session)
    x1 = np.array([2,3,1,0])
    hashResult = ch.hashArray("x1", x1, "feature", session=session)

    x1 = np.array([2,3,1,0])
    hashResult = ch.hashArray("x1", x1, "feature", session=session)

    ch.printHashList("feature", session=session)

def test_printHashList(capsys):

    session = 'foo'
    ch = CodexHash()
    ch.resetCacheList("subset", session=session)
    ch.resetCacheList("feature", session=session)

    x1 = np.array([2,3,1,0])
    hashResult = ch.hashArray("x1_feature", x1, "feature", session=session)
    hashResult = ch.hashArray("x1_subset", x1, "subset", session=session)
    hashResult = ch.hashArray("x1_downsample", x1, "downsample", session=session)
    hashResult = ch.hashArray("x1_label", x1, "label", session=session)

    ch.printHashList("feature", session=session)

    ch.printHashList("subset", session=session)

    ch.printHashList("downsample", session=session)

    ch.printHashList("label", session=session)

    ch.printHashList("unknown", session=session)


def test_findHashArray(capsys):

    session = 'foo'
    ch = CodexHash()
    ch.resetCacheList("feature", session=session)
    ch.resetCacheList("subset", session=session)
    ch.resetCacheList("downsample", session=session)
    ch.resetCacheList("label", session=session)

    x1 = np.array([2,3,1,0])
    hashResult_feature = ch.hashArray("x1_feature", x1, "feature", session=session)
    hashResult_subset = ch.hashArray("x1_subset", x1, "subset", session=session)
    hashResult_feature = ch.hashArray("x1_downsample", x1, "downsample", session=session)
    hashResult_subset = ch.hashArray("x1_label", x1, "label", session=session)

    result = ch.findHashArray('hash',hashResult_feature["hash"],"feature", session=session)
    assert result["hash"] == "bb99f457e6632e9944b801e6c53ad7353e08ce00"

    result = ch.findHashArray('hash',hashResult_subset["hash"],"subset", session=session)
    assert result["hash"] == "bb99f457e6632e9944b801e6c53ad7353e08ce00"

    result = ch.findHashArray('hash',hashResult_subset["hash"],"downsample", session=session)
    assert result["hash"] == "bb99f457e6632e9944b801e6c53ad7353e08ce00"

    result = ch.findHashArray('hash',hashResult_subset["hash"],"label", session=session)
    result["hash"] == "bb99f457e6632e9944b801e6c53ad7353e08ce00"

    result = ch.findHashArray('hash',"4f584718a8fa7b54716b48075b3332","label", session=session)
    assert result == None

    result = ch.findHashArray('hash',hashResult_subset["hash"],"unknown_type", session=session)


def test_mergeHashResults(capsys):

    session = 'foo'
    ch = CodexHash()
    ch.mergeHashResults(None, session=session)

def test_pickle_data(capsys):

    session = 'foo'
    ch = CodexHash()
    from sklearn import datasets, linear_model
    diabetes = datasets.load_diabetes()
    regr = linear_model.LinearRegression()
    regr.fit(diabetes.data, diabetes.target)

    model = ch.saveModel("test", regr, "classifier", session=session)
    assert model['hash'] == "1545eb964d6ec2e0ca5f9569e78fff106c1afbbb"

    ch.resetCacheList("feature", session=session)
    ch.resetCacheList("subset", session=session)
    ch.resetCacheList("downsample", session=session)
    ch.resetCacheList("label", session=session)

    x1 = np.array([2,3,1,0])

    hashResult = ch.hashArray("x1", x1, "feature", session=session)
    hashResult = ch.hashArray("x1", x1, "subset", session=session)
    hashResult = ch.hashArray("x1", x1, "downsample", session=session)
    hashResult = ch.hashArray("x1", x1, "label", session=session)

    ch.pickle_data("test_session", {"front_end_payload":"payload_value"}, CODEX_ROOT, session=session)

def test_unpickle_data(capsys):

    session = 'foo'
    ch = CodexHash()
    data = ch.unpickle_data("test_session", CODEX_ROOT, session=session)
    assert data == {'features': ['x1'], 'labels': ['x1'], 'subsets': ['x1'], 'downsample': ['x1'], 'state': {'front_end_payload': 'payload_value'}}

    ch.printCacheCount(session=session)


def test_saveModel(capsys):

    session = 'foo'
    ch = CodexHash()
    from sklearn import datasets, linear_model
    diabetes = datasets.load_diabetes()
    regr = linear_model.LinearRegression()
    regr.fit(diabetes.data, diabetes.target)

    model = ch.saveModel("test", regr, "classifier", session=session)
    assert model['hash'] == "1545eb964d6ec2e0ca5f9569e78fff106c1afbbb"
  
def test_assert_session(capsys):

    assert_session('SomeSessionKey')
    #assert_session(None)

def test_wrappedCache(capsys):

    assert 1 == 1
    #>>> WrappedCache(None)
    #Traceback (most recent call last):
    #    ...
    #NoSessionSpecifiedError
    #>>> WrappedCache(DOCTEST_SESSION)
    #<__main__.WrappedCache object at 0x...>
    #>>> cache = WrappedCache('SomeSessionKey')
    #Traceback (most recent call last):
    #    ...
    #OSError: Connection to codex_hash dropped

def test_get_cache(capsys):

    assert 1 == 1
    #>>> get_cache('SomeSessionKey')
    #Traceback (most recent call last):
    #    ...
    #OSError: Connection to codex_hash dropped

    #>>> cache = get_cache(DOCTEST_SESSION)
    #>>> get_cache(cache)
    #<__main__.WrappedCache object at 0x...>



















