'''
Author: Jack Lightholder
Date  : 7/15/17
Brief : Regression algorithms, formatted for CODEX
Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''
import os
import sys
import sys
import random
import inspect
import sklearn
import subprocess
import time
import traceback
import logging

import numpy                       as np
import numpy.polynomial.polynomial as poly

from sklearn.metrics               import log_loss
from sklearn                       import model_selection
from sklearn.model_selection       import GridSearchCV
from sklearn.model_selection       import RandomizedSearchCV
from sklearn.metrics               import confusion_matrix

from sklearn.linear_model          import ARDRegression
from sklearn.ensemble              import AdaBoostRegressor
from sklearn.ensemble              import BaggingRegressor
from sklearn.linear_model          import BayesianRidge
from sklearn.cross_decomposition   import CCA
from sklearn.tree                  import DecisionTreeRegressor
from sklearn.linear_model          import ElasticNet
from sklearn.linear_model          import ElasticNetCV
from sklearn.tree                  import ExtraTreeRegressor
from sklearn.ensemble              import ExtraTreesRegressor
from sklearn.gaussian_process      import GaussianProcessRegressor
from sklearn.ensemble              import GradientBoostingRegressor
from sklearn.linear_model          import HuberRegressor
from sklearn.neighbors             import KNeighborsRegressor
from sklearn.kernel_ridge          import KernelRidge
from sklearn.linear_model          import Lars
from sklearn.linear_model          import LarsCV
from sklearn.linear_model          import Lasso
from sklearn.linear_model          import LassoCV
from sklearn.linear_model          import LassoLars
from sklearn.linear_model          import LassoLarsCV
from sklearn.linear_model          import LassoLarsIC
from sklearn.linear_model          import LinearRegression
from sklearn.svm                   import LinearSVR
from sklearn.neural_network        import MLPRegressor
from sklearn.linear_model          import MultiTaskElasticNet
from sklearn.linear_model          import MultiTaskElasticNetCV
from sklearn.linear_model          import MultiTaskLasso
from sklearn.linear_model          import MultiTaskLassoCV
from sklearn.svm                   import NuSVR
from sklearn.linear_model          import OrthogonalMatchingPursuit
from sklearn.linear_model          import OrthogonalMatchingPursuitCV
from sklearn.cross_decomposition   import PLSCanonical
from sklearn.cross_decomposition   import PLSRegression
from sklearn.linear_model          import PassiveAggressiveRegressor
from sklearn.linear_model          import RANSACRegressor
from sklearn.neighbors             import RadiusNeighborsRegressor
from sklearn.ensemble              import RandomForestRegressor
from sklearn.linear_model          import Ridge
from sklearn.linear_model          import RidgeCV
from sklearn.linear_model          import SGDRegressor
from sklearn.svm                   import SVR
from sklearn.linear_model          import TheilSenRegressor
from sklearn.compose               import TransformedTargetRegressor

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.sub.codex_math        import impute
from api.sub.return_code       import logReturnCode
from api.sub.time_log          import getComputeTimeEstimate
from api.sub.time_log          import logTime
from api.sub.hash              import get_cache
from api.sub.downsample        import downsample
from api.algorithm             import algorithm

class regression(algorithm):

    def get_algorithm(self):
        '''
        Inputs:
            algorithm (string)  - Name of the regressor to run.  Follows Sklearn naming conventions.
                                    Available keys: ARDRegression | AdaBoostRegressor | BaggingRegressor | BayesianRidge | CCA
                                                    DecisionTreeRegressor | ElasticNet | ExtraTreeRegressor
                                                    ExtraTreesRegressor | GaussianProcessRegressor | GradientBoostingRegressor
                                                    HuberRegressor | KNeighborsRegressor | KernelRidge | Lars | Lasso
                                                    LassoLars | LinearRegression | LinearSVR | MLPRegressor | NuSVR | 
                                                    OrthogonalMatchingPursuit | PLSCanonical | PLSRegression | 
                                                    PassiveAggressiveRegressor | RANSACRegressor | RandomForestRegressor | 
                                                    Ridge | SGDRegressor | SVR | TheilSenRegressor | TransformedTargetRegressor

                                    Currently not supporting: ElasticNetCV | LarsCV | LassoCV | LassoLarsCV | LassoLarsIC | 
                                                    MultiTaskElasticNet | MultiTaskElasticNetCV | MultiTaskLasso | MultiTaskLassoCV |
                                                    OrthogonalMatchingPursuitCV | RidgeCV | RadiusNeighborsRegressor
        Outputs:

        Notes:
            Scoring Metrics: https://scikit-learn.org/stable/modules/model_evaluation.html#scoring-parameter
        '''
        if(self.algorithmName == "ARDRegression"): algorithm = ARDRegression()
        elif(self.algorithmName == "AdaBoostRegressor"): algorithm = AdaBoostRegressor()
        elif(self.algorithmName == "BaggingRegressor"): algorithm = BaggingRegressor()
        elif(self.algorithmName == "BayesianRidge"): algorithm = BayesianRidge()
        elif(self.algorithmName == "CCA"): algorithm = CCA()
        elif(self.algorithmName == "DecisionTreeRegressor"): algorithm = DecisionTreeRegressor()
        elif(self.algorithmName == "ElasticNet"): algorithm = ElasticNet()
        elif(self.algorithmName == "ExtraTreeRegressor"): algorithm = ExtraTreeRegressor()
        elif(self.algorithmName == "ExtraTreesRegressor"): algorithm = ExtraTreesRegressor()
        elif(self.algorithmName == "GaussianProcessRegressor"): algorithm = GaussianProcessRegressor()
        elif(self.algorithmName == "GradientBoostingRegressor"): algorithm = GradientBoostingRegressor()
        elif(self.algorithmName == "HuberRegressor"): algorithm = HuberRegressor()
        elif(self.algorithmName == "KNeighborsRegressor"): algorithm = KNeighborsRegressor()
        elif(self.algorithmName == "KernelRidge"): algorithm = KernelRidge()
        elif(self.algorithmName == "Lars"): algorithm = Lars()
        elif(self.algorithmName == "Lasso"): algorithm = Lasso()
        elif(self.algorithmName == "LassoLars"): algorithm = LassoLars()
        elif(self.algorithmName == "LinearRegression"): algorithm = LinearRegression()
        elif(self.algorithmName == "LinearSVR"): algorithm = LinearSVR()
        elif(self.algorithmName == "MLPRegressor"): algorithm = MLPRegressor()
        elif(self.algorithmName == "NuSVR"): algorithm = NuSVR()
        elif(self.algorithmName == "OrthogonalMatchingPursuit"): algorithm = OrthogonalMatchingPursuit()
        elif(self.algorithmName == "PLSCanonical"): algorithm = PLSCanonical()
        elif(self.algorithmName == "PLSRegression"): algorithm = PLSRegression()
        elif(self.algorithmName == "PassiveAggressiveRegressor"): algorithm = PassiveAggressiveRegressor()
        elif(self.algorithmName == "RANSACRegressor"): algorithm = RANSACRegressor()
        elif(self.algorithmName == "RandomForestRegressor"): algorithm = RandomForestRegressor()
        elif(self.algorithmName == "Ridge"): algorithm = Ridge()
        elif(self.algorithmName == "SGDRegressor"): algorithm = SGDRegressor()
        elif(self.algorithmName == "SVR"): algorithm = SVR()
        elif(self.algorithmName == "TheilSenRegressor"): algorithm = TheilSenRegressor()
        elif(self.algorithmName == "TransformedTargetRegressor"): algorithm = TransformedTargetRegressor()
        else: return None

        return algorithm



    def fit_algorithm(self):

        accepted_scoring_metrics = ["explained_variance", "max_error", "neg_mean_absolute_error", "neg_mean_squared_error", "neg_mean_squared_log_error", "neg_median_absolute_error", "r2"]
        if self.scoring not in accepted_scoring_metrics:
            self.result["WARNING"] = "{scoring} not a valid scoring metric for regression.".format(scoring=self.scoring)
            return None

        if self.search_type == "random":
            self.algorithm = RandomizedSearchCV(self.algorithm, self.parms, cv=self.cross_val, scoring=self.scoring)
        else:
            self.algorithm = GridSearchCV(self.algorithm, self.parms, cv=self.cross_val, scoring=self.scoring)

        self.algorithm.fit(self.X, self.y)
        y_pred = self.algorithm.predict(self.X)

        self.result["y_pred"] = y_pred.tolist()
        self.result["best_parms"] = self.algorithm.best_params_
        self.result["best_score"] = self.algorithm.best_score_


    def check_valid(self):

        # TODO - parms come as dictionary in list when should be direct dictionary.  Get client to remove list layer and then remove line below.
        self.parms = self.parms[0]


        for parm, value in self.parms.items():
            if value == []:
                logging.warning("Please set max_depth parameters")
                self.result["WARNING"] = "Please set max_depth parameters"
                return None

        if self.X.ndim < 2:
            logging.warning("Insufficient data dimmensions: {dims}".format(dims=self.X.ndim))
            self.result["WARNING"] = "Please choose more than 2 features"
            return None

        return 1








