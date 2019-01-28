'''
Author: Jack Lightholder
Date  : 7/15/17

Brief : Dimmensionality reduction algorithms, formatted for CODEX

Notes : 

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import numpy as np
import matplotlib.pyplot as plt
from sklearn.decomposition import PCA, IncrementalPCA, FastICA, LatentDirichletAllocation
import h5py
import time, sklearn
import collections
import traceback

DEBUG = False

## Enviornment variable for setting CODEX root directory.
CODEX_ROOT  = os.getenv('CODEX_ROOT')
sys.path.insert(1,CODEX_ROOT + '/api/sub/')

# CODEX Support
import codex_time_log, codex_return_code
import codex_read_data_api, codex_hash
import codex_doctest, codex_downsample
import codex_math, codex_system

def ml_dimensionality_reduction(inputHash, hashList, subsetHashName, algorithmName, downsampled, parms, result):
    '''
    Inputs:

    Outputs:

    Examples:

    '''

    if(subsetHashName != None):
        subsetHash = codex_hash.findHashArray("name", subsetHashName,"subset")
        if(subsetHash == None):
            subsetHash = False
        else:
            subsetHash = subsetHash["hash"]
    else:
        subsetHash = False

    try:
        n_components = int(parms['n_components'])
    except:
        codex_system.codex_log("n_components parameter not set")
        result['message'] = "n_components parameter not set"
        return None

    if(algorithmName == "PCA"):
        try:
            result = codex_decomposition_PCA(inputHash, subsetHash, n_components, False, downsampled, False)
        except:
            codex_system.codex_log("Failed to run PCA for dimensionality reduction analysis")
            result['message'] = "Failed to run PCA for dimensionality reduction analysis"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif(algorithmName == "PCA_Incremental"):
        try:
            result = codex_decomposition_PCA(inputHash, subsetHash, n_components, True, downsampled, False)
        except:
            codex_system.codex_log("Failed to run PCA_Incremental for dimensionality reduction analysis")
            result['message'] = "Failed to run PCA_Incremental for dimensionality reduction analysis"
            codex_system.codex_log(traceback.format_exc())
            return None

    elif(algorithmName == "LDA"):
        try:
            result = codex_decomposition_LDA(inputHash, subsetHash, n_components, downsampled, False)
        except:
            codex_system.codex_log("Failed to run LDA for dimensionality reduction analysis")
            result['message'] = "Failed to run LDA for dimensionality reduction analysis"
            codex_system.codex_log(traceback.format_exc())
            return None
    
    elif(algorithmName == "ICA"):
        try:
            result = codex_decomposition_ICA(inputHash, subsetHash, n_components, downsampled, False)
        except:
            codex_system.codex_log("Failed to run ICA for dimensionality reduction analysis")
            result['message'] = "Failed to run ICA for dimensionality reduction analysis"
            codex_system.codex_log(traceback.format_exc())
            return None

    else:
        result['message'] = "Cannot find requested dimensionality reduction algorithm"
        codex_system.codex_log("Cannot find requested dimensionality reduction algorithm")
        return None

    return result

def codex_decomposition_PCA(inputHash, subsetHash, n_components, incremental, downsampled, showPlot):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        n_components (int)  - Number of components to keep
        incremental (bool)  - If set to True, incremental PCA used, else regular

    Outputs:

    Examples:

        >>> (inputHash,labelHash,template, labelHash) = codex_doctest.doctest_get_data()

        >>> result = codex_decomposition_PCA(inputHash, False, 2, False, False, False)

        >>> (inputHash,labelHash,template, labelHash) = codex_doctest.doctest_get_data()

        >>> result = codex_decomposition_PCA(inputHash, False, 2, True, False, False)

    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Error: codex_decomposition_PCA: Hash not found")
        return

    data = returnHash['data']

    if(subsetHash is not False):
        data, datName = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_dimmension_reudction - PCA - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " samples")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("dimension_reduction", "PCA", samples)

    data = codex_math.codex_impute(data)

    if(data.ndim > n_components):
        codex_system.codex_log("ERROR: codex_dimension_reduction - PCA - features (" + str(data.ndim) + ") > requested components (" + str(n_components) + ")")
        return None

    if(incremental == True):

        ipca = IncrementalPCA(n_components=n_components)
        X_transformed = ipca.fit_transform(data)
 
        exp_var_ratio = codex_math.codex_explained_variance_ratio(X_transformed, n_components)

        endTime = time.time()
        computeTime = endTime - startTime
        codex_time_log.logTime("dimension_reduction", "PCA_Incremental", computeTime, len(data), data.ndim)

    elif(incremental == False):

        pca = PCA(n_components=n_components)
        X_transformed = pca.fit_transform(data)

        exp_var_ratio = codex_math.codex_explained_variance_ratio(X_transformed, n_components)

        endTime = time.time()
        computeTime = endTime - startTime
        codex_time_log.logTime("dimension_reduction", "PCA", computeTime, len(data), data.ndim)

    if showPlot:
        codex_plot.plot_dimensionality(exp_var_ratio, "PCA Explained Variance", show=True)

    if DEBUG:
        codex_plot.plot_dimensionality(exp_var_ratio, "PCA Explained Variance", save=True)

    if(subsetHash is False):
        returnCodeString = "codex_dimmension_reduction_api.codex_decomposition_PCA('"+inputHash+"',"+str(False)+","+str(n_components)+","+str(incremental)+","+str(downsampled)+",False)\n" 
    else:
        returnCodeString = "codex_dimmension_reduction_api.codex_decomposition_PCA('"+inputHash+"','"+str(subsetHash)+"',"+str(n_components)+","+str(incremental)+","+str(downsampled)+",False)\n" 
    codex_return_code.logReturnCode(returnCodeString)

    outputHash = codex_hash.hashArray('PCA_', X_transformed, "feature")
    
    output = {'eta': eta, 'algorithm': 'PCA', 'data': X_transformed.tolist(), 'explained_variance_ratio': exp_var_ratio.tolist(), 'inputHash': inputHash, 'subsetHash': subsetHash, 'outputHash': outputHash["hash"], 'n_components': n_components, 'incremental': incremental, 'downsample': downsampled}
    
    return output


def codex_decomposition_ICA(inputHash, subsetHash, n_components, downsampled, showPlot):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        n_components (int)  - Number of components to keep


    Outputs:


    Examples:

        >>> (inputHash, labelHash, template, labelHash) = codex_doctest.doctest_get_data()

        >>> result = codex_decomposition_ICA(inputHash, False, 3, False, False)

    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Error: codex_decomposition_ICA: Hash not found.")
        return None

    data = returnHash['data']

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_dimmension_reudction - ICA - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " samples")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("dimension_reduction", "ICA", samples)

    data = codex_math.codex_impute(data)

    if(data.ndim > n_components):
        codex_system.codex_log("ERROR: codex_dimension_reduction - ICA - features (" + str(data.ndim) + ") > requested components (" + str(n_components) + ")")
        return None
        
    ica = FastICA(n_components=n_components)
    X_transformed = ica.fit_transform(data)
    exp_var_ratio = codex_math.codex_explained_variance_ratio(X_transformed, n_components)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("dimension_reduction", "ICA", computeTime, len(data), data.ndim)

    if(subsetHash is False):
        returnCodeString = "codex_dimmension_reduction_api.codex_decomposition_ICA('"+inputHash+"',"+str(False)+","+str(n_components)+","+str(downsampled)+")\n" 
    else:
        returnCodeString = "codex_dimmension_reduction_api.codex_decomposition_ICA('"+inputHash+"','"+str(subsetHash)+"',"+str(n_components)+","+str(downsampled)+")\n" 
    codex_return_code.logReturnCode(returnCodeString)

    if showPlot:
        codex_plot.plot_dimensionality(exp_var_ratio, "ICA Explained Variance", show=True)

    if DEBUG:
        codex_plot.plot_dimensionality(exp_var_ratio, "ICA Explained Variance", save=True)

    outputHash = codex_hash.hashArray('ICA_', X_transformed, "feature")

    output = {'eta': eta, 'algorithm': 'ICA', 'data': X_transformed.tolist(), 'explained_variance_ratio': exp_var_ratio.tolist(), 'inputHash': inputHash, 'subsetHash': subsetHash, 'outputHash': outputHash["hash"], 'n_components': n_components, 'downsample': downsampled}

    return output


def codex_decomposition_LDA(inputHash, subsetHash, n_components, downsampled, showPlot):
    '''
    Inputs:
        inputHash (string)  - hash value corresponding to the data to cluster
        subsetHash (string) - hash value corresponding to the subselection (false if full feature)
        n_components (int)  - Number of components to keep


    Outputs:

    Examples:

        >>> (inputHash, labelHash, template, labelHash) = codex_doctest.doctest_get_data()

        >>> result = codex_decomposition_LDA(inputHash, False, 5, False, False)
    '''
    startTime = time.time()
    eta = None

    returnHash = codex_hash.findHashArray("hash", inputHash, "feature")
    if(returnHash is None):
        print("Error: codex_decomposition_ICA: inputHash not found.")
        return None

    data = returnHash['data']
    data = codex_math.codex_impute(data)

    if(subsetHash is not False):
        data = codex_hash.applySubsetMask(data, subsetHash)
        if(data is None):
            codex_system.codex_log("ERROR: codex_dimmension_reudction - LDA - subsetHash returned None.")
            return None

    if(downsampled is not False):
        codex_system.codex_log("Downsampling to " + str(downsampled) + " samples")
        samples = len(data)
        data = codex_downsample.downsample(data, percentage=downsampled)
        eta = codex_time_log.getComputeTimeEstimate("dimension_reduction", "LDA", samples)

    if(data.ndim > n_components):
        codex_system.codex_log("ERROR: codex_dimension_reduction - LDA - features (" + str(data.ndim) + ") > requested components (" + str(n_components) + ")")
        return None
        

    if(int(sklearn.__version__.split(".")[1]) == 19):
        lda = LatentDirichletAllocation(n_components=n_components)
    else:
        lda = LatentDirichletAllocation(n_topics=n_components)

    X_transformed = lda.fit_transform(data)
    exp_var_ratio = codex_math.codex_explained_variance_ratio(X_transformed, n_components)

    endTime = time.time()
    computeTime = endTime - startTime
    codex_time_log.logTime("dimension_reduction", "LDA", computeTime, len(data), data.ndim)

    if showPlot:
        codex_plot.plot_dimensionality(exp_var_ratio, "LDA Explained Variance", show=True)

    if DEBUG:
        codex_plot.plot_dimensionality(exp_var_ratio, "LDA Explained Variance", save=True)

    if(subsetHash is False):
        returnCodeString = "codex_dimmension_reduction_api.codex_decomposition_LDA('"+inputHash+"',"+str(False)+","+str(n_components)+","+str(downsampled)+")\n" 
    else:
        returnCodeString = "codex_dimmension_reduction_api.codex_decomposition_LDA('"+inputHash+"','"+str(subsetHash)+"',"+str(n_components)+","+str(downsampled)+")\n" 
    codex_return_code.logReturnCode(returnCodeString)

    outputHash = codex_hash.hashArray('LDA_', X_transformed, "feature")

    output = {'eta': eta, 'algorithm': 'LDA', 'data': X_transformed.tolist(), 'explained_variance_ratio': exp_var_ratio.tolist(), 'inputHash': inputHash, 'subsetHash': subsetHash, 'outputHash': outputHash["hash"], 'n_components': n_components, 'downsample': downsampled}
    
    return output


if __name__ == "__main__":

    import doctest
    results = doctest.testmod(optionflags=doctest.ELLIPSIS)
    sys.exit(results.failed)

