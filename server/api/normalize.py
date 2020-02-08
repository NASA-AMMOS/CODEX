'''
Author: Jack Lightholder
Date  : 7/15/17
Brief : Peak detection algorithms, formatted for CODEX
Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import traceback
import statistics
import math
import logging

import numpy as np

from sklearn import preprocessing

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.algorithm     import algorithm

class normalize(algorithm):

    def get_algorithm(self):

        if(self.algorithmName == "normalize"):
            algorithm = preprocessing.MinMaxScaler() 
        elif(self.algorithmName == "standardize"):
            algorithm = preprocessing.StandardScaler() 
        else:
            return None

        return algorithm


    def fit_algorithm(self):

        self.result['scaled'] = self.algorithm.fit_transform(self.X).tolist()

    def check_valid(self):
        return 1
