


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
|-------------------------|--------------|--------------|--------------|----------------------|--------------|--------------|--------------|----------------------|--------------|--------------|--------------|----------------------|--------------|
|  agglomerative          |              | downsampled  |      bool    |         False        | True | False |      k       |     int      |          3           |    [3,10]    |  n_neighbors |     int      |          5           |   [2, 1000]  |
|  dbscan                 |              | downsampled  |      bool    |         False        | True | False |     eps      |    float     |          5           |   [2, 1000]  |              |              |                      |              |
|  spectral               |              | downsampled  |      bool    |         False        | True | False |      k       |     int      |          3           |    [3,10]    |              |              |                      |              |
|  ward                   |              | downsampled  |      bool    |         False        | True | False |      k       |     int      |          3           |    [3,10]    |  n_neighbors |     int      |          5           |   [2, 1000]  |
|  birch                  |              | downsampled  |      bool    |         False        | True | False |      k       |     int      |          3           |    [3,10]    |              |              |                      |              |
|  affinity_propagation   |              | downsampled  |      bool    |         False        | True | False |    damping   |    float     |         0.5          |   [0.5, 1]   |              |              |                      |              |
|  mean_shift             |              | downsampled  |      bool    |         False        | True | False |    quantile  |    float     |         0.3          |    [0, 1]    |              |              |                      |              |
|  kmeans                 |              | downsampled  |      bool    |         False        | True | False |      k       |     int      |          3           |    [3,10]    |              |              |                      |              |


# Classification API

Example:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"classification", 'dataFeatures': [<list of feature strings>], 'file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {'downsampled': [True], 'eps': [0.7], 'k':[1,2,3,4,5]}, 'dataSelections': [], 'cid': 'wngyu'}


|         algorithmName          | Description  | parm 1 name  | parm 1 dtype | parm 1 default value | parm 1 range |     parm 2 name      | parm 2 dtype | parm 2 default value |     parm 2 range   |
|--------------------------------|--------------|--------------|--------------|----------------------|--------------|----------------------|--------------|----------------------|--------------------|
| AdaBoostClassifier             |              | downsampled  |      bool    |         False        | True | False | n_estimators         |     int      |          50          |     [1, 100]       |
| BaggingClassifier              |              | downsampled  |      bool    |         False        | True | False | n_estimators         |     int      |          10          |     [1, 100]       |
| BayesianGaussianMixture        |              | downsampled  |      bool    |         False        | True | False | n_components         |     int      |           1          |     [1, 100]       |
| BernoulliNB                    |              | downsampled  |      bool    |         False        | True | False |    alpha             |    float     |           1          |     [0, 100]       |
| CalibratedClassifierCV         |              | downsampled  |      bool    |         False        | True | False |    method            |    string    |       sigmoid        | sigmoid | isotonic |
| ComplementNB                   |              | downsampled  |      bool    |         False        | True | False |    alpha             |    float     |           1          |     [0, 100]       |
| DecisionTreeClassifier         |              | downsampled  |      bool    |         False        | True | False |  max_depth           |     int      |         None         |   None | [1, 1000] |
| ExtraTreesClassifier           |              | downsampled  |      bool    |         False        | True | False | n_estimators         |     int      |          10          |     [1, 100]       |
| ExtraTreeClassifier            |              | downsampled  |      bool    |         False        | True | False |  max_depth           |     int      |         None         |   None | [1, 1000] |
| GaussianMixture                |              | downsampled  |      bool    |         False        | True | False | n_components         |     int      |           1          |     [1, 100]       |
| GaussianNB                     |              | downsampled  |      bool    |         False        | True | False | var_smoothing        |    float     |         1e-09        |     [0, 100]       |
| GaussianProcessClassifier      |              | downsampled  |      bool    |         False        | True | False | n_restarts_optimizer |     int      |           0          |     [0, 100]       |
| GradientBoostingClassifier     |              | downsampled  |      bool    |         False        | True | False | n_estimators         |     int      |          100         |     [1, 1000]      |
| KNeighborsClassifier           |              | downsampled  |      bool    |         False        | True | False | n_neighbors          |     int      |           5          |     [1, 100]       |
| LabelPropagation               |              | downsampled  |      bool    |         False        | True | False | n_neighbors          |     int      |           5          |     [1, 100]       |
| LabelSpreading                 |              | downsampled  |      bool    |         False        | True | False | n_neighbors          |     int      |           5          |     [1, 100]       |
| LinearDiscriminantAnalysis     |              | downsampled  |      bool    |         False        | True | False | n_components         |     int      |           3          | [1, # features -1] |
| LogisticRegression             |              | downsampled  |      bool    |         False        | True | False | max_iter             |     int      |          100         |    [1, 10000]      |
| LogisticRegressionCV           |              | downsampled  |      bool    |         False        | True | False | max_iter             |     int      |          100         |    [1, 10000]      |
| MLPClassifier                  |              | downsampled  |      bool    |         False        | True | False | max_iter             |     int      |          200         |    [1, 10000]      |
| MultinomialNB                  |              | downsampled  |      bool    |         False        | True | False |    alpha             |    float     |           1          |     [0, 100]       |
| NuSVC                          |              | downsampled  |      bool    |         False        | True | False | max_iter             |     int      |          -1          |    [-1, 10000]     |
| QuadraticDiscriminantAnalysis  |              | downsampled  |      bool    |         False        | True | False | tol                  |    float     |         1.0e-4       |   [1.0e-6, 1.0e-2] |
| RandomForestClassifier         |              | downsampled  |      bool    |         False        | True | False | n_estimators         |     int      |          10          |     [1, 100]       |
| SGDClassifier                  |              | downsampled  |      bool    |         False        | True | False |    alpha             |    float     |        0.0001        |     [0, 100]       |
| SVC                            |              | downsampled  |      bool    |         False        | True | False | max_iter             |     int      |          -1          |    [-1, 10000]     |


# Regression API

Example:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"regression", 'dataFeatures': [<list of feature strings>], 'file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {'downsampled': [True], 'eps': [0.7], 'k':[1,2,3,4,5,5]}, 'dataSelections': [], 'cid': 'wngyu'}

|           algorithmName        | Description  | parm 1 name  | parm 1 dtype | parm 1 default value | parm 1 range |     parm 2 name      | parm 2 dtype | parm 2 default value |     parm 2 range   |
|--------------------------------|--------------|--------------|--------------|----------------------|--------------|----------------------|--------------|----------------------|--------------------|
| ARDRegression                  |              | downsampled  |      bool    |         False        | True | False | n_iter               |     int      |         300          |    [1, 10000]      |
| AdaBoostRegressor              |              | downsampled  |      bool    |         False        | True | False | n_estimators         |     int      |          50          |     [1, 1000]      |
| BaggingRegressor               |              | downsampled  |      bool    |         False        | True | False | n_estimators         |     int      |          10          |     [1, 1000]      |
| BayesianRidge                  |              | downsampled  |      bool    |         False        | True | False | n_estimators         |     int      |          300         |     [1, 1000]      |
| CCA                            |              | downsampled  |      bool    |         False        | True | False | max_iter             |     int      |          500         |     [1, 1000]      |
| DecisionTreeRegressor          |              | downsampled  |      bool    |         False        | True | False | max_depth            |     int      |         None         |   None | [1, 1000] |
| ElasticNet                     |              | downsampled  |      bool    |         False        | True | False | max_iter             |     int      |          -1          |    [-1, 10000]     |
| ElasticNetCV                   |              | downsampled  |      bool    |         False        | True | False | max_iter             |     int      |          -1          |    [-1, 10000]     |
| ExtraTreeRegressor             |              | downsampled  |      bool    |         False        | True | False | max_features         |     int      |       # features     |    [1, # features] |
| ExtraTreesRegressor            |              | downsampled  |      bool    |         False        | True | False | max_features         |     int      |       # features     |    [1, # features] |
| GaussianProcessRegressor       |              | downsampled  |      bool    |         False        | True | False | n_restarts_optimizer |     int      |           0          |        >= 0        |
| GradientBoostingRegressor      |              | downsampled  |      bool    |         False        | True | False | max_depth            |     int      |           3          |   None | [1, 1000] |
| HuberRegressor                 |              | downsampled  |      bool    |         False        | True | False | max_iter             |     int      |          100         |    [1, 10000]      |
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





