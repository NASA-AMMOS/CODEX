'''
Author: Jack Lightholder
Date  : 7/15/18

Brief : Math library for CODEX cache categories

Notes :

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
import collections
import logging

from scipy import linalg

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

def codex_impute(data):
    '''
    Inputs:

    Outputs:

    Examples:

        # Check multiple feature case
        >>> a = np.array(([10,5,10],[5,10,np.inf],[None,2,3],[6,-np.inf,8]))
        >>> print(a)
        [[10 5 10]
         [5 10 inf]
         [None 2 3]
         [6 -inf 8]]
        >>> a = codex_impute(a)
        >>> print(a)
        [[10.  5. 10.]]

        # Check single feature case
        a = np.array(([5],[5],[5],[np.inf],[5],[5],[5],[5]))
        a = codex_impute(a)
        print(a.shape)
        (7, 1)
        print(a)
        [[5.]
         [5.]
         [5.]
         [5.]
         [5.]
         [5.]
         [5.]]
    '''

    data = data.astype(float)
    nan = np.isnan(data)
    inf = np.isinf(data)
    rows = np.logical_or(nan, inf)

    if(data.ndim == 1):
        rows = np.any(rows, axis=0)
        data = data[:, ~rows]
    elif(data.ndim == 2):
        rows = np.any(rows, axis=1)
        data = data[~rows, :]
    elif(data.ndim == 3):
        # Not currently supported, but needs to be
        return None
    else:
        print(str(data.ndim) + " not supported")
        return None

    return data


def codex_explained_variance_ratio(X, n_components):
    '''
    Inputs:

    Outputs:

    Examples:
    '''
    X -= np.mean(X, axis=0)
    n_samples, n_features = X.shape
    U, S, V = linalg.svd(X, full_matrices=False)
    explained_variance_ = (S ** 2) / (n_samples - 1)
    total_var = explained_variance_.sum()
    exp_var_ratio = explained_variance_ / total_var
    exp_var_ratio = exp_var_ratio[:n_components]
    exp_var_ratio = np.cumsum(exp_var_ratio)
    exp_var_ratio = np.around(exp_var_ratio * 100)

    return exp_var_ratio


if __name__ == "__main__":

    from codex_doctest import run_codex_doctest
    run_codex_doctest()
