


# Client Server API

## Saving a CODEX Session
Client->Server
{"routine":"save_session", "session_name":<session name>}

## Loading a CODEX Session
Client->Server
{"routine":"load_session", "session_name":<session name>}

## Get List of Saved CODEX Sessions
Client->Server
{"routine":"get_sessions"}

Server->Client
{"sessions":[<session name1>, <session name2>]}
	Returns list of session names




## Clustering API

Example:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"clustering", 'dataFeatures': [<list of feature strings>], 'file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {'downsampled': True, 'eps': 0.7}, 'dataSelections': [], 'cid': 'wngyu'}


|     algorithmName       | Description  | parm 1 name  | parm 1 dtype | parm 1 default value |  parm 1 range | parm 2 name  | parm 2 dtype | parm 2 default value | parm 2 range | parm 3 name  | parm 3 dtype | parm 3 default value | parm 3 range |
|-------------------------|--------------|--------------|--------------|----------------------|---------------|--------------|--------------|----------------------|--------------|--------------|--------------|----------------------|--------------|
|  agglomerative          |              | downsampled  |      bool    |         False        | True or False |      k       |     int      |          3           |    [3,10]    |  n_neighbors |     int      |          5           |   [2, 1000]  |
|  dbscan                 |              | downsampled  |      bool    |         False        | True or False |     eps      |    float     |          5           |   [2, 1000]  |              |              |                      |              |
|  spectral               |              | downsampled  |      bool    |         False        | True or False |      k       |     int      |          3           |    [3,10]    |              |              |                      |              |
|  ward                   |              | downsampled  |      bool    |         False        | True or False |      k       |     int      |          3           |    [3,10]    |  n_neighbors |     int      |          5           |   [2, 1000]  |
|  birch                  |              | downsampled  |      bool    |         False        | True or False |      k       |     int      |          3           |    [3,10]    |              |              |                      |              |
|  affinity_propagation   |              | downsampled  |      bool    |         False        | True or False |    damping   |    float     |         0.5          |   [0.5, 1]   |              |              |                      |              |
|  mean_shift             |              | downsampled  |      bool    |         False        | True or False |    quantile  |    float     |         0.3          |    [0, 1]    |              |              |                      |              |
|  kmeans                 |              | downsampled  |      bool    |         False        | True or False |      k       |     int      |          3           |    [3,10]    |              |              |                      |              |


## Classification API

Example:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"classification", 'dataFeatures': [<list of feature strings>], 'file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {'downsampled': [True], 'eps': [0.7], 'k':[1,2,3,4,5]}, 'dataSelections': [], 'cid': 'wngyu'}


|         algorithmName          | Description  | parm 1 name  | parm 1 dtype | parm 1 default value |  parm 1 range | parm 2 name  | parm 2 dtype | parm 2 default value |  parm 2 range |     parm 3 name      | parm 3 dtype | parm 3 default value |     parm 3 range   |
|--------------------------------|--------------|--------------|--------------|----------------------|---------------|--------------|--------------|----------------------|---------------|----------------------|--------------|----------------------|--------------------|
| AdaBoostClassifier             |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_estimators         |     int      |          50          |     [1, 100]       |
| BaggingClassifier              |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_estimators         |     int      |          10          |     [1, 100]       |
| BayesianGaussianMixture        |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_components         |     int      |           1          |     [1, 100]       |
| BernoulliNB                    |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |    alpha             |    float     |           1          |     [0, 100]       |
| CalibratedClassifierCV         |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |    method            |    string    |       sigmoid        |sigmoid or isotonic |
| ComplementNB                   |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |    alpha             |    float     |           1          |     [0, 100]       |
| DecisionTreeClassifier         |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |  max_depth           |     int      |         None         |  None or [1, 1000] |
| ExtraTreesClassifier           |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_estimators         |     int      |          10          |     [1, 100]       |
| ExtraTreeClassifier            |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |  max_depth           |     int      |         None         |  None or [1, 1000] |
| GaussianMixture                |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_components         |     int      |           1          |     [1, 100]       |
| GaussianNB                     |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | var_smoothing        |    float     |         1e-09        |     [0, 100]       |
| GaussianProcessClassifier      |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_restarts_optimizer |     int      |           0          |     [0, 100]       |
| GradientBoostingClassifier     |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_estimators         |     int      |          100         |     [1, 1000]      |
| KNeighborsClassifier           |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_neighbors          |     int      |           5          |     [1, 100]       |
| LabelPropagation               |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_neighbors          |     int      |           5          |     [1, 100]       |
| LabelSpreading                 |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_neighbors          |     int      |           5          |     [1, 100]       |
| LinearDiscriminantAnalysis     |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_components         |     int      |           3          | [1, # features -1] |
| LogisticRegression             |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_iter             |     int      |          100         |    [1, 10000]      |
| LogisticRegressionCV           |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_iter             |     int      |          100         |    [1, 10000]      |
| MLPClassifier                  |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_iter             |     int      |          200         |    [1, 10000]      |
| MultinomialNB                  |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |    alpha             |    float     |           1          |     [0, 100]       |
| NuSVC                          |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_iter             |     int      |          -1          |    [-1, 10000]     |
| QuadraticDiscriminantAnalysis  |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | tol                  |    float     |         1.0e-4       |   [1.0e-6, 1.0e-2] |
| RandomForestClassifier         |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_estimators         |     int      |          10          |     [1, 100]       |
| SGDClassifier                  |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |    alpha             |    float     |        0.0001        |     [0, 100]       |
| SVC                            |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_iter             |     int      |          -1          |    [-1, 10000]     |


## Regression API

Example:
{"routine":"algorithm", "algorithmName":<name string>, "algorithmType":"regression", 'dataFeatures': [<list of feature strings>], 'file': <file name>, 'guidance': None, 'identification': {'id': 'dev0'}, 'parameters': {'downsampled': [True], 'eps': [0.7], 'k':[1,2,3,4,5,5]}, 'dataSelections': [], 'cid': 'wngyu'}

|           algorithmName        | Description  | parm 1 name  | parm 1 dtype | parm 1 default value |  parm 1 range |parm 2 name   | parm 2 dtype | parm 2 default value |  parm 2 range |     parm 3 name      | parm 3 dtype | parm 3 default value |     parm 3 range   |
|--------------------------------|--------------|--------------|--------------|----------------------|---------------|--------------|--------------|----------------------|---------------|----------------------|--------------|----------------------|--------------------|
| ARDRegression                  |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_iter               |     int      |         300          |    [1, 10000]      |
| AdaBoostRegressor              |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_estimators         |     int      |          50          |     [1, 1000]      |
| BaggingRegressor               |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_estimators         |     int      |          10          |     [1, 1000]      |
| BayesianRidge                  |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_estimators         |     int      |          300         |     [1, 1000]      |
| CCA                            |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_iter             |     int      |          500         |     [1, 1000]      |
| DecisionTreeRegressor          |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_depth            |     int      |         None         |  None or [1, 1000] |
| ElasticNet                     |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_iter             |     int      |          -1          |    [-1, 10000]     |
| ElasticNetCV                   |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_iter             |     int      |          -1          |    [-1, 10000]     |
| ExtraTreeRegressor             |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_features         |     int      |       # features     |    [1, # features] |
| ExtraTreesRegressor            |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_features         |     int      |       # features     |    [1, # features] |
| GaussianProcessRegressor       |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_restarts_optimizer |     int      |           0          |        >= 0        |
| GradientBoostingRegressor      |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_depth            |     int      |           3          |  None or [1, 1000] |
| HuberRegressor                 |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | max_iter             |     int      |          100         |    [1, 10000]      |
| KNeighborsRegressor            |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False | n_neighbors          |     int      |           5          |     [1,1000]       |
| KernelRidge                    |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| Lars                           |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| LarsCV                         |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| Lasso                          |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| LassoCV                        |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| LassoLars                      |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| LassoLarsCV                    |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| LassoLarsIC                    |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| LinearRegression               |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| LinearSVR                      |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| MLPRegressor                   |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| MultiTaskElasticNet            |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| MultiTaskElasticNetCV          |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| MultiTaskLasso                 |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| MultiTaskLassoCV               |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| NuSVR                          |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| OrthogonalMatchingPursuit      |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| OrthogonalMatchingPursuitCV    |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| PLSCanonical                   |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| PLSRegression                  |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| PassiveAggressiveRegressor     |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| RANSACRegressor                |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| RadiusNeighborsRegressor       |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| RandomForestRegressor          |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| Ridge                          |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| RidgeCV                        |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| SGDRegressor                   |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| SVR                            |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| TheilSenRegressor              |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |
| TransformedTargetRegressor     |              |  cross_val   |     int      |         5            |     scaler    | downsampled  |      bool    |         False        | True or False |





