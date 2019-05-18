
'''
Author: Jack Lightholder
Date  : 5/17/19

Brief : CODEX workflows.  

Notes :

Copyright 2019 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import time
import h5py
import traceback
import numpy as np
from sklearn.neighbors import kneighbors_graph
from sklearn import cluster


# Enviornment variable for setting CODEX root directory.
CODEX_ROOT = os.getenv('CODEX_ROOT')
sys.path.insert(1, CODEX_ROOT + '/api/sub/')

# CODEX Support
import codex_return_code
import codex_math
import codex_time_log
import codex_doctest
import codex_plot
import codex_read_data_api
import codex_downsample
import codex_hash
import codex_dimmension_reduction_api
import codex_system
import codex_labels


def explain_this(inputHash, subsetHashName, result):
	'''
	Inputs:

	Outputs:

	Examples:

	'''

	return {}



if __name__ == "__main__":

    codex_doctest.run_codex_doctest()