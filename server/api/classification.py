'''
Author: Jack Lightholder
Date  : 7/15/17
Brief : classification algorithms, formatted for CODEX
Notes :

Copyright 2018 California Institute of Technology.  ALL RIGHTS RESERVED.
U.S. Government Sponsorship acknowledged.
'''

# Enviornment variable for setting CODEX root directory.
import os
import sys
import time
import inspect
import traceback
import random
import json
import logging

import numpy as np

from sklearn                        import model_selection
from sklearn.model_selection        import GridSearchCV
from sklearn.model_selection        import RandomizedSearchCV
from sklearn.metrics                import confusion_matrix
from sklearn.ensemble               import AdaBoostClassifier
from sklearn.ensemble               import BaggingClassifier
from sklearn.mixture                import BayesianGaussianMixture
from sklearn.naive_bayes            import BernoulliNB
from sklearn.calibration            import CalibratedClassifierCV
from sklearn.naive_bayes            import ComplementNB
from sklearn.tree                   import DecisionTreeClassifier
from sklearn.ensemble               import ExtraTreesClassifier
from sklearn.tree                   import ExtraTreeClassifier
from sklearn.mixture                import GaussianMixture
from sklearn.naive_bayes            import GaussianNB
from sklearn.gaussian_process       import GaussianProcessClassifier
from sklearn.ensemble               import GradientBoostingClassifier
from sklearn.neighbors              import KNeighborsClassifier
from sklearn.semi_supervised        import LabelPropagation
from sklearn.semi_supervised        import LabelSpreading
from sklearn.discriminant_analysis  import LinearDiscriminantAnalysis
from sklearn.linear_model           import LogisticRegression
from sklearn.linear_model           import LogisticRegressionCV
from sklearn.neural_network         import MLPClassifier
from sklearn.naive_bayes            import MultinomialNB
from sklearn.svm                    import NuSVC
from sklearn.discriminant_analysis  import QuadraticDiscriminantAnalysis
from sklearn.ensemble               import RandomForestClassifier
from sklearn.linear_model           import SGDClassifier
from sklearn.svm                    import SVC

sys.path.insert(1, os.getenv('CODEX_ROOT'))

logger = logging.getLogger(__name__)

from api.sub.return_code       import logReturnCode
from api.sub.codex_math        import impute
from api.sub.time_log          import logTime
from api.sub.time_log          import getComputeTimeEstimate
from api.sub.downsample        import downsample
from api.sub.hash              import get_cache
from api.algorithm             import algorithm

class classification(algorithm):

    def get_algorithm(self):

        if(self.algorithmName == "AdaBoostClassifier"): algorithm = AdaBoostClassifier()
        elif(self.algorithmName == "BaggingClassifier"): algorithm = BaggingClassifier()
        elif(self.algorithmName == "BayesianGaussianMixture"): algorithm = BayesianGaussianMixture()
        elif(self.algorithmName == "BernoulliNB"): algorithm = BernoulliNB()
        elif(self.algorithmName == "CalibratedClassifierCV"): algorithm = CalibratedClassifierCV()
        elif(self.algorithmName == "ComplementNB"): algorithm = ComplementNB()
        elif(self.algorithmName == "DecisionTreeClassifier"): algorithm = DecisionTreeClassifier()
        elif(self.algorithmName == "ExtraTreeClassifier"): algorithm = ExtraTreeClassifier()
        elif(self.algorithmName == "ExtraTreesClassifier"): algorithm = ExtraTreesClassifier()
        elif(self.algorithmName == "GaussianMixture"): algorithm = GaussianMixture()
        elif(self.algorithmName == "GaussianNB"): algorithm = GaussianNB()
        elif(self.algorithmName == "GaussianProcessClassifier"): algorithm = GaussianProcessClassifier()
        elif(self.algorithmName == "GradientBoostingClassifier"): algorithm = GradientBoostingClassifier()
        elif(self.algorithmName == "KNeighborsClassifier"): algorithm = KNeighborsClassifier()
        elif(self.algorithmName == "LabelPropagation"): algorithm = LabelPropagation()
        elif(self.algorithmName == "LabelSpreading"): algorithm = LabelSpreading()
        elif(self.algorithmName == "LinearDiscriminantAnalysis"): algorithm = LinearDiscriminantAnalysis()
        elif(self.algorithmName == "LogisticRegression"): algorithm = LogisticRegression()
        elif(self.algorithmName == "LogisticRegressionCV"): algorithm = LogisticRegressionCV()
        elif(self.algorithmName == "MLPClassifier"): algorithm = MLPClassifier()
        elif(self.algorithmName == "MultinomialNB"): algorithm = MultinomialNB()
        elif(self.algorithmName == "NuSVC"): algorithm = NuSVC()
        elif(self.algorithmName == "QuadraticDiscriminantAnalysis"): algorithm = QuadraticDiscriminantAnalysis()
        elif(self.algorithmName == "RandomForestClassifier"): algorithm = RandomForestClassifier()
        elif(self.algorithmName == "SGDClassifier"): algorithm = SGDClassifier()
        elif(self.algorithmName == "SVC"): algorithm = SVC()
        else: return None

        return algorithm

    def fit_algorithm(self):

        accepted_scoring_metrics = ["accuracy", "balanced_accuracy", "average_precision", "brier_score_loss", "f1, f1_micro", "f1_macro", "f1_weighted", "f1_samples", "neg_log_loss", "precision", "recall", "jaccard", "roc_auc"]
        if self.scoring not in accepted_scoring_metrics:
            self.result["WARNING"] = "{scoring} not a valid scoring metric for classification.".format(scoring=self.scoring)
            return

        if self.search_type == "random":
            self.algorithm = RandomizedSearchCV(self.algorithm, self.parms, cv=self.cross_val, scoring=self.scoring)
        else:
            self.algorithm = GridSearchCV(self.algorithm, self.parms, cv=self.cross_val, scoring=self.scoring)

        self.algorithm.fit(self.X, self.y)
        y_pred = self.algorithm.predict(self.X)

        cm = confusion_matrix(self.y, y_pred)
        cm = np.round((cm.astype('float') / cm.sum(axis=1)[:, np.newaxis]) * 100)

        self.result['cm_data'] = cm.tolist()
        self.result['classes'] = np.unique(self.y).tolist()
        self.result["best_parms"] = self.algorithm.best_params_
        self.result["best_score"] = self.algorithm.best_score_


    def check_valid(self):
        return 1

       





