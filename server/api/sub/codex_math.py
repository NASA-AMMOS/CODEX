'''
Author: Jack Lightholder
Date  : 7/15/18
Brief : Math library for CODEX cache categories
Notes :

'''
import os
import sys
import logging

import numpy as np

from scipy import linalg

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

def impute(data):
    '''
    Inputs:

    Outputs:

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
        logging.warning("{dim} not supported".format(dim=data.ndim))
        return None

    return data


def explained_variance_ratio(X, n_components):
    '''
    Inputs:

    Outputs:

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


