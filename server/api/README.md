


## Client Server API

# Saving a CODEX Session
Client->Server
{"routine":"save_session", "session_name":<session name>}

# Loading a CODEX Session
Client->Server
{"routine":"load_session", "session_name":<session name>}

# Get List of Saved CODEX Sessions
Client->Server
{"routine":"get_sessions"}

Server->Client
{"sessions":[<session name1>, <session name2>]}
	Returns list of session names




# Clustering API

Example:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"clustering", 'dataFeatures': [<list of feature strings>], 'file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {'downsampled': True, 'eps': 0.7}, 'dataSelections': [], 'cid': 'wngyu'}


|     algorithmName       | Description  | parm 1 name  | parm 1 dtype | parm 1 default value | parm 1 range | parm 2 name  | parm 2 dtype | parm 2 default value | parm 2 range | parm 3 name  | parm 3 dtype | parm 3 default value | parm 3 range |
|-------------------------|--------------|--------------|--------------|----------------------|--------------|--------------|--------------|----------------------|--------------|
|  agglomerative          |              | downsampled  |      bool    |         False        | True | False |  n_neighbors |     int      |          5           |   [2, 1000]  |
|  dbscan                 |              | downsampled  |      bool    |         False        | True | False |              |              |                      |              |
|  spectral               |              | downsampled  |      bool    |         False        | True | False |              |              |                      |              |
|  ward                   |              | downsampled  |      bool    |         False        | True | False |  n_neighbors |     int      |          5           |   [2, 1000]  |
|  birch                  |              | downsampled  |      bool    |         False        | True | False |              |              |                      |              |
|  affinity_propagation   |              | downsampled  |      bool    |         False        | True | False |              |              |                      |              |
|  mean_shift             |              | downsampled  |      bool    |         False        | True | False |              |              |                      |              |
|  kmeans                 |              | downsampled  |      bool    |         False        | True | False |              |              |                      |              |


# Classification API

Example:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"classification", 'dataFeatures': [<list of feature strings>], 'file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {'downsampled': True, 'eps': 0.7}, 'dataSelections': [], 'cid': 'wngyu'}


|         algorithmName          | Description  | parm 1 name  | parm 1 dtype | parm 1 default value | parm 1 range |
|--------------------------------|--------------|--------------|--------------|----------------------|--------------|
| AdaBoostClassifier             |              | downsampled  |      bool    |         False        | True | False |
| BaggingClassifier              |              | downsampled  |      bool    |         False        | True | False |
| BayesianGaussianMixture        |              | downsampled  |      bool    |         False        | True | False |
| BernoulliNB                    |              | downsampled  |      bool    |         False        | True | False |
| CalibratedClassifierCV         |              | downsampled  |      bool    |         False        | True | False |
| ComplementNB                   |              | downsampled  |      bool    |         False        | True | False |
| DecisionTreeClassifier         |              | downsampled  |      bool    |         False        | True | False |
| ExtraTreesClassifier           |              | downsampled  |      bool    |         False        | True | False |
| ExtraTreeClassifier            |              | downsampled  |      bool    |         False        | True | False |
| GaussianMixture                |              | downsampled  |      bool    |         False        | True | False |
| GaussianNB                     |              | downsampled  |      bool    |         False        | True | False |
| GaussianProcessClassifier      |              | downsampled  |      bool    |         False        | True | False |
| GradientBoostingClassifier     |              | downsampled  |      bool    |         False        | True | False |
| KNeighborsClassifier           |              | downsampled  |      bool    |         False        | True | False |
| LabelPropagation               |              | downsampled  |      bool    |         False        | True | False |
| LabelSpreading                 |              | downsampled  |      bool    |         False        | True | False |
| LinearDiscriminantAnalysis     |              | downsampled  |      bool    |         False        | True | False |
| LogisticRegression             |              | downsampled  |      bool    |         False        | True | False |
| LogisticRegressionCV           |              | downsampled  |      bool    |         False        | True | False |
| MLPClassifier                  |              | downsampled  |      bool    |         False        | True | False |
| MultinomialNB                  |              | downsampled  |      bool    |         False        | True | False |
| NuSVC                          |              | downsampled  |      bool    |         False        | True | False |
| QuadraticDiscriminantAnalysis  |              | downsampled  |      bool    |         False        | True | False |
| RandomForestClassifier         |              | downsampled  |      bool    |         False        | True | False |
| SGDClassifier                  |              | downsampled  |      bool    |         False        | True | False |
| SVC                            |              | downsampled  |      bool    |         False        | True | False |


# Regression API

Example:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"regression", 'dataFeatures': [<list of feature strings>], 'file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {'downsampled': True, 'eps': 0.7}, 'dataSelections': [], 'cid': 'wngyu'}

|           algorithmName        | Description  | parm 1 name  | parm 1 dtype | parm 1 default value | parm 1 range |
|--------------------------------|--------------|--------------|--------------|----------------------|--------------|
| ARDRegression                  |              | downsampled  |      bool    |         False        | True | False |
| AdaBoostRegressor              |              | downsampled  |      bool    |         False        | True | False |
| BaggingRegressor               |              | downsampled  |      bool    |         False        | True | False |
| BayesianRidge                  |              | downsampled  |      bool    |         False        | True | False |
| CCA                            |              | downsampled  |      bool    |         False        | True | False |
| DecisionTreeRegressor          |              | downsampled  |      bool    |         False        | True | False |
| ElasticNet                     |              | downsampled  |      bool    |         False        | True | False |
| ElasticNetCV                   |              | downsampled  |      bool    |         False        | True | False |
| ExtraTreeRegressor             |              | downsampled  |      bool    |         False        | True | False |
| ExtraTreesRegressor            |              | downsampled  |      bool    |         False        | True | False |
| GaussianProcessRegressor       |              | downsampled  |      bool    |         False        | True | False |
| GradientBoostingRegressor      |              | downsampled  |      bool    |         False        | True | False |
| HuberRegressor                 |              | downsampled  |      bool    |         False        | True | False |
| KNeighborsRegressor            |              | downsampled  |      bool    |         False        | True | False |
| KernelRidge                    |              | downsampled  |      bool    |         False        | True | False |
| Lars                           |              | downsampled  |      bool    |         False        | True | False |
| LarsCV                         |              | downsampled  |      bool    |         False        | True | False |
| Lasso                          |              | downsampled  |      bool    |         False        | True | False |
| LassoCV                        |              | downsampled  |      bool    |         False        | True | False |
| LassoLars                      |              | downsampled  |      bool    |         False        | True | False |
| LassoLarsCV                    |              | downsampled  |      bool    |         False        | True | False |
| LassoLarsIC                    |              | downsampled  |      bool    |         False        | True | False |
| LinearRegression               |              | downsampled  |      bool    |         False        | True | False |
| LinearSVR                      |              | downsampled  |      bool    |         False        | True | False |
| MLPRegressor                   |              | downsampled  |      bool    |         False        | True | False |
| MultiTaskElasticNet            |              | downsampled  |      bool    |         False        | True | False |
| MultiTaskElasticNetCV          |              | downsampled  |      bool    |         False        | True | False |
| MultiTaskLasso                 |              | downsampled  |      bool    |         False        | True | False |
| MultiTaskLassoCV               |              | downsampled  |      bool    |         False        | True | False |
| NuSVR                          |              | downsampled  |      bool    |         False        | True | False |
| OrthogonalMatchingPursuit      |              | downsampled  |      bool    |         False        | True | False |
| OrthogonalMatchingPursuitCV    |              | downsampled  |      bool    |         False        | True | False |
| PLSCanonical                   |              | downsampled  |      bool    |         False        | True | False |
| PLSRegression                  |              | downsampled  |      bool    |         False        | True | False |
| PassiveAggressiveRegressor     |              | downsampled  |      bool    |         False        | True | False |
| RANSACRegressor                |              | downsampled  |      bool    |         False        | True | False |
| RadiusNeighborsRegressor       |              | downsampled  |      bool    |         False        | True | False |
| RandomForestRegressor          |              | downsampled  |      bool    |         False        | True | False |
| Ridge                          |              | downsampled  |      bool    |         False        | True | False |
| RidgeCV                        |              | downsampled  |      bool    |         False        | True | False |
| SGDRegressor                   |              | downsampled  |      bool    |         False        | True | False |
| SVR                            |              | downsampled  |      bool    |         False        | True | False |
| TheilSenRegressor              |              | downsampled  |      bool    |         False        | True | False |
| TransformedTargetRegressor     |              | downsampled  |      bool    |         False        | True | False |





